import { OkResult, Result, isError, isOk } from './';
import { AnglesLengthsContext } from './angles-lengths';
import { ClassificationResources } from './classification-resources';
import { Coordinates } from './coordinates';
import { DensityMap } from './density-map';
import { Dnatcofication, DnatcoficationData, DnatcoficationTaskContext } from './dnatcofication';
import { NavalContext } from './naval';
import { Logger } from '../log/logger';
import { UserRemoteDatabases, BuiltInRemoteDatabases } from '../remote/db/register';
import { Rscc } from '../remote/rscc';
import { GlobalConfig, GlobalConfigData } from '../global-config';
import { getCifValue } from '../util/dnatco';
import { Refine } from '../cif/categories/refine';
import { Em3dReconstruction } from '../cif/categories/em-3d-reconstruction';
import { Exptl } from '../cif/categories/experimental';

async function getConfigData() {
    if (GlobalConfig.isLoaded())
        return GlobalConfig.data();
    else {
        const input = await GlobalConfig.fetchConfigFile();
        GlobalConfig.load(input);

        return GlobalConfig.data();
    }
}

async function tryGetDensityMaps(dmFiles: { file: File, kind: DensityMap['kind'] }[]) {
    const results = [];

    for (const f of dmFiles) {
        const r = await DensityMap.fromFile(f.file, f.kind);
        results.push(r);
    }

    return results;
}

function extractResolution(d: Dnatcofication): number {
    // Get experimental method to determine which resolution field to use
    const method = getCifValue(d, Exptl, 'method');

    if (method === 'electron microscopy') {
        // EM structures: use em_3d_reconstruction.resolution
        const emRes = getCifValue(d, Em3dReconstruction, 'resolution');
        return emRes ?? 0;
    } else {
        // X-ray/NMR structures: use refine.ls_d_res_high
        const xrayRes = getCifValue(d, Refine, 'ls_d_res_high');
        return xrayRes ?? 0;
    }
}

async function tryGetRscc(coords: File, densityFile: File, mapKind: string, resolution: number, ctx: DnatcoficationTaskContext, data: DnatcoficationData) {
    ctx.events.statusChanged.next('Calculating RSCC values');

    const coordsType = Coordinates.guessType(coords);
    if (coordsType === 'unknown') {
        ctx.events.finished.next({ state: 'failed', message: 'Cannot determine coordinates file type' });
        return;
    }

    const r = await Rscc.calculateRemotely(coords, coordsType, densityFile, mapKind, resolution);
    if (r.success) {
        Dnatcofication.addRscc(data, r.payload);
        ctx.events.finished.next({ state: 'succeeded', data });
    } else {
        // RSCC calculation failed - report as failed but include data so the app can continue
        ctx.events.finished.next({ state: 'failed', data, message: `RSCC calculation failed: ${r.message ?? 'Unknown error'}` });
    }
}

async function tryIngestData(
    coordsResult: Result<Coordinates>,
    densityMapsResult: Result<DensityMap[]>[],
    sourceFileName: string|null,
    clsfResData: ClassificationResources.Data,
    alCtx: AnglesLengthsContext,
    nvCtx: NavalContext,
    isCustomStructure: boolean,
    configData: GlobalConfigData,
    ctx: DnatcoficationTaskContext
) {
    const errors = new Array<string>();
    const densityMaps = [];

    if (isError(coordsResult))
        errors.push(`Problem with coordinates - ${coordsResult.message}`);
    for (const dmr of densityMapsResult) {
        if (isError(dmr))
            errors.push(`Problem with density map - ${dmr.message}`);
        else
            densityMaps.push(...dmr.data);
    }

    if (errors.length === 0) {
        return Dnatcofication.ingest((coordsResult as OkResult<Coordinates>).data, densityMaps, sourceFileName, clsfResData, alCtx, nvCtx, isCustomStructure, configData, ctx);
    } else {
        ctx.events.finished.next({ state: 'failed', message: errors.join(', ') });

        return void 0;
    }
}

