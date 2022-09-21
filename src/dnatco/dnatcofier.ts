import * as jsLLKA from 'jsLLKA';
import { ClassificationContext } from './classification-context';
import { ClassificationResources } from './classification-resources';
import { DnatcoficationTaskContext } from './dnatcofication';


export namespace Dnatcofier {
    export function dnatcoify(cif: string, clsfCtxData: ClassificationResources.Data, ctx: DnatcoficationTaskContext) {
        ctx.status = 'Initializing classification context';

        const clsfCtx = ClassificationContext.initializeContext(clsfCtxData);

        ctx.status = 'Reading CIF data';
        const res = jsLLKA.cifToStructure(cif, jsLLKA.MINICIF_GET_CIFDATA);
        if (!res.isSuccess()) {
            clsfCtx.delete();
            const fail = res.failure();
            res.delete();
            throw new Error(`Failed to process CIF: ${jsLLKA.LLKA.errorToString(fail.tRet)} ${fail.error ?? ''}`);
        }

        const importedStru = res.success();
        const cifData = importedStru.cifData;
        res.delete();

        ctx.status = 'Splitting structrure to dinucletide steps';
        const res2 = jsLLKA.splitStructureToDinucleotideSteps(importedStru.structure);
        if (!res2.isSuccess()) {
            clsfCtx.delete();
            const fail = res2.failure();
            res2.delete();
            throw new Error(`Failed to split structure into dinucleotide steps: ${jsLLKA.LLKA.errorToString(fail)}`);
        }

        const steps = res2.success();
        res2.delete();

        ctx.status = 'Classifying dinucleotide steps';
        const res3 = jsLLKA.classifySteps(steps, clsfCtx);
        if (!res3.isSuccess()) {
            clsfCtx.delete();
            const fail = res3.failure();
            res3.delete();
            throw new Error(`Failed to classify steps: ${jsLLKA.LLKA.errorToString(fail)}`);
        }

        const attemptedSteps = res3.success();
        res3.delete();

        ctx.status = 'Adding DNATCO categories to CIF';
        const cifDataDNATCO = jsLLKA.addDNATCOCategoriesToCif(cifData, attemptedSteps, steps, importedStru.id);
        steps.delete();
        attemptedSteps.delete();
        clsfCtx.delete();

        ctx.status = 'Writing out extended CIF file';
        const res4 = jsLLKA.cifDataToString(cifDataDNATCO, true);
        if (!res4.isSuccess()) {
            const fail = res4.failure();
            res4.delete();
            throw new Error(`Failed to write out extended CIF: ${jsLLKA.LLKA.errorToString(fail)}`);
        }

        const extendedCif = res4.success();
        res4.delete();

        return extendedCif;
    }
}

