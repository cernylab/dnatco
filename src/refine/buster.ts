import { Restraints } from './restraints';
import { Dnatcofication } from '../dnatco/dnatcofication';

export const SigmaFactor = 1.0;

export namespace Buster {
    export function restraints(d: Dnatcofication, NtCSet: string, maxRmsd: number, sigmaFactor = SigmaFactor) {
        return Restraints.make(d, NtCSet, maxRmsd, sigmaFactor);
    }

    export function restraintAsText(restraint: Restraints.Restraint) {
        const atom = (a: Restraints.Atom) => {
            let s = "";
            if (a.insCode)
                s += `${a.chain}|${a.authNum}${a.insCode}:${a.name}`;
            else
                s += `${a.chain}|${a.authNum}:${a.name}`;

            if (a.atomAltId)
                s += `.${a.atomAltId}`;

            return s;
        };

        if (Restraints.isUnavailable(restraint))
            return `# Restraint that would be a part of step ${restraint.stepName} is unavailable ${restraint.reason}`;
        else if (Restraints.isTorsion(restraint))
            return `NOTE BUSTER_UTILTOR 1 ${restraint.angle.toFixed(1)} ${restraint.sigma.toFixed(3)} ${atom(restraint.atomA)} ${atom(restraint.atomB)} ${atom(restraint.atomC)} ${atom(restraint.atomD)}`;

        else if (Restraints.isDistance(restraint))
            return `NOTE BUSTER_DISTANCE ${restraint.length.toFixed(3)} ${restraint.sigma.toFixed(3)} ${atom(restraint.atomA)} ${atom(restraint.atomB)}`;
    }

    export function restraintsAsText(restraints: Restraints.Restraint[]) {
        let text = '';
        for (const r of restraints)
            text += restraintAsText(r) + '\n';

        return text;
    }
}
