import * as jsLLKA from 'jsllka';
import { Residues } from './residues';

type AngleTriplet = [a: string, b: string, c: string];
type BondPair = [a: string, b: string];
type Atom = [name: string, shift: 0 | -1];

const AdenineBonds = [
    ["C1'", "C2'"],
    ["C1'", "N9"],
    ["C2", "N1"],
    ["C2'", "C3'"],
    ["C3'", "O3'"],
    ["C4", "C5"],
    ["C4", "N3"],
    ["C4'", "C3'"],
    ["C4'", "O4'"],
    ["C5", "N7"],
    ["C5'", "C4'"],
    ["C6", "C5"],
    ["C6", "N6"],
    ["C8", "N9"],
    ["N1", "C6"],
    ["N3", "C2"],
    ["N7", "C8"],
    ["N9", "C4"],
    ["O4'", "C1'"],
    ["O5'", "C5'"],
    ["P", "O5'"],
    ["P", "OP1"],
    ["P", "OP2"],
] as BondPair[];
const AdenineAngles = [
    ["C1'", "C2'", "C3'"],
    ["C1'", "N9", "C4"],
    ["C1'", "N9", "C8"],
    ["C2", "N1", "C6"],
    ["C2'", "C1'", "N9"],
    ["C2'", "C3'", "C4'"],
    ["C3'", "C4'", "O4'"],
    ["C4", "C5", "N7"],
    ["C4", "N3", "C2"],
    ["C4'", "C3'", "O3'"],
    ["C4'", "O4'", "C1'"],
    ["C5", "N7", "C8"],
    ["C5'", "C4'", "C3'"],
    ["C6", "C5", "C4"],
    ["C6", "C5", "N7"],
    ["C8", "N9", "C4"],
    ["N1", "C6", "C5"],
    ["N1", "C6", "N6"],
    ["N3", "C2", "N1"],
    ["N3", "C4", "C5"],
    ["N6", "C6", "C5"],
    ["N7", "C8", "N9"],
    ["N9", "C4", "C5"],
    ["N9", "C4", "N3"],
    ["O3'_2", "P", "O5'"],
    ["O3'_2", "P", "OP1"],
    ["O3'_2", "P", "OP2"],
    ["O4'", "C1'", "C2'"],
    ["O4'", "C1'", "N9"],
    ["O5'", "C5'", "C4'"],
    ["OP1", "P", "OP2"],
    ["P", "O5'", "C5'"],
] as AngleTriplet[];
const AdenineAtoms = [
    ["C2", 0], ["OP1", 0], ["C4", 0], ["C6", 0], ["P", 0], ["N3", 0], ["O5'", 0], ["C5'", 0], ["N6", 0], ["OP2", 0], ["C1'", 0], ["O3'", 0], ["N7", 0], ["N1", 0], ["C3'", 0], ["C8", 0], ["C4'", 0], ["C2'", 0], ["O4'", 0], ["C5", 0], ["N9", 0],
    ["O3'", -1],
] as Atom[];

const CytidineBonds = [
    ["C1'", "C2'"],
    ["C1'", "N1"],
    ["C2", "N3"],
    ["C2", "O2"],
    ["C2'", "C3'"],
    ["C3'", "O3'"],
    ["C4", "C5"],
    ["C4", "N4"],
    ["C4'", "C3'"],
    ["C4'", "O4'"],
    ["C5", "C6"],
    ["C5'", "C4'"],
    ["C6", "N1"],
    ["N1", "C2"],
    ["N3", "C4"],
    ["O4'", "C1'"],
    ["O5'", "C5'"],
    ["P", "O5'"],
    ["P", "OP1"],
    ["P", "OP2"],
] as BondPair[];
const CytidineAngles = [
    ["C1'", "C2'", "C3'"],
    ["C1'", "N1", "C2"],
    ["C1'", "N1", "C6"],
    ["C2", "N3", "C4"],
    ["C2'", "C1'", "N1"],
    ["C2'", "C3'", "C4'"],
    ["C3'", "C4'", "O4'"],
    ["C4", "C5", "C6"],
    ["C4'", "C3'", "O3'"],
    ["C4'", "O4'", "C1'"],
    ["C5", "C6", "N1"],
    ["C5'", "C4'", "C3'"],
    ["C6", "N1", "C2"],
    ["N1", "C2", "N3"],
    ["N1", "C2", "O2"],
    ["N3", "C4", "C5"],
    ["N3", "C4", "N4"],
    ["N4", "C4", "C5"],
    ["O2", "C2", "N3"],
    ["O3'_2", "P", "O5'"],
    ["O3'_2", "P", "OP1"],
    ["O3'_2", "P", "OP2"],
    ["O4'", "C1'", "C2'"],
    ["O4'", "C1'", "N1"],
    ["O5'", "C5'", "C4'"],
    ["OP1", "P", "OP2"],
    ["P", "O5'", "C5'"],
] as AngleTriplet[];
const CytidineAtoms = [
    ["C2", 0], ["OP1", 0], ["C4", 0], ["C6", 0], ["P", 0], ["N3", 0], ["O5'", 0], ["N4", 0], ["C5'", 0], ["O2", 0], ["OP2", 0], ["C1'", 0], ["O3'", 0], ["N1", 0], ["C3'", 0], ["C4'", 0], ["C2'", 0], ["O4'", 0], ["C5", 0],
    ["O3'", -1],
] as Atom[];

