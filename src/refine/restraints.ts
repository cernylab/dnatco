import * as jsLLKA from 'jsllka';
import { NdbStructNtcStep, NdbStructNtcStepSummary } from '../cif/categories/ndb-struct-ntc';
import { ClassificationContext } from '../dnatco/classification-context';
import { Dnatcofication } from '../dnatco/dnatcofication';
import { M } from '../util/math';

const DinuTorsions = [
    jsLLKA.DinucleotideTorsion.DELTA_1,
    jsLLKA.DinucleotideTorsion.EPSILON_1,
    jsLLKA.DinucleotideTorsion.ZETA_1,
    jsLLKA.DinucleotideTorsion.ALPHA_2,
    jsLLKA.DinucleotideTorsion.BETA_2,
    jsLLKA.DinucleotideTorsion.GAMMA_2,
    jsLLKA.DinucleotideTorsion.DELTA_2,
    jsLLKA.DinucleotideTorsion.CHI_1,
    jsLLKA.DinucleotideTorsion.CHI_2,
];

const XRMetrics = [
    [jsLLKA.CrossResidueMetric.DIST_CC, false],
    [jsLLKA.CrossResidueMetric.DIST_NN, false],
    [jsLLKA.CrossResidueMetric.TOR_MU, true],
];

const RiboseAtoms = [
    ["C4'", "O4'", "C1'", "C2'"],    // nu 0
    ["O4'", "C1'", "C2'", "C3'"],    // nu 1
    ["C1'", "C2'", "C3'", "C4'"],    // nu 2
    ["C2'", "C3'", "C4' ","O4'"],    // nu 3
    ["C3'", "C4'", "O4'", "C1'"],    // nu 4
];

function metric(cluster: jsLLKA.LLKAClassificationCluster, metricId: jsLLKA.DinucleotideTorsion|jsLLKA.CrossResidueMetric): jsLLKA.LLKAClassificationMetric {
    switch (metricId) {
    case jsLLKA.DinucleotideTorsion.DELTA_1:
        return cluster.delta_1;
    case jsLLKA.DinucleotideTorsion.EPSILON_1:
        return cluster.epsilon_1;
    case jsLLKA.DinucleotideTorsion.ZETA_1:
        return cluster.zeta_1;
    case jsLLKA.DinucleotideTorsion.ALPHA_2:
        return cluster.alpha_2;
    case jsLLKA.DinucleotideTorsion.BETA_2:
        return cluster.beta_2;
    case jsLLKA.DinucleotideTorsion.GAMMA_2:
        return cluster.gamma_2;
    case jsLLKA.DinucleotideTorsion.DELTA_2:
        return cluster.delta_2;
    case jsLLKA.DinucleotideTorsion.CHI_1:
        return cluster.chi_1;
    case jsLLKA.DinucleotideTorsion.CHI_2:
        return cluster.chi_2;
    case jsLLKA.CrossResidueMetric.DIST_CC:
        return cluster.CC;
    case jsLLKA.CrossResidueMetric.DIST_NN:
        return cluster.NN;
    case jsLLKA.CrossResidueMetric.TOR_MU:
        return cluster.mu;
    }

    throw new Error('Unknown metric');
}

function metricName(metric: jsLLKA.DinucleotideTorsion|jsLLKA.CrossResidueMetric) {
    switch (metric) {
    case jsLLKA.DinucleotideTorsion.DELTA_1:
        return 'delta_1';
    case jsLLKA.DinucleotideTorsion.EPSILON_1:
        return 'epsilon_1';
    case jsLLKA.DinucleotideTorsion.ZETA_1:
        return 'zeta_1';
    case jsLLKA.DinucleotideTorsion.ALPHA_2:
        return 'alpha_2';
    case jsLLKA.DinucleotideTorsion.BETA_2:
        return 'beta_2';
    case jsLLKA.DinucleotideTorsion.GAMMA_2:
        return 'gamma_2';
    case jsLLKA.DinucleotideTorsion.DELTA_2:
        return 'delta_2';
    case jsLLKA.DinucleotideTorsion.CHI_1:
        return 'chi_1';
    case jsLLKA.DinucleotideTorsion.CHI_2:
        return 'chi_2';
    case jsLLKA.CrossResidueMetric.DIST_CC:
        return 'CC';
    case jsLLKA.CrossResidueMetric.DIST_NN:
        return 'NN';
    case jsLLKA.CrossResidueMetric.TOR_MU:
        return 'mu';
    }

    throw new Error('Unknown metric');
}

