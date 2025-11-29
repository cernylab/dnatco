import * as jsLLKA from 'jsllka';
import { NavalResult } from './';
import { AnglesReport } from "./angles-report";
import { BondsReport } from "./bonds-report";
import { BunchOfAtoms, Common } from "./common";
import { GeometryReport } from "./geometry-report";
import { Measure } from './measure';
import { MappedAngleRestraints, MappedBondRestraints } from "./restraints";
import { Validation } from "./validation";

const MaxResidueDistance = 2.0; // Angstroms
const EnabledValidators = Validation.ValidatorBase | Validation.ValidatorPO4 | Validation.ValidatorSugarPucker;

function allAvailableAltIds(structures: (jsLLKA.LLKAStructure|undefined)[]) {
    const seenAltIds = new Set<string>();

    for (const stru of structures) {
        if (!stru)
            continue;

        for (let idx = 0; idx < stru.size(); idx++) {
            const at = stru.get(idx);
            if (at.label_alt_id !== jsLLKA.NO_ALTID)
                seenAltIds.add(String.fromCharCode(at.label_alt_id));
        }
    }

    return seenAltIds;
}

function areNucleotidesSensible(stru: jsLLKA.LLKAStructure) {
    if (stru.size() === 0)
        throw new Error('Structure does not contain any atoms. This should not happen here');

    const compId = stru.get(0).label_comp_id;
    for (let idx = 0; idx < stru.size(); idx++) {
        const atom = stru.get(idx);
        if (!Common.isStandardNucleotide(atom.label_comp_id))
            return false;

        // Disallow residues with microheterogenity
        if (atom.label_comp_id !== compId)
            return false;
    }

    return true;
}

function areResiduesConnected(first: jsLLKA.LLKAStructure|undefined, second: jsLLKA.LLKAStructure|undefined) {
    if (!first || !second)
        return false;

    const O3p = Common.findAtom(first, "O3'");
    const P = Common.findAtom(second, "P");

    if (!O3p || !P)
        return false;

    return jsLLKA.LLKA.measureDistance(O3p, P) <= MaxResidueDistance;
}

function filterByAltId(atoms: jsLLKA.LLKAStructure, altId: string) {
    const filtered = jsLLKA.CLLKAStructure();

    for (let idx = 0; idx < atoms.size(); idx++) {
        const at = atoms.get(idx);
        const _altId = at.label_alt_id === jsLLKA.NO_ALTID ? '' : String.fromCharCode(at.label_alt_id);

        if (!_altId || _altId === altId)
            filtered.push_back(at);
    }

    return filtered;
}

function makeBunches(before: jsLLKA.LLKAStructure|undefined, current: jsLLKA.LLKAStructure, after: jsLLKA.LLKAStructure|undefined) {
    const bunches = [];

    const allAltIds = allAvailableAltIds([before, current, after]);
    if (allAltIds.size > 0) {
        // Split the whole thing up to smaller pieces filtered by corresponding altIds
        for (const altId of allAltIds.values()) {
            const filteredBefore = before ? filterByAltId(before, altId) : void 0;
            const filteredCurrent = filterByAltId(current, altId);
            const filteredAfter = after ? filterByAltId(after, altId) : void 0;

            bunches.push(BunchOfAtoms(filteredBefore, filteredCurrent, filteredAfter, altId, true));
        }
    } else
        bunches.push(BunchOfAtoms(before, current, after, '', false));

    return bunches;
}

function measureStructure(pdbcode: string, segs: any) {
    const measurements = [];

    const modelKeys = segs.models.keys();
    for (let modelMapIdx = 0; modelMapIdx < modelKeys.size(); modelMapIdx++) {
        const modelKey = modelKeys.get(modelMapIdx);
        const model = segs.models.get(modelKey);

        const chainKeys = model.chains.keys();
        for (let chainKeyIdx = 0; chainKeyIdx < chainKeys.size(); chainKeyIdx++) {
            const chainKey = chainKeys.get(chainKeyIdx);
            const chain = model.chains.get(chainKey);
            const residues = residuesAsVector(chain.residues);

            const N = residues.length;
            for (let idx = 0; idx < N; idx++) {
                // "Minichain" of three consecutive residues, we need all three to calculate everything
                // Atoms from the previous residue, needed for alpha, beta backbone torsions
                let before = idx > 0 ? residues[idx - 1] : void 0;
                const current = residues[idx];
                let after = idx < N - 1 ? residues[idx + 1] : void 0;

                if (!areNucleotidesSensible(current))
                    continue;

                // Eliminate the pieces from the chain that we do not know how to deal with
                // We are dealing with only with standard residues identified as A, DA, C, DC, G, DG, DT and U
                if (before && !areNucleotidesSensible(before))
                    before = void 0;
                if (after && !areNucleotidesSensible(after))
                    after = void 0;

                const bunches = makeBunches(before, current, after);
                for (const bunch of bunches) {
                    // Structures with creatively assigned altIds may yield "empty" residues after we
                    // do the split by altIds.
                    if (bunch.current.size() === 0)
                        continue;

                    // Remove preceding/following residue from the bunch if they are not connected
                    // in the structure
                    const bef = areResiduesConnected(bunch.before, bunch.current)
                        ? bunch.before : void 0;
                    const aft = areResiduesConnected(bunch.current, bunch.after)
                        ? bunch.after : void 0;

                    const m = Measure.measure(pdbcode, BunchOfAtoms(bef, bunch.current, aft, bunch.expandedAltId, false));
                    if (m)
                        measurements.push(m);

                    if (bunch.owning) {
                        bunch.before?.delete();
                        bunch.current.delete();
                        bunch.after?.delete();
                    }
                }
            }

            for (const r of residues)
                r.delete();
        }
        chainKeys.delete();
    }
    modelKeys.delete();

    return measurements;
}

function residuesAsVector(residues: any) {
    const vec = new Array<jsLLKA.LLKAStructure>(residues.size());
    const keys = residues.keys(); // We hope that Emscripten returns the keys in the correct order
    for (let idx = 0; idx < keys.size(); idx++) {
        const key = keys.get(idx);
        const r = residues.get(key);

        vec[idx] = r.atoms;
    }
    keys.delete();

    return vec;
}

export namespace Validate {
    export function validate(pdbcode: string, structure: any, angleRestraints: MappedAngleRestraints.Groups, bondRestraints: MappedBondRestraints.Groups): NavalResult {
        const segs = new jsLLKA.LLKA.StructureSegments(structure);
        const measurements = measureStructure(pdbcode, segs);

        const geometry = GeometryReport.make(measurements);
        const bonds = BondsReport.make(measurements, bondRestraints, EnabledValidators);
        const angles = AnglesReport.make(measurements, angleRestraints, EnabledValidators);

        segs.delete();

        return { geometry, bonds, angles };
    }
}