const GuanosineBonds = [
    ["C1'", "C2'"],
    ["C1'", "N9"],
    ["C2", "N1"],
    ["C2", "N2"],
    ["C2'", "C3'"],
    ["C3'", "O3'"],
    ["C4", "C5"],
    ["C4", "N3"],
    ["C4'", "C3'"],
    ["C4'", "O4'"],
    ["C5", "N7"],
    ["C5'", "C4'"],
    ["C6", "C5"],
    ["C6", "O6"],
    ["C8", "N9"],
    ["N1", "C6"],
    ["N3", "C2"],
    ["N7", "C8"],
    ["N9", "C4"],
    ["O4'", "C1'"],
    ["O5'", "C5'"],
    ["P", "O5'"],
    ["P", "OP1"],
    ["P", "OP2"],
] as BondPair[];
const GuanosineAngles = [
    ["C1'", "C2'", "C3'"],
    ["C1'", "N9", "C4"],
    ["C1'", "N9", "C8"],
    ["C2", "N1", "C6"],
    ["C2'", "C1'", "N9"],
    ["C2'", "C3'", "C4'"],
    ["C3'", "C4'", "O4'"],
    ["C4", "C5", "N7"],
    ["C4", "N3", "C2"],
    ["C4'", "C3'", "O3'"],
    ["C4'", "O4'", "C1'"],
    ["C5", "N7", "C8"],
    ["C5'", "C4'", "C3'"],
    ["C6", "C5", "C4"],
    ["C6", "C5", "N7"],
    ["C8", "N9", "C4"],
    ["N1", "C6", "C5"],
    ["N1", "C6", "O6"],
    ["N2", "C2", "N1"],
    ["N3", "C2", "N1"],
    ["N3", "C2", "N2"],
    ["N3", "C4", "C5"],
    ["N7", "C8", "N9"],
    ["N9", "C4", "C5"],
    ["N9", "C4", "N3"],
    ["O3'_2", "P", "O5'"],
    ["O3'_2", "P", "OP1"],
    ["O3'_2", "P", "OP2"],
    ["O4'", "C1'", "C2'"],
    ["O4'", "C1'", "N9"],
    ["O5'", "C5'", "C4'"],
    ["O6", "C6", "C5"],
    ["OP1", "P", "OP2"],
    ["P", "O5'", "C5'"],
] as AngleTriplet[];
const GuanosineAtoms = [
    ["C2", 0], ["OP1", 0], ["C4", 0], ["C6", 0], ["P", 0], ["N3", 0], ["O5'", 0], ["N2", 0], ["C5'", 0], ["OP2", 0], ["C1'", 0], ["O6", 0], ["O3'", 0], ["N7", 0], ["N1", 0], ["C3'", 0], ["C8", 0], ["C4'", 0], ["C2'", 0], ["O4'", 0], ["C5", 0], ["N9", 0],
    ["O3'", -1],
] as Atom[];

const UracilBonds = [
    ["C1'", "C2'"],
    ["C1'", "N1"],
    ["C2", "N3"],
    ["C2", "O2"],
    ["C2'", "C3'"],
    ["C3'", "O3'"],
    ["C4", "C5"],
    ["C4", "O4"],
    ["C4'", "C3'"],
    ["C4'", "O4'"],
    ["C5", "C6"],
    ["C5'", "C4'"],
    ["C6", "N1"],
    ["N1", "C2"],
    ["N3", "C4"],
    ["O4'", "C1'"],
    ["O5'", "C5'"],
    ["P", "O5'"],
    ["P", "OP1"],
    ["P", "OP2"],
] as BondPair[];
const UracilAngles = [
    ["C1'", "C2'", "C3'"],
    ["C1'", "N1", "C2"],
    ["C1'", "N1", "C6"],
    ["C2", "N3", "C4"],
    ["C2'", "C1'", "N1"],
    ["C2'", "C3'", "C4'"],
    ["C3'", "C4'", "O4'"],
    ["C4", "C5", "C6"],
    ["C4'", "C3'", "O3'"],
    ["C4'", "O4'", "C1'"],
    ["C5", "C6", "N1"],
    ["C5'", "C4'", "C3'"],
    ["C6", "N1", "C2"],
    ["N1", "C2", "N3"],
    ["N1", "C2", "O2"],
    ["N3", "C4", "C5"],
    ["N3", "C4", "O4"],
    ["O2", "C2", "N3"],
    ["O3'_2", "P", "O5'_2"],
    ["O3'_2", "P", "OP1"],
    ["O3'_2", "P", "OP2"],
    ["O4", "C4", "C5"],
    ["O4'", "C1'", "C2'"],
    ["O4'", "C1'", "N1"],
    ["O5'", "C5'", "C4'"],
    ["OP1", "P", "OP2"],
    ["P", "O5'", "C5'"],
] as AngleTriplet[];
const UracilAtoms = [
    ["C2", 0], ["OP1", 0], ["C4", 0], ["C6", 0], ["P", 0], ["N3", 0], ["O5'", 0], ["C5'", 0], ["O2", 0], ["OP2", 0], ["C1'", 0], ["O3'", 0], ["N1", 0], ["C3'", 0], ["O4", 0], ["C4'", 0], ["C2'", 0], ["O4'", 0], ["C5", 0],
    ["O3'", -1],
] as Atom[];

