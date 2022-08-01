import * as jsLLKA from 'jsLLKA';
import { ClassificationResources } from './classification-resources';
import { DnatcoficationTaskContext } from './dnatcofication';
import { M } from '../util/math';

const ClassificationLimits: jsLLKA.LLKAClassificationLimits = {
    minimumNearestNeighbors: 7,
    numberOfUsedNearestNeighbors: 11,
    minimumClusterVotes: 0.001111,
    averageNeighborsTorsionCutoff: M.d2r(28.0),
    nearestNeighborTorsionsCutoff: M.d2r(28.0),
    manhattanDistanceCutoff: M.d2r(60.0),
    pseudorotationCutoff: M.d2r(72.0)
};

export namespace Dnatcofier {
    function initializeClassificationContext(data: ClassificationResources.Data) {
        const resClusters = jsLLKA.LLKA.loadClusters(data.clusters);
        if (!resClusters.isSuccess()) {
            const fail = resClusters.failure();
            resClusters.delete();
            throw new Error(`Failed to load clusters definition: ${jsLLKA.LLKA.errorToString(fail)}`);
        }

        const resConfals = jsLLKA.LLKA.loadConfals(data.confals);
        if (!resConfals.isSuccess()) {
            const fail = resConfals.failure();
            resClusters.delete();
            resConfals.delete();
            throw new Error(`Failed to load confals definitions: ${jsLLKA.LLKA.errorToString(fail)}`);
        }

        const resGoldenSteps = jsLLKA.LLKA.loadGoldenSteps(data.goldenSteps);
        if (!resGoldenSteps.isSuccess()) {
            const fail = resGoldenSteps.failure();
            resClusters.delete();
            resConfals.delete();
            resGoldenSteps.delete();
            throw new Error(`Failed to load golden steps definitions: ${jsLLKA.LLKA.errorToString(fail)}`);
        }

        const resNus = jsLLKA.LLKA.loadAverageNuAngles(data.nuAngles);
        if (!resNus.isSuccess()) {
            const fail = resNus.failure();
            resClusters.delete();
            resConfals.delete();
            resGoldenSteps.delete();
            resNus.delete();
            throw new Error(`Failed to load average Nu angles definitions: ${jsLLKA.LLKA.errorToString(fail)}`);
        }

        const resCtx = jsLLKA.LLKA.initializeClassificationContext(
            resClusters.success(),
            resGoldenSteps.success(),
            resConfals.success(),
            resNus.success(),
            ClassificationLimits
        );

        if (!resCtx.isSuccess()) {
            const fail = resCtx.failure();
            resClusters.delete();
            resConfals.delete();
            resGoldenSteps.delete();
            resNus.delete();
            throw new Error(`Failed to initialize classification context: ${jsLLKA.LLKA.errorToString(fail)}`);
        }

        const clsfCtx = resCtx.success();

        resClusters.delete();
        resConfals.delete();
        resGoldenSteps.delete();
        resNus.delete();
        resCtx.delete();

        return clsfCtx;
    }

    export function dnatcoify(cif: string, clsfCtxData: ClassificationResources.Data, ctx: DnatcoficationTaskContext) {
        ctx.status = 'Initializing classification context';

        const clsfCtx = initializeClassificationContext(clsfCtxData);

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

