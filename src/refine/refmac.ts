import { Restraints } from './restraints';
import { Dnatcofication } from '../dnatco/dnatcofication';

const SigmaFactor = 1.0;

export namespace Refmac {
    export function restraints(d: Dnatcofication, maxRmsd: number) {
        return Restraints.make(d, maxRmsd, SigmaFactor);
    }

    export function restraintAsText(restraint: Restraints.Restraint) {
        const atom = (a: Restraints.Atom) => {
            let s = `chain ${a.chain} residue ${a.authNum} atom ${a.name}`;
            if (a.altId)
                s += ` altecode ${a.altId}`;
            if (a.insCode)
                s += ` insertion ${a.insCode}`;

            return s;
        };

        if (Restraints.isUnavailable(restraint))
            return `# Restraint that would be a part of step ${restraint.stepName} is unavailable ${restraint.reason}`;
        else if (Restraints.isTorsion(restraint))
            return `external torsion first ${atom(restraint.atomA)} next ${atom(restraint.atomB)} next ${atom(restraint.atomC)} next ${atom(restraint.atomD)} value ${restraint.angle} sigma ${restraint.sigma} period ${restraint.period}`;
        else if (Restraints.isDistance(restraint))
            return `external distance first ${atom(restraint.atomA)} second ${atom(restraint.atomB)} value ${restraint.length} sigma ${restraint.sigma} type 1`;
    }

    export function restraintsAsText(restraints: Restraints.Restraint[]) {
        let text = '';
        for (const r of restraints)
            text += restraintAsText(r) + '\n';

        return text;
    }
}
