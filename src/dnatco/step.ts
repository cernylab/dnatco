import { CANA } from './cana';
import { NtC } from './ntc';
import { isPdbId } from '../util';

export const StepObj = {
    id: 0,
    name: '',
    chain: '',
    model: 0,
    resNo1: 0,
    base1: 'A',
    altPos1: '',
    insCode1: '',
    resNo2: 0,
    base2: 'A',
    altPos2: '',
    insCode2: '',
    NtC: 'NANT' as NtC.Class,
    closestNtC: 'NANT' as NtC.Class,
    CANA:  'NAN' as CANA.Class,
    confal: 0,
    rmsd: 0,
    resNo1Auth: 0,
    resNo2Auth: 0,
};
export type Step = typeof StepObj;

export namespace Step {
    export type Torsion = 'delta1'|'epsilon1'|'zeta1'|'alpha2'|'beta2'|'gamma2'|'delta2'|'chi1'|'chi2'|'nccn';
    export type Distance = 'cc'|'nn';

    export function nameToPdbId(name: string) {
        const toks = name.split('_');
        if (toks.length !== 6)
            throw new Error('Invalid step name');

        // TODO: Check that the result is a valid PDB ID?
        const candidate = toks[0].substring(0, 4);
        return isPdbId(candidate) ? candidate : void 0;
    }
}
