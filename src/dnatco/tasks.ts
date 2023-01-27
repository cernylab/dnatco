import { OkResult, Result, isError, isOk } from './';
import { ClassificationResources } from './classification-resources';
import { Coordinates } from './coordinates';
import { DensityMap } from './density-map';
import { Dnatcofication, DnatcoficationData, DnatcoficationTaskContext } from './dnatcofication';
import { UserRemoteDatabases, BuiltInRemoteDatabases } from '../remote/db/register';
import { Rscc } from '../remote/rscc';
import { StaticDb } from '../remote/db/static-db';

async function tryGetDensityMaps(dmFiles: { file: File, kind: DensityMap['kind'] }[]) {
    const results = [];

    for (const f of dmFiles) {
        const r = await DensityMap.fromFile(f.file, f.kind);
        results.push(r);
    }

    return results;
}

async function tryGetRscc(coords: File, coeffs: File, ctx: DnatcoficationTaskContext, data: DnatcoficationData) {
    ctx.events.statusChanged.next('Getting RSCC coefficients');

    const coordsType = Coordinates.guessType(coords);
    if (coordsType === 'unknown') {
        ctx.events.finished.next({ state: 'failed', message: 'Cannot determine coordinates file type' });
        return;
    }

    const r = await Rscc.calculateRemotely(coords, coordsType, coeffs);
    if (r.success) {
        Dnatcofication.addRscc(data, r.payload);
        ctx.events.finished.next({ state: 'succeeded', data });
    } else {
        ctx.events.finished.next({ state: 'failed', message: r.message ?? 'Unknown error' });
    }
}

async function tryIngestData(coordsResult: Result<Coordinates>, densityMapsResult: Result<DensityMap[]>[], sourceFileName: string|null, clsfResData: ClassificationResources.Data, ctx: DnatcoficationTaskContext) {
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
        return Dnatcofication.ingest((coordsResult as OkResult<Coordinates>).data, densityMaps, sourceFileName, clsfResData, ctx);
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
            clsfResData: ClassificationResources.Data,
        }
    ) {
        ctx.status = 'Reading data';
        const coordsResult = await Coordinates.fromFile(payload.coords.file, payload.coords.type);
        const densityMaps = await tryGetDensityMaps(payload.densityMaps);

        const data = await tryIngestData(coordsResult, densityMaps, payload.coords.file.name, payload.clsfResData, ctx);
        if (!data)
            return;

        if (payload.densityMapCoeffs) {
            // The "await" here is necessary for the worker thread to stay alive until the Rscc query finishes, apparently
            await tryGetRscc(payload.coords.file, payload.densityMapCoeffs, ctx, data);
        } else
            ctx.events.finished.next({ state: 'succeeded', data });
    },
    'dnatco-from-pdb-id': async function(
        ctx: DnatcoficationTaskContext,
        payload: {
            pdbId: string,
            dbId: string,
            clsfResData: ClassificationResources.Data,
            userDatabases: StaticDb[],
        }
    ) {
        UserRemoteDatabases._import(payload.userDatabases);

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
            console.warn(densityMapResult.message); // Log a warning because we do not consider a density map fetch failure a hard failure

        let data = await tryIngestData(coordsResult, isOk(densityMapResult) ? [densityMapResult] : [], null, payload.clsfResData, ctx);
        if (data)
            ctx.events.finished.next({ state: 'succeeded', data });
    },
    'dnatco-from-raw-link': async function(
        ctx: DnatcoficationTaskContext,
        payload: {
            coords: { link: string, type: Coordinates['type'] },
            densityMap: { link: string, type: DensityMap['type'], kind: DensityMap['kind'] }|null,
            clsfResData: ClassificationResources.Data,
        }
    ) {
        ctx.status = 'Downloading data';
        const coordsResult = await Coordinates.fromLink(payload.coords.link, payload.coords.type);
        const densityMapResult = payload.densityMap ? await DensityMap.fromLink(payload.densityMap.link, payload.densityMap.type, payload.densityMap.kind) : null;
        const data = await tryIngestData(coordsResult, densityMapResult ? [densityMapResult] : [], null, payload.clsfResData, ctx);
        if (data)
            ctx.events.finished.next({ state: 'succeeded', data });
    }
}