function residueToUse(metricId: jsLLKA.DinucleotideTorsion) {
    switch (metricId) {
    case jsLLKA.DinucleotideTorsion.DELTA_1:
        return [false, false, false, false];
    case jsLLKA.DinucleotideTorsion.EPSILON_1:
        return [false, false, false, true];
    case jsLLKA.DinucleotideTorsion.ZETA_1:
        return [false, false, true, true];
    case jsLLKA.DinucleotideTorsion.ALPHA_2:
        return [false, true, true, true];
    case jsLLKA.DinucleotideTorsion.BETA_2:
        return [true, true, true, true];
    case jsLLKA.DinucleotideTorsion.GAMMA_2:
        return [true, true, true, true];
    case jsLLKA.DinucleotideTorsion.DELTA_2:
        return [true, true, true, true];
    case jsLLKA.DinucleotideTorsion.CHI_1:
        return [false, false, false, false];
    case jsLLKA.DinucleotideTorsion.CHI_2:
        return [true, true, true, true];
    }

    throw new Error('Unknown metric');
}

function restraintsAtoms(firstBase: string, secondBase: string): { atoms: string[], isTorsion: boolean }[] {
    const restraintsAtoms = [];

    for (const tor of DinuTorsions) {
        const ret = jsLLKA.dinucleotideTorsionAtomsBases(firstBase, secondBase, tor);
        if (ret.isSuccess()) {
            const quad = ret.success();
            restraintsAtoms.push({ atoms: [quad.a, quad.b, quad.c, quad.d], isTorsion: true });
            quad.delete();
        } else
            restraintsAtoms.push({ atoms: [], isTorsion: true });

        ret.delete();
    }

    for (const [xr, isTorsion] of XRMetrics) {
        const ret = jsLLKA.crossResidueMetricAtomsFromBases(firstBase, secondBase, xr);
        if (ret.isSuccess()) {
            const quad = ret.success();
            if (isTorsion)
                restraintsAtoms.push({ atoms: [quad.a, quad.b, quad.c, quad.d], isTorsion });
            else
                restraintsAtoms.push({ atoms: [quad.a, quad.b], isTorsion });

            quad.delete();
        } else
            restraintsAtoms.push({ atoms: [], isTorsion });
    }

    return restraintsAtoms;
}

function sigma(confal: jsLLKA.LLKAConfal, metricId: jsLLKA.DinucleotideTorsion|jsLLKA.CrossResidueMetric, sigmaFactor: number) {
    switch (metricId) {
    case jsLLKA.DinucleotideTorsion.DELTA_1:
        return confal.delta_1 * sigmaFactor;
    case jsLLKA.DinucleotideTorsion.EPSILON_1:
        return confal.epsilon_1 * sigmaFactor;
    case jsLLKA.DinucleotideTorsion.ZETA_1:
        return confal.zeta_1 * sigmaFactor;
    case jsLLKA.DinucleotideTorsion.ALPHA_2:
        return confal.alpha_2 * sigmaFactor;
    case jsLLKA.DinucleotideTorsion.BETA_2:
        return confal.beta_2 * sigmaFactor;
    case jsLLKA.DinucleotideTorsion.GAMMA_2:
        return confal.gamma_2 * sigmaFactor;
    case jsLLKA.DinucleotideTorsion.DELTA_2:
        return confal.delta_2 * sigmaFactor;
    case jsLLKA.DinucleotideTorsion.CHI_1:
        return confal.chi_1 * sigmaFactor;
    case jsLLKA.DinucleotideTorsion.CHI_2:
        return confal.chi_2 * sigmaFactor;
    case jsLLKA.CrossResidueMetric.DIST_CC:
        return confal.CC * sigmaFactor;
    case jsLLKA.CrossResidueMetric.DIST_NN:
        return confal.NN * sigmaFactor;
    case jsLLKA.CrossResidueMetric.TOR_MU:
        return confal.mu * sigmaFactor;
    }

    throw new Error('Unknown metric');
}

export namespace Restraints {
    export type Atom = {
        name: string,
        chain: string,
        compound: string,
        authNum: number,
        altId: string|undefined,
        insCode: string|undefined,
    }
    export function Atom(name: string, chain: string, compound: string, authNum: number, altId: string|undefined, insCode: string|undefined): Atom {
        return { name, chain, compound, authNum, altId, insCode };
    }

    export type Distance = {
        rtype: 'distance',

        atomA: Atom,
        atomB: Atom,

        length: number,
        sigma: number,
    }
    export function Distance(atomA: Atom, atomB: Atom, length: number, sigma: number): Distance {
        return { rtype: 'distance', atomA, atomB, length, sigma };
    }
    export function isDistance(r: Restraint): r is Distance {
        return r.rtype === 'distance';
    }