const ThymineBonds = [
    ["C1'", "C2'"],
    ["C1'", "N1"],
    ["C2", "N3"],
    ["C2", "O2"],
    ["C2'", "C3'"],
    ["C3'", "O3'"],
    ["C4", "C5"],
    ["C4", "O4"],
    ["C4'", "C3'"],
    ["C4'", "O4'"],
    ["C5", "C6"],
    ["C5", "C7"],
    ["C5'", "C4'"],
    ["C6", "N1"],
    ["N1", "C2"],
    ["N3", "C4"],
    ["O4'", "C1'"],
    ["O5'", "C5'"],
    ["P", "O5'"],
    ["P", "OP1"],
    ["P", "OP2"],
] as BondPair[];
const ThymineAngles = [
    ["C1'", "C2'", "C3'"],
    ["C1'", "N1", "C2"],
    ["C1'", "N1", "C6"],
    ["C2", "N3", "C4"],
    ["C2'", "C1'", "N1"],
    ["C2'", "C3'", "C4'"],
    ["C3'", "C4'", "O4'"],
    ["C4", "C5", "C6"],
    ["C4", "C5", "C7"],
    ["C4'", "C3'", "O3'"],
    ["C4'", "O4'", "C1'"],
    ["C5", "C6", "N1"],
    ["C5'", "C4'", "C3'"],
    ["C6", "N1", "C2"],
    ["C7", "C5", "C6"],
    ["N1", "C2", "N3"],
    ["N1", "C2", "O2"],
    ["N3", "C4", "C5"],
    ["N3", "C4", "O4"],
    ["O2", "C2", "N3"],
    ["O3'_2", "P", "O5'"],
    ["O3'_2", "P", "OP1"],
    ["O3'_2", "P", "OP2"],
    ["O4", "C4", "C5"],
    ["O4'", "C1'", "C2'"],
    ["O4'", "C1'", "N1"],
    ["O5'", "C5'", "C4'"],
    ["OP1", "P", "OP2"],
    ["P", "O5'", "C5'"],
] as AngleTriplet[];
const ThymineAtoms = [
    ["C2", 0], ["OP1", 0], ["C4", 0], ["C6", 0], ["P", 0], ["N3", 0], ["O5'", 0], ["C5'", 0], ["C7", 0], ["O2", 0], ["OP2", 0], ["C1'", 0], ["O3'", 0], ["N1", 0], ["C3'", 0], ["O4", 0], ["C4'", 0], ["C2'", 0], ["O4'", 0], ["C5", 0],
    ["O3'", -1],
] as Atom[];

const Angles = {
    'A': AdenineAngles,
    'DA': AdenineAngles,
    'C': CytidineAngles,
    'DC': CytidineAngles,
    'G': GuanosineAngles,
    'DG': GuanosineAngles,
    'DT': ThymineAngles,
    'U': UracilAngles,
};
const Atoms = {
    'A': AdenineAtoms,
    'DA': AdenineAtoms,
    'C': CytidineAtoms,
    'DC': CytidineAtoms,
    'G': GuanosineAtoms,
    'DG': GuanosineAtoms,
    'DT': ThymineAtoms,
    'U': UracilAtoms,
}
const Bonds = {
    'A': AdenineBonds,
    'DA': AdenineBonds,
    'C': CytidineBonds,
    'DC': CytidineBonds,
    'G': GuanosineBonds,
    'DG': GuanosineBonds,
    'DT': ThymineBonds,
    'U': UracilBonds,
};

export namespace Prosco {
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

    function measureBondAngles(requiredAtoms: Map<string, jsLLKA.LLKAAtom>, angles: AngleTriplet[]): BondAngle[] | undefined {
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

    function measureBondLenghts(requiredAtoms: Map<string, jsLLKA.LLKAAtom>, bonds: BondPair[]): BondLength[] | undefined {
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

        const lengths = measureBondLenghts(requiredAtoms, Bonds[compId]);
        if (!lengths)
            return residue;

        const angles = measureBondAngles(requiredAtoms, Angles[compId]);
        if (!angles)
            return residue;

        residue.bondLengths = lengths;
        residue.bondAngles = angles;

        return residue;
    }

    function shiftedName(name: string, shift: 0 | -1) {
        return shift === 0 ? name : name + '_2';
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

    export function calculate(steps: jsLLKA.LLKAStructures) {
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
