import { ClassificationResources } from './classification-resources';
import * as jsLLKA from 'jsLLKA';
import { M } from '../util/math';

let _contextData: ClassificationResources.Data|null = null;
let _theContext: jsLLKA.LLKAClassificationContext|null = null;

const ClassificationLimits: jsLLKA.LLKAClassificationLimits = {
    minimumNearestNeighbors: 7,
    numberOfUsedNearestNeighbors: 11,
    minimumClusterVotes: 0.001111,
    averageNeighborsTorsionCutoff: M.d2r(28.0),
    nearestNeighborTorsionsCutoff: M.d2r(28.0),
    totalDistanceCutoff: M.d2r(60.0),
    pseudorotationCutoff: M.d2r(72.0)
};

export namespace ClassificationContext {
    export async function initialize(clustersPath: string, confalsPath: string, goldenStepsPath: string, nuAnglesPath: string) {
        if (_theContext)
            throw new Error('Classification context has been already initialized. We do not allow this.');

        try {
            _contextData = await ClassificationResources.load(clustersPath, confalsPath, goldenStepsPath, nuAnglesPath);
            _theContext = initializeContext(_contextData);

            return void 0;
        } catch (e) {
            return (e as Error).toString();
        }
    }

    export function initializeContext(data: ClassificationResources.Data) {
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

        const resNus = jsLLKA.LLKA.loadClusterNuAngles(data.nuAngles);
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

    export function context(): jsLLKA.LLKAClassificationContext {
        if (!_theContext)
            throw new Error('Application attempted to get ClassificationContext before it was initalized.');

        return _theContext;
    }

    export function data(): ClassificationResources.Data {
        if (!_contextData)
            throw new Error('Application attempted to get ClassificationContext data before it was initalized.');

        return _contextData;
    }
}
