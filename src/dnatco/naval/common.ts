import * as jsLLKA from 'jsllka';

const StandardNucleotides = new Set([
    'A', 'C', 'G', 'U', 'DA', 'DC', 'DG', 'DT', 'DU'
]);

export type BunchOfAtoms = {
    before: jsLLKA.LLKAStructure|undefined;
    current: jsLLKA.LLKAStructure;
    after: jsLLKA.LLKAStructure|undefined;
    expandedAltId: string;
    owning: boolean;
};
export function BunchOfAtoms(before: jsLLKA.LLKAStructure|undefined, current: jsLLKA.LLKAStructure, after: jsLLKA.LLKAStructure|undefined, expandedAltId: string, owning: boolean): BunchOfAtoms {
    return { before, current, after, expandedAltId, owning };
}

export type StdBase = 'A' | 'DA' | 'C' | 'DC' | 'G' | 'DG' | 'DT' | 'U';

export namespace Common {
    export function baseIs(compare: StdBase, ...against: StdBase[]) {
        return !!against.find(b => compare === b);
    }

    export function findAtom(atoms: jsLLKA.LLKAStructure, atomId: string) {
        for (let idx = 0; idx < atoms.size(); idx++) {
            const at = atoms.get(idx);
            if (at.auth_atom_id === atomId)
                return at;
        }

        return void 0;
    }

    export function isStandardNucleotide(compId: string) {
        return StandardNucleotides.has(compId);
    }

    export function maybeAltId(altId: number) {
        return altId !== jsLLKA.NO_ALTID ? String.fromCharCode(altId) : '';
    }

    export function residueId(seqId: number, insCode: string) {
        return seqId.toString() + (insCode || '');
    }
}