    export type Torsion = {
        rtype: 'torsion',

        atomA: Atom,
        atomB: Atom,
        atomC: Atom,
        atomD: Atom,

        angle: number,
        sigma: number,
        period: number,

        kind: 'backbone' | 'sugar' | 'cross-residue' | 'base';
    }
    export function Torsion(kind: Torsion['kind'], atomA: Atom, atomB: Atom, atomC: Atom, atomD: Atom, angle: number, sigma: number, period: number): Torsion {
        return {
            rtype: 'torsion',
            atomA, atomB, atomC, atomD,
            angle, sigma,
            period,
            kind
        };
    }
    export function isTorsion(r: Restraint): r is Torsion {
        return r.rtype === 'torsion';
    }

    export type Unavailable = {
        rtype: 'unavailable';

        stepName: string;
        reason: string;
    }
    export function Unavailable(stepName: string, reason: string): Unavailable {
        return { rtype: 'unavailable', stepName, reason };
    }
    export function isUnavailable(r: Restraint): r is Unavailable {
        return r.rtype === 'unavailable';
    }

    export type Restraint = Distance | Torsion | Unavailable;

    export function make(d: Dnatcofication, maxRmsd: number, sigmaFactor: number) {
        const steps = d.table(NdbStructNtcStep);
        const summary = d.table(NdbStructNtcStepSummary);
        const {
            name,
            label_comp_id_1, auth_seq_id_1, label_alt_id_1, PDB_ins_code_1, auth_asym_id_1,
            label_comp_id_2, auth_seq_id_2, label_alt_id_2, PDB_ins_code_2,
            PDB_model_number,
            _rowCount
        } = steps;
        const { cartesian_rmsd_closest_NtC_representative, closest_NtC } = summary;

        const restraints = new Array<Restraints.Restraint>();

        const ctx = ClassificationContext.context();
        for (let row = 0; row < _rowCount; row++) {
            const ntc = jsLLKA.nameToNtC(closest_NtC.values?.[row] ?? 'NANT');
            const stepName = name.values?.[row] ?? '';
            const rmsd = cartesian_rmsd_closest_NtC_representative.values?.[row] ?? 0;
            const base1 = label_comp_id_1.values?.[row] ?? '';
            const base2 = label_comp_id_2.values?.[row] ?? '';
            const resNo1 = auth_seq_id_1.values?.[row] ?? -1;
            const resNo2 = auth_seq_id_2.values?.[row] ?? -1;
            const chain = auth_asym_id_1.values?.[row] ?? '';
            const altId1 = label_alt_id_1.values?.[row];
            const altId2 = label_alt_id_2.values?.[row];
            const insCode1 = PDB_ins_code_1.values?.[row];
            const insCode2 = PDB_ins_code_2.values?.[row];
            const modelNo = PDB_model_number.values?.[row] ?? 1;

            if (modelNo !== 1)
                continue;   // If there are multiple models, make restraints only from the first model

            if (rmsd > maxRmsd) {
                restraints.push(Restraints.Unavailable(stepName, `RMSD ${rmsd} is too high`));
                continue;
            }

            const retCluster = jsLLKA.classificationClusterForNtC(ntc, ctx);
            const retConfal = jsLLKA.confalForNtC(ntc, ctx);
            if (!retCluster.isSuccess() || !retConfal.isSuccess()) {
                restraints.push(Restraints.Unavailable(stepName, 'Metrics for entire step is not available'));
                continue;
            }

            const restraintAtoms = restraintsAtoms(base1, base2);
            const cluster = retCluster.success();
            const confal = retConfal.success();

            retCluster.delete();
            retConfal.delete();

            // FIXME (maybe): This code uses the "expanded" altId and applies the altId to all atoms in a residueNos
            // This is wrong because altId is a property of an atom. At this point it is unclear what kind of a problem
            // this could cause. At the moment we assume that refinement tools will cope with that.

            // Restraints for dinucleotide torsions
            for (let idx = 0; idx < DinuTorsions.length; idx++) {
                const { atoms } = restraintAtoms[idx];
                const metricId = DinuTorsions[idx];
                const met = metric(cluster, metricId);
                const resToUse = residueToUse(metricId);

                if (atoms.length === 0)
                    restraints.push(Restraints.Unavailable(stepName, `Data for ${metricName(DinuTorsions[idx])} is not available. The step was most likely classified as NANT.`));
                else {
                    restraints.push(
                        Restraints.Torsion(
                            (metricId === jsLLKA.DinucleotideTorsion.CHI_1 || metricId == jsLLKA.DinucleotideTorsion.CHI_2) ? 'base' : 'backbone',
                            Restraints.Atom(atoms[0], chain, resToUse[0] ? base1 : base2, resToUse[0] ? resNo1 : resNo1, resToUse[0] ? altId1 : altId2, resToUse[0] ? insCode1 : insCode2),
                            Restraints.Atom(atoms[1], chain, resToUse[1] ? base1 : base2, resToUse[1] ? resNo1 : resNo1, resToUse[1] ? altId1 : altId2, resToUse[1] ? insCode1 : insCode2),
                            Restraints.Atom(atoms[2], chain, resToUse[2] ? base1 : base2, resToUse[2] ? resNo1 : resNo1, resToUse[2] ? altId1 : altId2, resToUse[2] ? insCode1 : insCode2),
                            Restraints.Atom(atoms[3], chain, resToUse[3] ? base1 : base2, resToUse[3] ? resNo1 : resNo1, resToUse[3] ? altId1 : altId2, resToUse[3] ? insCode1 : insCode2),
                            M.r2d(met.meanValue),
                            sigma(confal, metricId, sigmaFactor),
                            1
                        )
                    );
                }
            }

            // Restraints for cross-residue metrics
            for (let idx = 0; idx < XRMetrics.length; idx++) {
                const { atoms, isTorsion } = restraintAtoms[idx + DinuTorsions.length];
                const metricId = XRMetrics[idx][0];
                const met = metric(cluster, metricId);

                if (atoms.length === 0) {
                    restraints.push({
                        rtype: 'unavailable',
                        stepName: stepName,
                        reason: `Data for ${metricName(DinuTorsions[idx])} is not available`,
                    });
                } else {
                    if (isTorsion) {
                        restraints.push(
                            Restraints.Torsion(
                                'cross-residue',
                                Restraints.Atom(atoms[0], chain, base1, resNo1, altId1, insCode1),
                                Restraints.Atom(atoms[1], chain, base1, resNo1, altId1, insCode1),
                                Restraints.Atom(atoms[2], chain, base2, resNo2, altId2, insCode2),
                                Restraints.Atom(atoms[3], chain, base2, resNo2, altId2, insCode2),
                                M.r2d(met.meanValue),
                                sigma(confal, metricId, sigmaFactor),
                                1
                            )
                        );
                    } else {
                        restraints.push(
                            Restraints.Distance(
                                Restraints.Atom(atoms[0], chain, base1, resNo1, altId1, insCode1),
                                Restraints.Atom(atoms[1], chain, base2, resNo2, altId2, insCode2),
                                met.meanValue,
                                sigma(confal, metricId,sigmaFactor)
                            )
                        );
                    }
                }
            }

            // Restraints for ribose ring
            // Do first residue first
            for (let idx = 0; idx < RiboseAtoms.length; idx++) {
                const atoms = RiboseAtoms[idx];
                const nuKey = `nu_${idx}` as keyof jsLLKA.LLKANuAnglesMetrics;
                const metric = cluster.nusFirst[nuKey];
                restraints.push(
                    Restraints.Torsion(
                        'sugar',
                        Restraints.Atom(atoms[0], chain, base1, resNo1, altId1, insCode1),
                        Restraints.Atom(atoms[1], chain, base1, resNo1, altId1, insCode1),
                        Restraints.Atom(atoms[2], chain, base1, resNo1, altId1, insCode1),
                        Restraints.Atom(atoms[3], chain, base1, resNo1, altId1, insCode1),
                        M.r2d(metric.meanValue),
                        confal.nusFirst[nuKey] * sigmaFactor,
                        1,
                    )
                );
            }
            // Do second residue next
            for (let idx = 0; idx < RiboseAtoms.length; idx++) {
                const atoms = RiboseAtoms[idx];
                const nuKey = `nu_${idx}` as keyof jsLLKA.LLKANuAnglesMetrics;
                const metric = cluster.nusSecond[('nu_' + idx) as keyof jsLLKA.LLKANuAnglesMetrics];
                restraints.push(
                    Restraints.Torsion(
                        'sugar',
                        Restraints.Atom(atoms[0], chain, base2, resNo2, altId2, insCode2),
                        Restraints.Atom(atoms[1], chain, base2, resNo2, altId2, insCode2),
                        Restraints.Atom(atoms[2], chain, base2, resNo2, altId2, insCode2),
                        Restraints.Atom(atoms[3], chain, base2, resNo2, altId2, insCode2),
                        M.r2d(metric.meanValue),
                        confal.nusSecond[nuKey] * sigmaFactor,
                        1
                    )
                );
            }
        }

        return restraints;
    }
}
