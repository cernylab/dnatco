import { NucleicBase } from './';
import { Dnatcofication } from './dnatcofication';
import { NtC } from './ntc';
import { Cif } from '../cif';
import { NdbStructNtcStep_Schema, NdbStructNtcStepSummary_Schema } from '../cif/categories/ndb-struct-ntc';

export namespace StepsMapper {
    function findNtC(id: number, summaries: Cif.Table<NdbStructNtcStepSummary_Schema>) {
        // First assume that summaries are ordered by step_id that begins with 1
        const startFrom = id - 1 >= 0 ? id - 1 : 0;
        for (let row = startFrom; row < summaries._rowCount; row++) {
            if (summaries.step_id.value(row) === id)
                return summaries.assigned_NtC.value(row);
        }

        // Initial assumption failed, do an exhaustive search
        for (let row = 0; row < summaries._rowCount; row++) {
            if (summaries.step_id.value(row) === id)
                return summaries.assigned_NtC.value(row);
        }

        throw new Error(`step_id ${id} was not found in ndb_struct_ntc_step_summary loop`);
    }

    export type Mapping = {
        readonly chains: Map<string, number>[];  // Model -> chains, chains indexed by name
        readonly firstId: number;
        readonly models: number[];               // Models indexed from zero
        readonly names: Map<string, number>;
        readonly steps: NtC.Step[];
    };
    export function Mapping(): Mapping {
        return {
            chains: [],
            firstId: 0,
            models: [],
            names: new Map(),
            steps: [],
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
            orderedSteps[idx] = {
                id,
                name,
                chain1: steps.label_asym_id_1.value(row)!,
                resNo1: steps.label_seq_id_1.value(row)!,
                base1: steps.label_comp_id_1.value(row) as NucleicBase,
                altPos1: steps.label_alt_id_1.value(row) ?? '',
                chain2: steps.label_asym_id_2.value(row)!,
                resNo2: steps.label_seq_id_2.value(row)!,
                base2: steps.label_comp_id_2.value(row) as NucleicBase,
                altPos2: steps.label_alt_id_2.value(row) ?? '',
                model: steps.PDB_model_number.value(row)!,
                NtC: findNtC(id, summaries)!,
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

            const chain = step.chain1;
            const chm = chains[mIdx].get(chain);
            if (chm === undefined || chm > idx)
                chains[mIdx].set(chain, idx);
        }

        return {
            chains,
            firstId,
            models,
            names,
            steps: orderedSteps,
        };
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
                    if (s.chain1 !== first.chain1)
                        break;
                    steps.push(s);
                }
            }

            return steps;
        }
    }

    export function byId(d: Dnatcofication, id: number) {
        return d._steps.steps[id - d._steps.firstId];
    }

    export function byName(d: Dnatcofication, name: string) {
        return d._steps.names.get(name);
    }
}
