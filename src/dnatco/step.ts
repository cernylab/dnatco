import { NtC } from './ntc';
import { NucleicBase } from './';

export const CStep = {
    id: 0,
    name: '',
    chain: '',
    model: 0,
    resNo1: 0,
    base1: 'A' as NucleicBase,
    altPos1: '',
    resNo2: 0,
    base2: 'A' as NucleicBase,
    altPos2: '',
    NtC: 'NANT' as NtC.Conformer,
    closestNtC: 'NANT' as NtC.Conformer,
};
export type Step = typeof CStep;

export namespace Step {

    export function nameToPdbId(name: string) {
        const toks = name.split('_');
        if (toks.length !== 6)
            throw new Error('Invalid step name');

        // TODO: Check that the result is a valid PDB ID?
        return toks[0].substring(0, 4);
    }
}
