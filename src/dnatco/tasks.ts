import { Result, isError, isOk } from './';
import { ClassificationResources } from './classification-resources';
import { Coordinates } from './coordinates';
import { DensityMap } from './density-map';
import { Dnatcofication, DnatcoficationTaskContext } from './dnatcofication';
import { SupportedRemoteDatabases } from '../remote-db/register';

async function tryIngestData(coordsResult: Result<Coordinates>, densityMapResult: Result<DensityMap>|null, sourceFileName: string|null, clsfResData: ClassificationResources.Data, ctx: DnatcoficationTaskContext) {
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
    'dnatco-from-custom-structure': async function (ctx: DnatcoficationTaskContext, payload: { coords: { file: File, type: Coordinates['type'] }, densityMapFile: File|null, clsfResData: ClassificationResources.Data }) {
        ctx.status = 'Reading data';
        const coordsResult = await Coordinates.fromFile(payload.coords.file, payload.coords.type);
        const densityMapResult = payload.densityMapFile ? await DensityMap.fromFile(payload.densityMapFile) : null;
        tryIngestData(coordsResult, densityMapResult, payload.coords.file.name, payload.clsfResData, ctx);
    },
    'dnatco-from-pdb-id': async function(ctx: DnatcoficationTaskContext, payload: { pdbId: string, db: SupportedRemoteDatabases, localDbUrl: string, localDbGzipped: boolean, clsfResData: ClassificationResources.Data }) {
        ctx.status = 'Downloading data';
        const coordsResult = await Coordinates.fromPdbId(payload.pdbId, payload.db, payload.localDbUrl, payload.localDbGzipped);
        const densityMapResult = await DensityMap.fromPdbId(payload.pdbId, payload.db);
        if (isError(densityMapResult))
            console.warn(densityMapResult.message); // Log a warning because we do not consider a density map fetch failure a hard failure
        tryIngestData(coordsResult, isOk(densityMapResult) ? densityMapResult : null, null, payload.clsfResData, ctx);
    },
    'dnatco-from-raw-link': async function(ctx: DnatcoficationTaskContext, payload: { coordsLink: string, densityMap: { link: string, type: DensityMap['type'] }, clsfResData: ClassificationResources.Data } ) {
        ctx.status = 'Downloading data';
        const coordsResult = await Coordinates.fromLink(payload.coordsLink, 'cif'); // @nocheckin HACK
        const densityMapResult = payload.densityMap ? await DensityMap.fromLink(payload.densityMap.link, payload.densityMap.type) : null;
        tryIngestData(coordsResult, densityMapResult, null, payload.clsfResData, ctx);
    }
}