export const Tasks = {
    'dnatco-from-custom-structure': async function(
        ctx: DnatcoficationTaskContext,
        payload: {
            coords: { file: File, type: Coordinates['type'] },
            densityMaps: { file: File, kind: DensityMap['kind'] }[],
            densityMapCoeffs: File|null,
            skipRsccCalculation?: boolean,
            clsfResData: ClassificationResources.Data,
            alCtx: AnglesLengthsContext,
            nvCtx: NavalContext,
        }
    ) {
        try {
            const configData = await getConfigData();
            Logger.initialize(configData.displayedProductName, { minSeverity: configData.minSeverity });
            UserRemoteDatabases._import(configData.userDatabases);

            ctx.status = 'Reading data';
            const coordsResult = await Coordinates.fromFile(payload.coords.file, payload.coords.type);
            const densityMapsResults = await tryGetDensityMaps(payload.densityMaps);

            const data = await tryIngestData(coordsResult, densityMapsResults, payload.coords.file.name, payload.clsfResData, payload.alCtx, payload.nvCtx, true, configData, ctx);
            if (!data)
                return;

            // Check if RSCC calculation should be skipped
            if (payload.skipRsccCalculation) {
                console.log('RSCC calculation skipped by user request');
                ctx.events.finished.next({ state: 'succeeded', data });
                return;
            }

            // Build a map of file -> detected type from the processed density maps
            const fileTypeMap = new Map<File, DensityMap['type']>();
            for (let i = 0; i < payload.densityMaps.length; i++) {
                const result = densityMapsResults[i];
                if (isOk(result) && result.data.length > 0) {
                    fileTypeMap.set(payload.densityMaps[i].file, result.data[0].type);
                }
            }

            // Determine which file to use for RSCC calculation
            let rsccFile: File | null = null;
            let mapKind = 'coefficients'; // Default for MTZ

            if (payload.densityMapCoeffs) {
                // MTZ coefficients take priority
                rsccFile = payload.densityMapCoeffs;
                mapKind = 'coefficients';
            } else if (payload.densityMaps.length > 0) {
                // If no MTZ, use density maps in priority order: 2fo-fc > em
                // Note: fo-fc maps and DSN6 maps are only for visualization, not for RSCC calculation
                const map2fofc = payload.densityMaps.find(m => {
                    if (m.kind !== '2fo-fc') return false;
                    const type = fileTypeMap.get(m.file);
                    return type !== 'dsn6'; // Exclude DSN6 files from RSCC
                });
                const mapEm = payload.densityMaps.find(m => {
                    if (m.kind !== 'em') return false;
                    const type = fileTypeMap.get(m.file);
                    return type !== 'dsn6'; // Exclude DSN6 files from RSCC
                });

                if (map2fofc) {
                    rsccFile = map2fofc.file;
                    mapKind = '2fo-fc';
                } else if (mapEm) {
                    rsccFile = mapEm.file;
                    mapKind = 'em';
                }
                // fo-fc maps and DSN6 maps are skipped - only used for visualization
            }

            if (rsccFile) {
                // Create temporary Dnatcofication object to extract resolution
                const tempDnatco = new Dnatcofication();
                tempDnatco.data = data;
                const resolution = extractResolution(tempDnatco);

                // The "await" here is necessary for the worker thread to stay alive until the Rscc query finishes, apparently
                await tryGetRscc(payload.coords.file, rsccFile, mapKind, resolution, ctx, data);
            } else {
                ctx.events.finished.next({ state: 'succeeded', data });
            }
        } catch (e) {
            ctx.events.finished.next({ state: 'failed', message: (e as Error).message });
        }
    },
    'dnatco-from-pdb-id': async function(
        ctx: DnatcoficationTaskContext,
        payload: {
            pdbId: string,
            dbId: string,
            clsfResData: ClassificationResources.Data,
            alCtx: AnglesLengthsContext,
            nvCtx: NavalContext,
        }
    ) {
        try {
            const configData = await getConfigData();
            Logger.initialize(configData.displayedProductName, { minSeverity: configData.minSeverity });
            UserRemoteDatabases._import(configData.userDatabases);

            ctx.status = 'Downloading data';

            const db = UserRemoteDatabases.exists(payload.dbId)
                ? UserRemoteDatabases.get(payload.dbId)
                : BuiltInRemoteDatabases[payload.dbId as keyof typeof BuiltInRemoteDatabases];
            if (!db) {
                ctx.events.finished.next({ state: 'failed', message: 'Unknown database ID' });
                return;
            }

            const coordsResult = await Coordinates.fromPdbId(payload.pdbId, db);
            const densityMapResult = await DensityMap.fromPdbId(payload.pdbId, db);
            if (isError(densityMapResult))
                Logger.log(Logger.Severity.Warning, densityMapResult.message); // Log a warning because we do not consider a density map fetch failure a hard failure

            let data = await tryIngestData(coordsResult, isOk(densityMapResult) ? [densityMapResult] : [], null, payload.clsfResData, payload.alCtx, payload.nvCtx, false, configData, ctx);
            if (data)
                ctx.events.finished.next({ state: 'succeeded', data });
        } catch (e) {
            ctx.events.finished.next({ state: 'failed', message: (e as Error).message });
        }
    },
    'dnatco-from-raw-link': async function(
        ctx: DnatcoficationTaskContext,
        payload: {
            coords: { link: string, type: Coordinates['type'] },
            densityMap: { link: string, type: DensityMap['type'], kind: DensityMap['kind'] }|null,
            clsfResData: ClassificationResources.Data,
            alCtx: AnglesLengthsContext,
            nvCtx: NavalContext,
        }
    ) {
        try {
            const configData = await getConfigData();
            Logger.initialize(configData.displayedProductName, { minSeverity: configData.minSeverity });
            UserRemoteDatabases._import(configData.userDatabases);

            ctx.status = 'Downloading data';
            const coordsResult = await Coordinates.fromLink(payload.coords.link, payload.coords.type);
            const densityMapResult = payload.densityMap ? await DensityMap.fromLink(payload.densityMap.link, payload.densityMap.type, payload.densityMap.kind) : null;
            const data = await tryIngestData(coordsResult, densityMapResult ? [densityMapResult] : [], null, payload.clsfResData, payload.alCtx, payload.nvCtx, false, configData, ctx);
            if (data)
                ctx.events.finished.next({ state: 'succeeded', data });
        } catch (e) {
            ctx.events.finished.next({ state: 'failed', message: (e as Error).message });
        }
    }
}
