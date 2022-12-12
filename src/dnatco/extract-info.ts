import { ComponentTypes } from './components';
import { Dnatcofication, StepRmsdStats } from './dnatcofication';
import { Residues } from './residues';
import { StepsMapper } from './steps-mapper';
import { Step } from './step';
import { Model } from './structure';
import { Cif } from '../cif';
import { ChemComp, ChemComp_Schema } from '../cif/categories/chem-comp';
import { Entity, EntityPolySeq } from '../cif/categories/entity';

type ComponentType = (typeof ChemComp_Schema.type)['T'];

const PeptideCifTypes: ComponentType[] = [
    'd-peptide linking', 'l-peptide linking', 'peptide linking', 'd-peptide nh3 amino terminus',
    'd-peptide nh3 amino terminus', 'd-peptide cooh carboxy terminus', 'l-peptide cooh carboxy terminus'
];
const DNACifTypes: ComponentType[] = ['l-dna linking', 'dna linking', 'dna oh 5 prime terminus', 'dna oh 3 prime terminus'];
const RNACifTypes: ComponentType[] = ['l-rna linking', 'rna linking', 'rna oh 5 prime terminus', 'rna oh 3 prime terminus'];
// We assume that component names and types will remain consistent for all molecules. Is this a too optimistic assumption?
const ComponentTypesCache = new Map<string, (typeof ChemComp_Schema.type)['T']>();

function isPeptideType(ctype: string) {
    const c = ctype.toLowerCase();
    return !!PeptideCifTypes.find(x => x === c);
}

function isDNAType(ctype: string) {
    const c = ctype.toLowerCase();
    return !!DNACifTypes.find(x => x === c);
}

function isRNAType(ctype: string) {
    const c = ctype.toLowerCase();
    return !!RNACifTypes.find(x => x === c);
}

export namespace ExtractInfo {
    function averageConfal(from: number, to: number, steps: Step[]) {
        let sum = 0;
        for (let idx = from; idx < to; idx++) {
            const step = steps[idx];
            sum += step.confal;
        }

        return sum / (to - from);
    }

    function entityFromInternal(model: Model) {
        const entTypes: Dnatcofication.EntityKinds = new Map();

        for (const ch of model.chains) {
            let mightBeDNA = false;
            let mightBeRNA = false;
            let mightBePeptide = false;

            for (const res of ch.residues) {
                const ct = ComponentTypes[res.compound];
                if (!ct)
                    continue;

                if (ct) {
                    let dna, rna, peptide;
                    dna = isDNAType(ct);
                    if (!dna) {
                        rna = isRNAType(ct);
                        if (!rna)
                            peptide = isPeptideType(ct);
                    }
                    mightBeDNA = dna || mightBeDNA;
                    mightBeRNA = rna || mightBeRNA;
                    mightBePeptide = peptide || mightBePeptide;
                }
            }

            const type = rednatcoComponentType(mightBeDNA, mightBeRNA, mightBePeptide);
            entTypes.set(ch.entityId, type);
        }

        return entTypes;
    }

    function rednatcoComponentType(mightBeDNA: boolean, mightBeRNA: boolean, mightBePeptide: boolean) {
        return mightBeDNA
            ? mightBeRNA
                ? mightBePeptide
                    ? 'other' : 'hybrid'
                : 'DNA'
            : mightBeRNA
                ? mightBePeptide
                    ? 'other' : 'RNA'
                : mightBePeptide
                    ? 'peptide' : 'other';
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

    function tryEntityTypesFromCif(cif: Cif.Data) {
        if (!(Cif.File.hasTable(cif, Entity) && Cif.File.hasTable(cif, EntityPolySeq) && Cif.File.hasTable(cif, ChemComp)))
            return void 0;

        const entity = Cif.File.table(cif, Entity);
        const entityPolySeq = Cif.File.table(cif, EntityPolySeq);
        const chemComp = Cif.File.table(cif, ChemComp);

        const entTypes: Dnatcofication.EntityKinds = new Map();

        for (let row = 0; row < entity._rowCount; row++) {
            const id = Cif.Column.value(entity.id, row)!;
            entTypes.set(id, 'other');
        }

        for (const entId of entTypes.keys()) {
            let comps = [];
            for (let row = 0; row < entityPolySeq._rowCount; row++) {
                const id = Cif.Column.value(entityPolySeq.entity_id, row)!;
                if (id === entId)
                    comps.push(Cif.Column.value(entityPolySeq.mon_id, row)!);
            }

            let mightBeDNA = false;
            let mightBeRNA = false;
            let mightBePeptide = false
            for (const comp of comps) {
                let ct = ComponentTypesCache.get(comp);
                if (!ct) {
                    for (let row = 0; row < chemComp._rowCount; row++) {
                        if (Cif.Column.value(chemComp.id, row) === comp) {
                            ct = Cif.Column.value(chemComp.type, row) || undefined;
                            if (ct)
                                ComponentTypesCache.set(comp, ct);
                            break;
                        }
                    }
                }

                if (ct) {
                    let dna, rna, peptide;
                    dna = isDNAType(ct);
                    if (!dna) {
                        rna = isRNAType(ct);
                        if (!rna)
                            peptide = isPeptideType(ct);
                    }
                    mightBeDNA = dna || mightBeDNA;
                    mightBeRNA = rna || mightBeRNA;
                    mightBePeptide = peptide || mightBePeptide;
                }
            }

            const type = rednatcoComponentType(mightBeDNA, mightBeRNA, mightBePeptide);
            entTypes.set(entId, type);
        }

        return entTypes;
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

    export function entityKinds(model: Model, cif: Cif.Data) {
        let entTypes = tryEntityTypesFromCif(cif);
        if (entTypes)
            return entTypes;
       return entityFromInternal(model);
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
