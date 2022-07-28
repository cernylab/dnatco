import { Result, isError, isOk } from './';
import { ClassificationResources } from './classification-resources';
import { Dnatcofication, DnatcoficationTaskContext } from './dnatcofication';
import { Engine } from './engine';

function tryIngestCif(result: Result<string>, clsfResData: ClassificationResources.Data, ctx: DnatcoficationTaskContext) {
    if (isOk(result)) {
        Dnatcofication.ingest(result.data, clsfResData, ctx);
    } else if (isError(result)) {
        ctx.events.finished.next({ state: 'failed', message: result.message });
    }
}

export const Tasks = {
    'dnatco-from-custom-structure': async function (ctx: DnatcoficationTaskContext, payload: { coordsFile: File, densityMapFile: File|null, clsfResData: ClassificationResources.Data }) {
        const result = await Engine.dnatcoifyCustom(payload.coordsFile, payload.densityMapFile);
        tryIngestCif(result, payload.clsfResData, ctx);
    },
    'dnatco-from-pdb-id': async function(ctx: DnatcoficationTaskContext, payload: { pdbId: string, clsfResData: ClassificationResources.Data }) {
        const result = await Engine.dnatcoifyPdbId(payload.pdbId);
        tryIngestCif(result, payload.clsfResData, ctx);
    },
    'dnatco-from-raw-link': async function(ctx: DnatcoficationTaskContext, payload: { link: string, clsfResData: ClassificationResources.Data } ) {
        const result = await Engine.dnatcoifyLink(payload.link);
        tryIngestCif(result, payload.clsfResData, ctx);
    }
}
