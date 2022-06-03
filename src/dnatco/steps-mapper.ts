import { NucleicBase } from './';
import { Dnatcofication } from './dnatcofication';
import { NtC } from './ntc';
import { Cif } from '../cif';
import { NdbStructNtcStep_Schema, NdbStructNtcStepSummary_Schema } from '../cif/categories/ndb-struct-ntc';

export namespace StepsMapper {
    function findNtC(id: number, summaries: Cif.Table<NdbStructNtcStepSummary_Schema>): { assigned: NtC.Conformer, closest: NtC.Conformer } {
        // First assume that summaries are ordered by step_id that begins with 1
        const startFrom = id - 1 >= 0 ? id - 1 : 0;
        for (let row = startFrom; row < summaries._rowCount; row++) {
            if (summaries.step_id.value(row) === id) {
                return {
                    assigned: summaries.assigned_NtC.value(row)!,
                    closest: summaries.closest_NtC.value(row)!,
                };
            }
        }

        // Initial assumption failed, do an exhaustive search
        for (let row = 0; row < summaries._rowCount; row++) {
            if (summaries.step_id.value(row) === id) {
                return {
                    assigned: summaries.assigned_NtC.value(row)!,
                    closest: summaries.closest_NtC.value(row)!,
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
        readonly steps: NtC.Step[];
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

    export function map(steps: Cif.Table<NdbStructNtcStep_Schema>, summaries: Cif.Table<NdbStructNtcStepSummary_Schema>, modelCount: number): Mapping {
        if (steps._rowCount < 1)
            return Mapping();

        let firstId = steps.id.value(0)!;
        let firstModel = steps.PDB_model_number.value(0)!;
        for (let row = 1; row < steps._rowCount; row++) {
            const id = steps.id.value(row)!;
            if (id < firstId)
                firstId = id;

            const model = steps.PDB_model_number.value(row)!;
            if (model < firstModel)
                firstModel = model;
        }

        const orderedSteps = new Array<NtC.Step>(steps._rowCount);
        const names = new Map<string, number>();

        for (let row = 0; row < steps._rowCount; row++) {
            const id = steps.id.value(row)!;
            const idx = id - firstId;
            const name = steps.name.value(row)!;

            const chain1 = steps.label_asym_id_1.value(row);
            const chain2 = steps.label_asym_id_2.value(row);
            if (chain1 !== chain2)
                throw new Error(`Steps are not allowed to span across chains but step ${id} does that`);

            const { assigned, closest } = findNtC(id, summaries);
            orderedSteps[idx] = {
                id,
                name,
                chain: chain1!,
                resNo1: steps.label_seq_id_1.value(row)!,
                base1: steps.label_comp_id_1.value(row) as NucleicBase,
                altPos1: steps.label_alt_id_1.value(row) ?? '',
                resNo2: steps.label_seq_id_2.value(row)!,
                base2: steps.label_comp_id_2.value(row) as NucleicBase,
                altPos2: steps.label_alt_id_2.value(row) ?? '',
                model: steps.PDB_model_number.value(row)!,
                NtC: assigned,
                closestNtC: closest,
            };

            names.set(name, idx);
        }

        const models = new Array<number>(modelCount);
        const chains = new Array<Map<string, number>>(modelCount);
        for (let idx = 0; idx < chains.length; idx++)
            chains[idx] = new Map();

        for (let idx = 0; idx < orderedSteps.length; idx++) {
            const step = orderedSteps[idx];
            const mIdx = step.model - firstModel;
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
            const prevStep = orderedSteps[idx - 1];
            const step = orderedSteps[idx];
            // Can this step be connected to the previous step?
            if (prevStep.model === step.model && prevStep.chain === step.chain) {
                // Simple case where we do not bifrucate due to alternate positions
                if (prevStep.altPos2 === '' && step.altPos1 === '') {
                    next[idx - 1] = idx; // If we bifrucate on alternate positions, we will overwrite previous value. Is this a problem?
                    previous[idx] = idx - 1;
                } else if (step.altPos1 !== '') {
                    // We are in alternate positions bifrucation. Look further back to find the correct previous step
                    let jdx = idx - 1;
                    for (; jdx >= 0; jdx--) {
                        const candidate = orderedSteps[jdx];
                        if (candidate.altPos2 === step.altPos1) {
                            next[jdx] = idx;
                            previous[idx] = jdx;
                            break;
                        }
                    }
                    // We could not find any matching previous step
                    // NOTE: This does not make any sense and it is actually a defect in DNATCO.
                    // We cannot do anything about it except log a warning and revisit this once the issue in DNATCO is fixed.
                    if (jdx === -1)
                        console.warn(`Could not find previous step for a step ${step.name} which has alternate positions`);
                } else {
                    // There is a "third" option with step.altPos1 === '' and prevStep.altPos2 !== '' but this should not happen in well-formed data
                    console.warn(`altPos1 for step ${step.name} is empty but altPos2 of ${prevStep.name} is set to ${prevStep.altPos2}. This does not make sense.`);
                }
            }
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
        return d._steps.steps[id - d._steps.firstId];
    }

    export function byName(d: Dnatcofication, name: string) {
        const idx = d._steps.names.get(name);
        return idx !== undefined ? d._steps.steps[idx] : undefined;
    }

    export function idToIndex(d: Dnatcofication, id: number) {
        return id - d._steps.firstId;
    }

    export function nameToIndex(d: Dnatcofication, name: string) {
        return d._steps.names.get(name);
    }

    export function previousNextById(d: Dnatcofication, id: number): { previous: number, next: number } {
        const idx = id - d._steps.firstId;
        const offset = d._steps.firstId;
        const previous = d._steps.previous[idx] !== -1 ? d._steps.previous[idx] + offset : -1;
        const next = d._steps.next[idx] !== -1 ? d._steps.next[idx] + offset : -1;

        return { previous, next };
    }

    export function segment(d: Dnatcofication, model?: number, chain?: string) {
        if (model === undefined)
            return d._steps.steps;
        else {
            const steps = new Array<NtC.Step>();

            if (chain === undefined) {
                const fromIdx = d._steps.models[model - 1];
                const first = d._steps.steps[fromIdx];
                for (let idx = fromIdx; idx < d._steps.steps.length; idx++) {
                    const s = d._steps.steps[idx];
                    if (s.model !== first.model)
                        break;
                    steps.push(s);
                }
            } else {
                const fromIdx = d._steps.chains[model - 1].get(chain);
                if (fromIdx === undefined)
                    throw new Error(`Invalid chain ${chain}`);
                const first = d._steps.steps[fromIdx];
                for (let idx = fromIdx; idx < d._steps.steps.length; idx++) {
                    const s = d._steps.steps[idx];
                    if (s.chain !== first.chain)
                        break;
                    steps.push(s);
                }
            }

            return steps;
        }
    }
}
