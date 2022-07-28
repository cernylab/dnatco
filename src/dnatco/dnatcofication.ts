import * as ConnSimil from './connectivity-similarity';
import { ClassificationResources } from './classification-resources';
import { Dnatcofier } from './dnatcofier';
import { ExtractInfo } from './extract-info';
import { StepsMapper } from './steps-mapper';
import { Structure as _Structure } from './structure';
import { Cif } from '../cif';
import { Category, Schema } from '../cif/categories';
import { AtomSite } from '../cif/categories/atom-site';
import { TaskContext } from '../tasks/task';
import {
    NdbStructNtcOverall, NdbStructNtcStepParameters, NdbStructNtcStepSummary,
    NdbStructNtcStep, NdbStructSugarStepParameters,
} from '../cif/categories/ndb-struct-ntc';
import { EventsKeeper } from '../util/events-keeper';

const RequiredDnatcoCategories: Category<any>[] = [
    NdbStructNtcOverall, NdbStructNtcStepParameters, NdbStructNtcStep,
    NdbStructNtcStepSummary, NdbStructSugarStepParameters,
];

export type DnatcoficationTaskContext = TaskContext<DnatcoficationData>;

export const DnatcoficationData = {
    connectivities: { backward: [], forward: [] } as ConnSimil.AllConnectivities,
    nucleicAcidChains: new Array<string[]>(),
    similarities: [] as ConnSimil.AllSimilarities,
    steps: StepsMapper.Mapping(),
    structures: new Array<_Structure>(),
    cifData: null as (Cif.Data|null),
}
export type DnatcoficationData = typeof DnatcoficationData;

export class Dnatcofication {
    private readonly ek = new EventsKeeper();
    data = DnatcoficationData;

    readonly events = {
        structureChanged: this.ek.subject<boolean>(),
    };

    constructor() {
    }

    haveStructure() {
        return !!this.data.cifData;
    }

    hasTable<S extends Schema.Schema>(category: Category<S>) {
        if (!this.data.cifData)
            return false;
        return Cif.File.hasTable(this.data.cifData, category);
    }

    rawCif() {
        return this.data.cifData?.raw ?? '';
    }

    table<S extends Schema.Schema>(category: Category<S>) {
        if (!this.data.cifData)
            throw new Error('No structure has been loaded');

        return Cif.File.table(this.data.cifData, category);
    }

    setData(data: DnatcoficationData) {
        this.data = data;
        this.events.structureChanged.next(true);
    }
}

export namespace Dnatcofication {
    export namespace Structure {
        export function nucleicAcidChains(d: Dnatcofication, model = 1) {
            if (d.data.nucleicAcidChains.length === 0)
                return [];
            return d.data.nucleicAcidChains[model - 1];
        }

        export function numberOfModels(d: Dnatcofication) {
            if (d.data.structures.length === 0)
                return 0;
            return d.data.structures[0].models.length;
        }
    }

    export function ingest(cifContent: string, clsfResData: ClassificationResources.Data, ctx: DnatcoficationTaskContext) {
        const tStart = performance.now();

        try {
            ctx.status = 'Reading CIF file';

            let cifData = Cif.read(cifContent);
            if (!isDnatcofied(cifData)) {
                // Got a CIF without DNATCO categories. Let's try to create them ourselves
                const maybeDnatcofiedCif = Dnatcofier.dnatcoify(cifContent, clsfResData, ctx);
                cifData = Cif.read(maybeDnatcofiedCif);
                if (!isDnatcofied(cifData))
                    throw new Error('Input CIF file does not contain required DNATCO categories and ReDNATCO\'s automatic assignment process was unsuccessful. Sorry...');
            }

            const structures = new Array<_Structure>();
            structures.push(new _Structure(Cif.File.table(cifData, AtomSite, 0))); // NOTE: We are explicitly ignoring any blocks except the first one

            const nucleicAcidChains = new Array<string[]>();
            for (const model of structures[0].models) {
                const naChains = ExtractInfo.countNucleicAcidChains(model);
                nucleicAcidChains.push(naChains);
            }

            ctx.status = 'Mapping dinucleotide steps';

            const steps = StepsMapper.map(
                Cif.File.table(cifData, NdbStructNtcStep),
                Cif.File.table(cifData, NdbStructNtcStepSummary),
                structures[0]?.models.length ?? 0
            );

            ctx.status = 'Calculating connectivities';
            const stepsAtoms = ConnSimil.getStepsAtoms(steps.steps, cifData);
            const connectivities = ConnSimil.getConnectivities(steps.steps, stepsAtoms, steps.previous, steps.next);

            ctx.status = 'Calculataing similarities';
            const similarities = ConnSimil.getSimilarities(steps.steps, stepsAtoms);
            stepsAtoms.delete();

            const tEnd = performance.now();

            console.log(`Dnatcofication process took ${((tEnd - tStart) / 1000.0).toFixed(3)} sec`);

            const data: DnatcoficationData = {
                connectivities,
                nucleicAcidChains,
                similarities,
                steps,
                structures,
                cifData
            };

            ctx.events.finished.next({ state: 'succeeded', data });
        } catch (e) {
            ctx.events.finished.next({ state: 'failed', message: (e as Error).toString() });
        }
    }

    export function isDnatcofied(cif: Cif.Data) {
        for (let block = 0; block < Cif.File.blockCount(cif); block++) {
            for (const cat of RequiredDnatcoCategories) {
                if (!Cif.File.hasTable(cif, cat, block))
                    return false;
            }
        }

        return true;
    }
}
