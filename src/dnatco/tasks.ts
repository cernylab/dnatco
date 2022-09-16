import { Result, isError, isOk } from './';
import { ClassificationResources } from './classification-resources';
import { Dnatcofication, DnatcoficationTaskContext } from './dnatcofication';
import { Reader } from './reader';

function tryIngestCif(result: Result<string>, sourceFileName: string|null, clsfResData: ClassificationResources.Data, ctx: DnatcoficationTaskContext) {
    if (isOk(result)) {
        Dnatcofication.ingest(result.data, sourceFileName, clsfResData, ctx);
    } else if (isError(result)) {
        ctx.events.finished.next({ state: 'failed', message: result.message });
    }
}

export const Tasks = {
    'dnatco-from-custom-structure': async function (ctx: DnatcoficationTaskContext, payload: { coordsFile: File, densityMapFile: File|null, clsfResData: ClassificationResources.Data }) {
        ctx.status = 'Reading file';
        const result = await Reader.fromFile(payload.coordsFile, payload.densityMapFile);
        tryIngestCif(result, payload.coordsFile.name, payload.clsfResData, ctx);
    },
    'dnatco-from-pdb-id': async function(ctx: DnatcoficationTaskContext, payload: { pdbId: string, db: Reader.SupportedDatabases, localDbUrl: string, localDbGzipped: boolean, clsfResData: ClassificationResources.Data }) {
        ctx.status = 'Downloading file';
        const result = await Reader.fromPdbId(payload.pdbId, payload.db, payload.localDbUrl, payload.localDbGzipped);
        tryIngestCif(result, null, payload.clsfResData, ctx);
    },
    'dnatco-from-raw-link': async function(ctx: DnatcoficationTaskContext, payload: { link: string, clsfResData: ClassificationResources.Data } ) {
        ctx.status = 'Downloading file';
        const result = await Reader.fromLink(payload.link);
        tryIngestCif(result, null, payload.clsfResData, ctx);
    }
}
