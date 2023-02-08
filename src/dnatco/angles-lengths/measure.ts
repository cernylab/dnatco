import * as jsLLKA from 'jsllka';
import { Residues } from '../residues';
import { Angles, Triplet } from './angles';
import { Atoms, shiftedName } from './atoms';
import { Lengths, Pair } from './lengths';

export namespace Measure {
    function expandAltId(step: jsLLKA.LLKAStructure, seqId: number) {
        const altIds = new Set<string>();
        for (let idx = 0; idx < step.size(); idx++) {
            const atom = step.get(idx);
            if (atom.label_seq_id === seqId && atom.label_alt_id !== 0)
                altIds.add(String.fromCharCode(atom.label_alt_id))
        }

        if (altIds.size > 1)
            throw new Error('More than one altId in a step.');

        return altIds.size === 0 ? '' : Array.from(altIds.values())[0];
    }

    function findAtom(stru: jsLLKA.LLKAStructure, name: string, seqId: number, modelNum: number) {
        for (let idx = 0; idx < stru.size(); idx++) {
            let atom = stru.get(idx);
            if (jsLLKA.atomMatches(atom, name, '', '', seqId, jsLLKA.NO_ALTID, jsLLKA.NO_INSCODE, modelNum))
                return atom;
        }

        return undefined;
    }

    function measureBondAngles(requiredAtoms: Map<string, jsLLKA.LLKAAtom>, angles: Triplet[]): BondAngle[] | undefined {
        const bondAngles = [];
        for (const bond of angles) {
            const a = requiredAtoms.get(bond[0]);
            const b = requiredAtoms.get(bond[1]);
            const c = requiredAtoms.get(bond[2]);

            if (!a || !b || !c)
                return void 0;

            const angle = jsLLKA.measureAngle(a, b, c);
            bondAngles.push({ a: a.label_atom_id, b: b.label_atom_id, c: c.label_atom_id, angle });
        }

        return bondAngles;
    }

    function measureBondLenghts(requiredAtoms: Map<string, jsLLKA.LLKAAtom>, bonds: Pair[]): BondLength[] | undefined {
        const lengths = [];
        for (const bond of bonds) {
            const a = requiredAtoms.get(bond[0]);
            const b = requiredAtoms.get(bond[1]);

            if (!a || !b)
                return void 0;

            const length = jsLLKA.measureDistance(a, b);
            lengths.push({ a: a.label_atom_id, b: b.label_atom_id, length });
        }

        return lengths;
    }

    function pivotAtom(step: jsLLKA.LLKAStructure) {
        const seqId = step.get(0).label_seq_id;
        for (let idx = 1; idx < step.size(); idx++) {
            const atom = step.get(idx);
            if (atom.label_seq_id > seqId)
                return atom;
        }

        return void 0;
    }

    function processResidue(firstAtom: jsLLKA.LLKAAtom, altId: string, step: jsLLKA.LLKAStructure): Residue {
        const compId = firstAtom.label_comp_id;
        const seqId = firstAtom.label_seq_id;
        const residue: Residue = {
            chain: firstAtom.label_asym_id,
            compound: firstAtom.label_comp_id,
            seqId: firstAtom.label_seq_id,
            insCode: firstAtom.pdbx_PDB_ins_code,
            altId,
            authChain: firstAtom.auth_asym_id,
            authSeqId: firstAtom.auth_seq_id,
            modelNum: firstAtom.pdbx_PDB_model_num,
            bondLengths: [],
            bondAngles: [],
        };

        if (!Residues.isElementaryResidue(compId))
            return residue;

        const requiredAtoms = new Map<string, jsLLKA.LLKAAtom>();
        for (const [name, shift] of Atoms[compId]) {
            const a = findAtom(step, name, seqId + shift, firstAtom.pdbx_PDB_model_num);
            if (!a)
                return residue;
            requiredAtoms.set(shiftedName(name, shift), a);
        }

        const lengths = measureBondLenghts(requiredAtoms, Lengths[compId]);
        if (!lengths)
            return residue;

        const angles = measureBondAngles(requiredAtoms, Angles[compId]);
        if (!angles)
            return residue;

        residue.bondLengths = lengths;
        residue.bondAngles = angles;

        return residue;
    }

    export type BondAngle = {
        a: string;
        b: string;
        c: string;
        angle: number;
    };

    export type BondLength = {
        a: string;
        b: string;
        length: number;
    };

    export type Residue = {
        chain: string;
        compound: string;
        seqId: number;
        insCode: string;
        altId: string;
        modelNum: number;

        authChain: string;
        authSeqId: number;

        bondLengths: BondLength[];
        bondAngles: BondAngle[];
    };

    export function allSteps(steps: jsLLKA.LLKAStructures) {
        const residues = [];
        const seenResidues = new Set<string>();

        for (let idx = 0; idx < steps.size(); idx++) {
            const step = steps.get(idx);
            const firstAtom = pivotAtom(step);
            if (!firstAtom)
                continue;

            const altId = expandAltId(step, firstAtom.label_seq_id);
            // We can see some residues multiple times because we are reading them from steps
            // and steps bifrucate on altIds. It is, therefore, possible to have a step with
            // different altId of the first step but the same altId for the second step. When that
            // happens, we will see the second residue of such a step twice.
            //
            // SOMETHING TO CONSIDER:
            // If a residue with some alt. conformation never appears as the second residue in a step,
            // this code will not see it. This indicates that there is no reasonable connectivity between
            // such a residue and a residue that would be the first residue in this non-existent step.
            // Ignoring this "invisible" residue might actually be the right thing because we measure
            // cross-residue angles and these angles would most likely turn out wrong.
            const tag = `${firstAtom.pdbx_PDB_model_num}_${firstAtom.label_asym_id}_${firstAtom.label_seq_id}_${firstAtom.pdbx_PDB_ins_code}_${altId})`;
            if (seenResidues.has(tag))
                continue;

            const residue = processResidue(firstAtom, altId, step);
            if (residue) {
                residues.push(residue);
                seenResidues.add(tag);
            }
        }

        return residues;
    }
}
