import { Restraints } from './restraints';
import { Dnatcofication } from '../dnatco/dnatcofication';
import { Residues } from '../dnatco/residues';

const SigmaFactor = 2.0;
const SPC = '  ';

function angle(a: number) {
    return a - 360.0 * (a > 180.0 ? 1 : 0);
}

function ln(text: string, indent = 0, isOk = true): Phenix.Line {
    let pre = '';
    for (let i = 0; i < indent; i++)
        pre += SPC;
    return { text: pre + text, isOk };
}

export namespace Phenix {
    export type Line = {
        text: string,
        isOk: boolean,
    }

    export type ResidueAlias = {
        alias: string;
        definition: string;
    }

    export type Restraints = {
        residueAliases: ResidueAlias[];
        restraints: Restraints.Restraint[];
    }

    // NOTE: for Phenix, we were using the (per residue) "altId" value, not the per atom "atomAltId" value, because Phenix supports the (altid ${altId} or altid ' ') notation
    // but, it was changed here as well, and we are using definitions like:
    // """
    //  A_DCA_5 = chain A and resname DC and altid A and resid 5
    //  A_DC_5 = chain A and resname DC and resid 5
    //
    //  atom_selection_1 = $A_1AP_4 and name C3'
    //  atom_selection_2 = $A_1AP_4 and name O3'
    //  atom_selection_3 = $A_DCA_5 and name P
    //  atom_selection_4 = $A_DC_5 and name O5'
    // """
    //  here only the P atom has altId 'A', O5' is common

    function makeResidueAlias(chain: string, compound: string, authNum: number, altId: string|undefined, insCode: string|undefined) {
        return `${chain}_${compound}${altId ?? ''}_${authNum}${insCode ?? ''}`
    }

    function makeResidueAliases(d: Dnatcofication) {
        const structures = d.data.structures;

        const aliases = new Array<ResidueAlias>();

        const model = structures[0]?.models[0];
        if (!model)
            return aliases;

        for (const chain of model.chains) {
            for (const res of chain.residues) {
                if (!Residues.isNucleicResidue(res.compound))
                    continue;

                const altIds = new Array<string|undefined>();
                for (const a of res.atoms) {
                    if (a.altId && !altIds.includes(a.altId))
                        altIds.push(a.altId);
                }
                // add the "empty" altId also when there are altIds, this will generate alias also for the "common" part of the residue
                //if (altIds.length === 0) // When there are no altIds
                    altIds.push(void 0);

                for (const altId of altIds) {
                    const alias = makeResidueAlias(chain.name, res.compound, res.authNum, altId, res.insCode ?? undefined);
                    let definition = `chain ${chain.name} and resname ${res.compound}`;
                    if (altId)
                        // not needed now
                        //definition += ` and (altid ${altId} or altid ' ')`;
                        // the atomAltId is enough
                        definition += ` and altid ${altId}`;
                    definition += ` and resid ${res.authNum}${res.insCode ?? ''}`;

                    aliases.push({ alias, definition });
                }
            }
        }

        return aliases;
    }

    function torsionKey(t: Restraints.Torsion) {
        const ak = (a: Restraints.Atom) => {
            return a.name + a.chain + a.compound + a.authNum.toString() + (a.altId ?? '') + (a.insCode ?? '');
        }
        return ak(t.atomA) + ak(t.atomB) + ak(t.atomC) + ak(t.atomD);
    }

    export function writeResidueAliases(aliases: ResidueAlias[]) {
        const lines = new Array<Line>();

        for (const a of aliases)
            lines.push(ln(`${a.alias} = ${a.definition}`, 1));

        return lines;
    }

