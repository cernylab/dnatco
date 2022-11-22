import { Dnatcofication } from './dnatcofication';
import { CANA } from './cana';
import { NtC } from './ntc';
import { Step } from './step';
import { Structure } from './structure';
import { Cif } from '../cif';
import { NdbStructNtcStep_Schema, NdbStructNtcStepSummary_Schema } from '../cif/categories/ndb-struct-ntc';

export namespace StepsMapper {
    function findNtC(id: number, summaries: Cif.Table<NdbStructNtcStepSummary_Schema>): { assignedNtC: NtC.Class, closestNtC: NtC.Class, CANA: CANA.Class, confal: number, rmsd: number } {
        // First assume that summaries are ordered by step_id that begins with 1
        const startFrom = id - 1 >= 0 ? id - 1 : 0;
        for (let row = startFrom; row < summaries._rowCount; row++) {
            if (Cif.Column.value(summaries.step_id, row) === id) {
                return {
                    assignedNtC: Cif.Column.value(summaries.assigned_NtC, row)!,
                    closestNtC: Cif.Column.value(summaries.closest_NtC, row)!,
                    CANA: Cif.Column.value(summaries.assigned_CANA, row)!,
                    confal: Cif.Column.value(summaries.confal_score, row)!,
                    rmsd: Cif.Column.value(summaries.cartesian_rmsd_closest_NtC_representative, row)!,
                };
            }
        }

        // Initial assumption failed, do an exhaustive search
        for (let row = 0; row < summaries._rowCount; row++) {
            if (Cif.Column.value(summaries.step_id, row) === id) {
                return {
                    assignedNtC: Cif.Column.value(summaries.assigned_NtC, row)!,
                    closestNtC: Cif.Column.value(summaries.closest_NtC, row)!,
                    CANA: Cif.Column.value(summaries.assigned_CANA, row)!,
                    confal: Cif.Column.value(summaries.confal_score, row)!,
                    rmsd: Cif.Column.value(summaries.cartesian_rmsd_closest_NtC_representative, row)!,
                };
            }
        }

        throw new Error(`step_id ${id} was not found in ndb_struct_ntc_step_summary loop`);
    }

    export type Mapping = {
        readonly chains: Map<string, number>[];  // Model -> chains, chains indexed by name
        readonly firstId: number;
        readonly models: number[];               // Models indexed from zero
        readonly names: Map<string, number>;
        readonly steps: Step[];
        readonly previous: Array<number>;
        readonly next: Array<number>;
    };
    export function Mapping(): Mapping {
        return {
            chains: [],
            firstId: 0,
            models: [],
            names: new Map(),
            steps: [],
            previous: [],
            next: [],
        };
    }

