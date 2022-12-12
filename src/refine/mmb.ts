import { Dnatcofication } from '../dnatco/dnatcofication';
import { Residues } from '../dnatco/residues';

export namespace Mmb {
    type Sequence = {
        chain: string;
        firstResNo: number;
        residues: string[];
        kind: 'DNA' | 'RNA';
    }
    function Sequence(chain: string, firstResNo: number, kind: Sequence['kind'], residues: string[] = []): Sequence {
        return { chain, firstResNo, residues, kind };
    }

    function makeNtCDirective(chain: string, resNo1: number, resNo2: number, NtC: string) {
        return `NtC ${chain} ${resNo1} ${resNo2} ${NtC}`;
    }

    function makeSequenceDirective(seq: Sequence) {
        let line = `${seq.kind} ${seq.chain} ${seq.firstResNo} `;
        line += seq.residues.reduce((accum, current) => accum + current);

        return line;
    }

    function toSingleLetter(name: string) {
        // To make things really simple we assume that only DA, DC, DG, DT are possible
        // non-single letter inputs to this function
        const idx = 0 + (name.length > 1 ? 1 : 0);
        return name[idx];
    }

    export function commands(d: Dnatcofication, NtCSet: string, includeSequences: boolean) {
        const model = d.data.structures.at(0)?.models[0];
        if (!model)
            return [];

        const lines = new Array<string>();

        if (includeSequences) {
            for (const chain of model.chains) {
                const kind = d.data.entityKinds[0].get(chain.entityId);
                if (!(kind === 'DNA' || kind === 'RNA'))
                    continue;

                const seq = Sequence(chain.authName, chain.residues[0]?.authNum ?? 0, kind);

                for (const residue of chain.residues) {
                    const c = residue.compound;
                    if (!Residues.isNucleicResidue(c))
                        continue;

                    if (Residues.isElementaryResidue(c))
                        seq.residues.push(toSingleLetter(c));
                    else {
                        const kind = Residues.StandardResidueKinds.get(c)!;
                        if (kind === 'purine')
                            seq.residues.push('A');
                        else
                            seq.residues.push('C');
                    }
                }

                if (seq.residues.length > 0)
                    lines.push(makeSequenceDirective(seq));
            }
        }

        for (const step of d.data.steps.steps) {
            const NtC = NtCSet === ''
                ? step.NtC
                : d.customNtCs.getCustomNtC(NtCSet, step.name) ?? step.NtC;
            lines.push(makeNtCDirective(step.chain, step.resNo1, step.resNo2, NtC));
        }

        return lines;
    }
}