    export function writeRestraints(restraints: Restraints.Restraint[]) {
        const lines = new Array<Line>();
        const usedTorsions = new Map<string, Restraints.Torsion>();

        for (const r of restraints) {
            if (Restraints.isTorsion(r)) {
                // First, the original restraint has to be deleted and then the new restraint can be set
                const aliasA = makeResidueAlias(r.atomA.chain, r.atomA.compound, r.atomA.authNum, r.atomA.atomAltId, r.atomA.insCode);
                const aliasB = makeResidueAlias(r.atomB.chain, r.atomB.compound, r.atomB.authNum, r.atomB.atomAltId, r.atomB.insCode);
                const aliasC = makeResidueAlias(r.atomC.chain, r.atomC.compound, r.atomC.authNum, r.atomC.atomAltId, r.atomC.insCode);
                const aliasD = makeResidueAlias(r.atomD.chain, r.atomD.compound, r.atomD.authNum, r.atomD.atomAltId, r.atomD.insCode);

                const addTorsion = (r: Restraints.Torsion) => {
                    lines.push(ln('dihedral {', 1));
                    lines.push(ln('action = *ntc_change', 2));
                    lines.push(ln(`atom_selection_1 = $${aliasA} and name ${r.atomA.name}`, 2));
                    lines.push(ln(`atom_selection_2 = $${aliasB} and name ${r.atomB.name}`, 2));
                    lines.push(ln(`atom_selection_3 = $${aliasC} and name ${r.atomC.name}`, 2));
                    lines.push(ln(`atom_selection_4 = $${aliasD} and name ${r.atomD.name}`, 2));
                    lines.push(ln(`angle_ideal = ${angle(r.angle).toFixed(1)}`, 2));
                    lines.push(ln(`sigma = ${r.sigma.toFixed(3)}`, 2));
                    lines.push(ln(`periodicity = ${-r.period}`, 2)); // This probably works only when periodicity is 1

                    // To account for the fact that most torsions are part of two steps, we need to specify
                    // alternate values for angle and sigma. Alternate values are taken from the previous torsion restraint,
                    // if such exists.
                    const torKey = torsionKey(r);
                    const previousTorsion = usedTorsions.get(torKey);
                    if (previousTorsion) {
                        lines.push(ln(`alt_angle_ideals = ${angle(previousTorsion.angle).toFixed(1)}`, 2));
                        lines.push(ln(`alt_sigmas = ${previousTorsion.sigma.toFixed(3)}`, 2));
                    } else
                        usedTorsions.set(torKey, r);

                    lines.push(ln('}', 1));
                }

                // TODO: this is more complicated, Phenix defines some conflicting torsions using different atoms than we are
                if (r.kind === 'backbone' || r.kind === 'base') {
                    // "Backbone" and "base" torsions require two actions.
                    lines.push(ln('dihedral {', 1));
                    lines.push(ln('action = *ntc_delete', 2));
                    lines.push(ln(`atom_selection_1 = $${aliasA} and name ${r.atomA.name}`, 2));
                    lines.push(ln(`atom_selection_2 = $${aliasB} and name ${r.atomB.name}`, 2));
                    lines.push(ln(`atom_selection_3 = $${aliasC} and name ${r.atomC.name}`, 2));
                    lines.push(ln(`atom_selection_4 = $${aliasD} and name ${r.atomD.name}`, 2));
                    lines.push(ln('}', 1));

                    addTorsion(r);
                } else {
                    // Other kinds of torsion do not seem to require the deletion directive
                    addTorsion(r);
                }
            } else if (Restraints.isDistance(r)) {
                const aliasA = makeResidueAlias(r.atomA.chain, r.atomA.compound, r.atomA.authNum,r.atomA.atomAltId, r.atomA.insCode);
                const aliasB = makeResidueAlias(r.atomB.chain, r.atomB.compound, r.atomB.authNum,r.atomB.atomAltId, r.atomB.insCode);

                lines.push(ln('bond {', 1));
                lines.push(ln('action = *add', 2));
                lines.push(ln(`atom_selection_1 = $${aliasA} and name ${r.atomA.name}`, 2));
                lines.push(ln(`atom_selection_2 = $${aliasB} and name ${r.atomB.name}`, 2));
                lines.push(ln(`distance_ideal = ${r.length.toFixed(3)}`, 2));
                lines.push(ln(`sigma = ${r.sigma.toFixed(3)}`, 2));
                lines.push(ln('}', 1));
            } else if (Restraints.isUnavailable(r))
                lines.push(ln(`# Restraint that would be a part of step ${r.stepName} is unavailable: ${r.reason}`, 2, false));
        }

        return lines;
    }

    export function restraints(d: Dnatcofication, NtCSet: string, maxRmsd: number): Restraints {
        const restraints = Restraints.make(d, NtCSet, maxRmsd, SigmaFactor);
        const residueAliases = makeResidueAliases(d);

        return { residueAliases, restraints };
    }

    export function restraintsAsLines(restraints: Restraints): Line[] {
        let lines = [ln('refinement.geometry_restraints.edits {')];

        lines = lines.concat(writeResidueAliases(restraints.residueAliases));
        lines = lines.concat(writeRestraints(restraints.restraints));

        lines.push(ln('}'));

        return lines;
    }
}
