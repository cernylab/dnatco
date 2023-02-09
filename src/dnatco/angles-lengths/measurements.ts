import * as jsLLKA from 'jsllka';
import { Residues } from '../residues';
import { Angles, Triplet } from './angles';
import { Atoms, shiftedName } from './atoms';
import { Lengths, Pair } from './lengths';

export namespace Measurements {
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
        for (const triplet of angles) {
            const a = requiredAtoms.get(triplet[0]);
            const b = requiredAtoms.get(triplet[1]);
            const c = requiredAtoms.get(triplet[2]);

            if (!a || !b || !c)
                return void 0;

            const angle = jsLLKA.measureAngle(a, b, c);
            bondAngles.push({ triplet, angle });
        }

        return bondAngles;
    }

    function measureBondLenghts(requiredAtoms: Map<string, jsLLKA.LLKAAtom>, bonds: Pair[]): BondLength[] | undefined {
        const lengths = [];
        for (const pair of bonds) {
            const a = requiredAtoms.get(pair[0]);
            const b = requiredAtoms.get(pair[1]);

            if (!a || !b)
                return void 0;

            const length = jsLLKA.measureDistance(a, b);
            lengths.push({ pair, length });
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

    function processResidue(firstAtom: jsLLKA.LLKAAtom, altId: string, step: jsLLKA.LLKAStructure): Residue | undefined {
        const compId = firstAtom.label_comp_id;
        const seqId = firstAtom.label_seq_id;

        if (!Residues.isElementaryResidue(compId))
            return void 0;

        const residue: Residue = {
            chain: firstAtom.label_asym_id,
            compound: compId,
            seqId: firstAtom.label_seq_id,
            insCode: firstAtom.pdbx_PDB_ins_code,
            altId,
            authChain: firstAtom.auth_asym_id,
            authSeqId: firstAtom.auth_seq_id,
            modelNum: firstAtom.pdbx_PDB_model_num,
            bondLengths: [],
            bondAngles: [],
        };

        const requiredAtoms = new Map<string, jsLLKA.LLKAAtom>();
        for (const [name, shift] of Atoms[compId]) {
            const a = findAtom(step, name, seqId + shift, firstAtom.pdbx_PDB_model_num);
            if (!a)
                return void 0;
            requiredAtoms.set(shiftedName(name, shift), a);
        }

        const lengths = measureBondLenghts(requiredAtoms, Lengths[compId]);
        if (!lengths)
            return void 0;

        const angles = measureBondAngles(requiredAtoms, Angles[compId]);
        if (!angles)
            return void 0;

        residue.bondLengths = lengths;
        residue.bondAngles = angles;

        return residue;
    }

    export type BondAngle = {
        triplet: Triplet,
        angle: number,
    };

    export type BondLength = {
        pair: Pair,
        length: number,
    };

    export type Residue = {
        chain: string;
        compound: Residues.ElementaryResidue;
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