    export function map(steps: Cif.Table<NdbStructNtcStep_Schema>, summaries: Cif.Table<NdbStructNtcStepSummary_Schema>, structure: Structure): Mapping {
        const modelCount = structure.models.length;

        if (steps._rowCount < 1)
            return Mapping();

        let firstId = Cif.Column.value(steps.id, 0)!;
        for (let row = 1; row < steps._rowCount; row++) {
            const id = Cif.Column.value(steps.id, row)!;
            if (id < firstId)
                firstId = id;
        }


        const orderedSteps = new Array<Step>(steps._rowCount);
        const names = new Map<string, number>();

        for (let row = 0; row < steps._rowCount; row++) {
            const id = Cif.Column.value(steps.id, row)!;
            const idx = id - firstId;
            const name = Cif.Column.value(steps.name, row)!;

            const chain1 = Cif.Column.value(steps.label_asym_id_1, row);
            const chain2 = Cif.Column.value(steps.label_asym_id_2, row);
            if (chain1 !== chain2)
                throw new Error(`Steps are not allowed to span across chains but step ${id} does that`);

            const { assignedNtC, closestNtC, CANA, confal, rmsd } = findNtC(id, summaries);
            orderedSteps[idx] = {
                id,
                name,
                chain: chain1!,
                resNo1: Cif.Column.value(steps.label_seq_id_1, row)!,
                base1: Cif.Column.value(steps.label_comp_id_1, row)!,
                altPos1: Cif.Column.value(steps.label_alt_id_1, row) ?? '',
                resNo2: Cif.Column.value(steps.label_seq_id_2, row)!,
                base2: Cif.Column.value(steps.label_comp_id_2, row)!,
                altPos2: Cif.Column.value(steps.label_alt_id_2, row) ?? '',
                model: Cif.Column.value(steps.PDB_model_number, row)!,
                NtC: assignedNtC,
                closestNtC: closestNtC,
                CANA,
                confal,
                rmsd,
            };

            names.set(name, idx);
        }

        const models = new Array<number>(modelCount);
        const chains = new Array<Map<string, number>>(modelCount);
        for (let idx = 0; idx < chains.length; idx++)
            chains[idx] = new Map();

        for (let idx = 0; idx < orderedSteps.length; idx++) {
            const step = orderedSteps[idx];
            const mIdx = structure.models.findIndex(x => x.num === step.model);
            if (mIdx < 0)
                throw new Error(`Cannot find model index for step ${step.name}`);
            if (models[mIdx] === undefined || models[mIdx] > idx)
                models[mIdx] = idx;

            const chm = chains[mIdx].get(step.chain);
            if (chm === undefined || chm > idx)
                chains[mIdx].set(step.chain, idx);
        }

        const previous = new Array<number>(orderedSteps.length);
        const next = new Array<number>(orderedSteps.length);
        previous.fill(-1);
        next.fill(-1);

        for (let idx = 1; idx < orderedSteps.length; idx++) {
            const step = orderedSteps[idx];

            let found = false;
            for (let sdx = idx - 1; sdx >= 0; sdx--) {
                const candidate = orderedSteps[sdx];

                // Can this step be connected to the previous step?
                if (!(candidate.model === step.model && candidate.chain === step.chain))
                    break; // It cannot. Assume that we ran outside the chain and abandon this step

                if (candidate.resNo2 !== step.resNo1) // Can this step overlap the previous step?
                    continue; // They cannot, look further back

                if (candidate.altPos2 === step.altPos1) {
                    found = true;
                    next[sdx] = idx;
                    previous[idx] = sdx;
                }
            }
            if (!found)
                console.warn(`Could not find previous step for step ${step.name}`);
        }

        return {
            chains,
            firstId,
            models,
            names,
            steps: orderedSteps,
            previous,
            next
        };
    }

    export function byId(d: Dnatcofication, id: number) {
        return d.data.steps.steps[id - d.data.steps.firstId];
    }

    export function byName(d: Dnatcofication, name: string) {
        const idx = d.data.steps.names.get(name);
        return idx !== undefined ? d.data.steps.steps[idx] : undefined;
    }

    export function idToIndex(d: Dnatcofication, id: number) {
        return id - d.data.steps.firstId;
    }

    export function nameToIndex(d: Dnatcofication, name: string) {
        return d.data.steps.names.get(name);
    }

    export function previousNextById(d: Dnatcofication, id: number): { previousId: number, nextId: number } {
        const idx = id - d.data.steps.firstId;
        const offset = d.data.steps.firstId;
        const previousId = d.data.steps.previous[idx] !== -1 ? d.data.steps.previous[idx] + offset : -1;
        const nextId = d.data.steps.next[idx] !== -1 ? d.data.steps.next[idx] + offset : -1;

        return { previousId, nextId };
    }

    export function segment(d: Dnatcofication, modelIndex?: number, chain?: string) {
        if (modelIndex === undefined)
            return d.data.steps.steps;
        else {
            const steps = new Array<Step>();

            if (!chain) {
                const fromIdx = d.data.steps.models[modelIndex];
                const first = d.data.steps.steps[fromIdx];
                for (let idx = fromIdx; idx < d.data.steps.steps.length; idx++) {
                    const s = d.data.steps.steps[idx];
                    if (s.model !== first.model)
                        break;
                    steps.push(s);
                }
            } else {
                const fromIdx = d.data.steps.chains[modelIndex].get(chain);
                if (fromIdx === undefined)
                    throw new Error(`Invalid chain ${chain}`);
                const first = d.data.steps.steps[fromIdx];
                for (let idx = fromIdx; idx < d.data.steps.steps.length; idx++) {
                    const s = d.data.steps.steps[idx];
                    if (s.chain !== first.chain)
                        break;
                    steps.push(s);
                }
            }

            return steps;
        }
    }
}
