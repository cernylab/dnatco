import * as jsLLKA from 'jsllka';
import { ClassificationContext } from './classification-context';
import { ClassificationResources } from './classification-resources';
import { DnatcoficationTaskContext } from './dnatcofication';
import { AnglesLengths, AnglesLengthsContext } from './angles-lengths';
import { Measurements } from './angles-lengths/measurements';
import { Naval, NavalContext } from './naval';

export namespace Dnatcofier {
    export function destroyImported(imported: jsLLKA.LLKAImportedStructure) {
        imported.structure.delete();
        imported.cifData.blocks.delete();
    }

    export function dnatcoify(steps: jsLLKA.LLKAStructures, imported: jsLLKA.LLKAImportedStructure, clsfCtxData: ClassificationResources.Data, ctx: DnatcoficationTaskContext) {
        ctx.status = 'Initializing classification context';
        const clsfCtx = ClassificationContext.initializeContext(clsfCtxData);

        ctx.status = 'Classifying dinucleotide steps';
        const res = jsLLKA.classifySteps(steps, clsfCtx);
        if (!res.isSuccess()) {
            clsfCtx.delete();
            const fail = res.failure();
            res.delete();

            throw new Error(`Failed to classify steps: ${jsLLKA.LLKA.errorToString(fail)}`);
        }

        const attemptedSteps = res.success();
        res.delete();

        const avgConfal = jsLLKA.LLKA.averageConfalAttempted(attemptedSteps, clsfCtx);

        ctx.status = 'Adding DNATCO categories to mmCIF';
        const cifDataDNATCO = jsLLKA.addDNATCOCategoriesToCif(imported.cifData, attemptedSteps, avgConfal, steps, imported.id);
        attemptedSteps.delete();
        clsfCtx.delete();

        ctx.status = 'Writing out extended mmCIF file';
        const res2 = jsLLKA.cifDataToString(cifDataDNATCO, true);
        if (!res2.isSuccess()) {
            const fail = res2.failure();
            res2.delete();

            throw new Error(`Failed to write out extended mmCIF: ${jsLLKA.LLKA.errorToString(fail)}`);
        }

        const extendedCif = res2.success();
        res2.delete();

        return extendedCif;
    }

    export function importStructure(cif: string, ctx: DnatcoficationTaskContext) {
        ctx.status = 'Reading mmCIF data';
        const res = jsLLKA.cifToStructure(cif, jsLLKA.MINICIF_GET_CIFDATA);
        if (!res.isSuccess()) {
            const fail = res.failure();
            res.delete();

            throw new Error(`${jsLLKA.LLKA.errorToString(fail.tRet)} ${fail.error ?? ''}`);
        }

        const imported = res.success();
        res.delete();

        return imported;
    }

    export function measureAnglesAndLengths(steps: jsLLKA.LLKAStructures, alCtx: AnglesLengthsContext, ctx: DnatcoficationTaskContext) {
        ctx.status = 'Measuring bond angles and lengths';

        AnglesLengths.initializeFromContext(alCtx);

        return Measurements.allSteps(steps);
    }

    export function makeNavalValidation(imported: jsLLKA.LLKAImportedStructure, nvCtx: NavalContext, ctx: DnatcoficationTaskContext) {
        ctx.status = 'Preparing Naval validation report';

        return Naval.validate(imported.structure, imported.id, nvCtx.angles, nvCtx.bonds)
    }

    export function steps(stru: jsLLKA.LLKAStructure, ctx: DnatcoficationTaskContext) {
        ctx.status = 'Splitting structrure to dinucleotide steps';
        const res = jsLLKA.splitStructureToDinucleotideSteps(stru);
        if (!res.isSuccess()) {
            const fail = res.failure();
            res.delete();
            throw new Error(jsLLKA.LLKA.errorToString(fail));
        }

        const steps = res.success();
        res.delete();

        return steps;
    }
}
