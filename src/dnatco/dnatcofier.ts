import * as jsLLKA from 'jsLLKA';
import { M } from '../util/math';

let ClassificationContext: jsLLKA.LLKAClassificationContext|undefined = undefined;

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
    async function loadClassificationDefinitions(): Promise<{ clusters: string, confals: string, goldenSteps: string, nuAngles: string }> {
        let clusters = '';
        let confals = '';
        let goldenSteps = '';
        let nuAngles = '';

        const clustersResp = fetch('classification/clusters.csv');
        const confalsResp = fetch('classification/confals.csv');
        const goldenStepsResp = fetch('classification/golden_steps.csv');
        const nuAnglesResp = fetch('classification/nu_angles.csv');

        let r = await clustersResp;
        if (!r.ok)
            throw new Error(`Failed to download clusters definitions: ${r.status} ${r.statusText}`);
        clusters = await r.text();

        r = await confalsResp;
        if (!r.ok)
            throw new Error(`Failed to download confals definitions: ${r.status} ${r.statusText}`);
        confals = await r.text();

        r = await goldenStepsResp;
        if (!r.ok)
            throw new Error(`Failed to download golden steps definitions: ${r.status} ${r.statusText}`);
        goldenSteps = await r.text();

        r = await nuAnglesResp;
        if (!r.ok)
            throw new Error(`Failed to download average Nu angles definitions: ${r.status} ${r.statusText}`);
        nuAngles = await r.text();
        return { clusters, confals, goldenSteps, nuAngles };

    }

    async function initializeClassificationContext() {
        const { clusters, confals, goldenSteps, nuAngles } = await loadClassificationDefinitions();

        const resClusters = jsLLKA.LLKA.loadClusters(clusters);
        if (!resClusters.isSuccess()) {
            const fail = resClusters.failure();
            resClusters.delete();
            throw new Error(`Failed to load clusters definition: ${jsLLKA.LLKA.errorToString(fail)}`);
        }

        const resConfals = jsLLKA.LLKA.loadConfals(confals);
        if (!resConfals.isSuccess()) {
            const fail = resConfals.failure();
            resClusters.delete();
            resConfals.delete();
            throw new Error(`Failed to load confals definitions: ${jsLLKA.LLKA.errorToString(fail)}`);
        }

        const resGoldenSteps = jsLLKA.LLKA.loadGoldenSteps(goldenSteps);
        if (!resGoldenSteps.isSuccess()) {
            const fail = resGoldenSteps.failure();
            resClusters.delete();
            resConfals.delete();
            resGoldenSteps.delete();
            throw new Error(`Failed to load golden steps definitions: ${jsLLKA.LLKA.errorToString(fail)}`);
        }

        const resNus = jsLLKA.LLKA.loadAverageNuAngles(nuAngles);
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

        ClassificationContext = resCtx.success();

        resClusters.delete();
        resConfals.delete();
        resGoldenSteps.delete();
        resNus.delete();
        resCtx.delete();
    }

    export function dnatcoify(cif: string) {
        const res = jsLLKA.cifToStructure(cif, jsLLKA.MINICIF_GET_CIFDATA);
        if (!res.isSuccess()) {
            const fail = res.failure();
            res.delete();
            throw new Error(`Failed to process CIF: ${jsLLKA.LLKA.errorToString(fail.tRet)} ${fail.error ?? ''}`);
        }
        console.log('CIF parsed');

        const importedStru = res.success();
        const cifData = importedStru.cifData;
        res.delete();

        const res2 = jsLLKA.splitStructureToDinucleotideSteps(importedStru.structure);
        if (!res2.isSuccess()) {
            const fail = res2.failure();
            res2.delete();
            throw new Error(`Failed to split structure into dinucleotide steps: ${jsLLKA.LLKA.errorToString(fail)}`);
        }
        console.log('Structure splitted to dinucleotides');

        const steps = res2.success();
        res2.delete();

        const res3 = jsLLKA.classifySteps(steps, ClassificationContext!);
        if (!res3.isSuccess()) {
            const fail = res3.failure();
            res3.delete();
            throw new Error(`Failed to classify steps: ${jsLLKA.LLKA.errorToString(fail)}`);
        }
        console.log('Steps classified');

        const attemptedSteps = res3.success();
        res3.delete();

        const cifDataDNATCO = jsLLKA.addDNATCOCategoriesToCif(cifData, attemptedSteps, steps, importedStru.id, false);
        steps.delete();
        attemptedSteps.delete();
        console.log('Classification data added to CifData');

        const res4 = jsLLKA.cifDataToString(cifDataDNATCO, true);
        if (!res4.isSuccess()) {
            const fail = res4.failure();
            res4.delete();
            throw new Error(`Failed to write out extended CIF: ${jsLLKA.LLKA.errorToString(fail)}`);
        }
        console.log('Extended CIF written out');

        const extendedCif = res4.success();
        res4.delete();

        return extendedCif;
    }

    export async function initialize() {
        await initializeClassificationContext();
    }
}

