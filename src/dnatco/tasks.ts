import { Result, isError, isOk } from './';
import { ClassificationResources } from './classification-resources';
import { Coordinates } from './coordinates';
import { DensityMap } from './density-map';
import { Dnatcofication, DnatcoficationTaskContext } from './dnatcofication';
import { UserRemoteDatabases, BuiltInRemoteDatabases } from '../remote-db/register';
import { StaticDb } from '../remote-db/static-db';

async function tryIngestData(coordsResult: Result<Coordinates>, densityMapResult: Result<DensityMap[]>|null, sourceFileName: string|null, clsfResData: ClassificationResources.Data, ctx: DnatcoficationTaskContext) {
    if (isOk(coordsResult) && (!densityMapResult || isOk(densityMapResult))) {
        Dnatcofication.ingest(coordsResult.data, densityMapResult ? densityMapResult.data : null, sourceFileName, clsfResData, ctx);
    } else {
        const errors = new Array<string>();
        if (isError(coordsResult))
            errors.push(`Problem with coordinates - ${coordsResult.message}`);
        if (densityMapResult && isError(densityMapResult))
            errors.push(`Problem with density map - ${densityMapResult.message}`);

        ctx.events.finished.next({ state: 'failed', message: errors.join(', ') });
    }
}

export const Tasks = {
    'dnatco-from-custom-structure': async function(
        ctx: DnatcoficationTaskContext,
        payload: {
            coords: { file: File, type: Coordinates['type'] },
            densityMap: { file: File, kind: DensityMap['kind'] }|null,
            clsfResData: ClassificationResources.Data,
        }
    ) {
        ctx.status = 'Reading data';
        const coordsResult = await Coordinates.fromFile(payload.coords.file, payload.coords.type);
        const densityMapResult = payload.densityMap ? await DensityMap.fromFile(payload.densityMap.file, payload.densityMap.kind) : null;
        tryIngestData(coordsResult, densityMapResult, payload.coords.file.name, payload.clsfResData, ctx);
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
        tryIngestData(coordsResult, isOk(densityMapResult) ? densityMapResult : null, null, payload.clsfResData, ctx);
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
        tryIngestData(coordsResult, densityMapResult, null, payload.clsfResData, ctx);
    }
}
