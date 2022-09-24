import { Residues } from './residues';
import { Model } from './structure';

export namespace ExtractInfo {
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
}

