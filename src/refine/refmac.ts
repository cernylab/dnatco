import { Restraints } from './restraints';
import { Dnatcofication } from '../dnatco/dnatcofication';

const SigmaFactor = 1.0;

export namespace Refmac {
    export function restraints(d: Dnatcofication, NtCSet: string, maxRmsd: number) {
        return Restraints.make(d, NtCSet, maxRmsd, SigmaFactor);
    }

    export function restraintAsText(restraint: Restraints.Restraint) {
        const atom = (a: Restraints.Atom) => {
            let s = `chain ${a.chain} residue ${a.authNum}`;
            if (a.insCode)
                s += ` insertion ${a.insCode}`;
            s += ` atom ${a.name}`;
            if (a.atomAltId)
                s += ` altecode ${a.atomAltId}`;

            return s;
        };

        if (Restraints.isUnavailable(restraint))
            return `# Restraint that would be a part of step ${restraint.stepName} is unavailable ${restraint.reason}`;
        else if (Restraints.isTorsion(restraint))
            return `external torsion first ${atom(restraint.atomA)} next ${atom(restraint.atomB)} next ${atom(restraint.atomC)} next ${atom(restraint.atomD)} value ${restraint.angle.toFixed(1)} sigma ${restraint.sigma.toFixed(3)}`; // period ${restraint.period} removed as suggested by refmac
        else if (Restraints.isDistance(restraint))
            return `external distance first ${atom(restraint.atomA)} second ${atom(restraint.atomB)} value ${restraint.length.toFixed(3)} sigma ${restraint.sigma.toFixed(3)} type 1`;
    }

    export function restraintsAsText(restraints: Restraints.Restraint[]) {
        let text = '';
        for (const r of restraints)
            text += restraintAsText(r) + '\n';

        return text;
    }
}
