import { StepRmsdStats } from './dnatcofication';
import { Residues } from './residues';
import { StepsMapper } from './steps-mapper';
import { Step } from './step';
import { Model } from './structure';

export namespace ExtractInfo {
    function averageConfal(from: number, to: number, steps: Step[]) {
        let sum = 0;
        for (let idx = from; idx < to; idx++) {
            const step = steps[idx];
            sum += step.confal;
        }

        return sum / (to - from);
    }

    function rmsdStats(thresholds: number[], from: number, to: number, steps: Step[]) {
        const bins = [];
        thresholds.forEach(() => bins.push(0));
        bins.push(0);

        for (let idx = from; idx < to; idx++) {
            const step = steps[idx];

            let tdx = 0;
            for (;tdx < thresholds.length; tdx++) {
                if (step.rmsd < thresholds[tdx]) {
                    bins[tdx]++;
                    break;
                }
            }
            if (tdx === thresholds.length)
                bins[tdx]++;
        }

        const ret = new Array<StepRmsdStats>();
        for (let idx = 0; idx < bins.length; idx++) {
            ret.push({ rmsdThreshold: thresholds[idx] ?? -1, count: bins[idx] });
        }

        return ret;
    }

    export function averageConfals(mapping: StepsMapper.Mapping) {
        const averageConfals = new Array<number>();

        let mdx = 0;
        for (; mdx < mapping.models.length - 1; mdx++) {
            const avg = averageConfal(mapping.models[mdx], mapping.models[mdx + 1], mapping.steps);
            averageConfals.push(avg);
        }

        const avg = averageConfal(mapping.models[mdx], mapping.steps.length, mapping.steps);
        averageConfals.push(avg);

        return averageConfals;
    }

    export function countNucleicAcidChains(model: Model) {
        const naChains = [];

        for (const chain of model.chains) {
            let isNaChain = true;
            let idx = 0;
            while (isNaChain && idx < chain.residues.length) {
                const res = chain.residues[idx++];
                if (!Residues.isNucleicResidue(res.compound))
                    isNaChain = false;
            }

            if (isNaChain)
                naChains.push(chain.name);
        }

        return naChains;
    }

    export function stepRmsdStats(thresholds: number[], mapping: StepsMapper.Mapping) {
        const stats = new Array<StepRmsdStats[]>();

        let mdx = 0;
        for (; mdx < mapping.models.length - 1; mdx++) {
            stats.push(
                rmsdStats(
                    thresholds,
                    mapping.models[mdx],
                    mapping.models[mdx + 1],
                    mapping.steps
                )
            );
        }

        stats.push(
            rmsdStats(
                thresholds,
                mapping.models[mdx],
                mapping.steps.length,
                mapping.steps
            )
        );

        return stats;
    }
}
