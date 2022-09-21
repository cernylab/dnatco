import { NdbStructNtcStep, NdbStructNtcStepSummary } from '../cif/categories/ndb-struct-ntc';
import { ClassificationContext } from '../dnatco/classification-context';
import { Dnatcofication } from '../dnatco/dnatcofication';
import { M } from '../util/math';
import * as jsLLKA from 'jsLLKA';

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

const SigmaFactor = 1.0;

export namespace Refmac {
    export type Atom = {
        chain: string,
        residue: number,
        name: string,
        altId: string|undefined,
        insCode: string|undefined,
    }

    export type Distance = {
        rtype: 'distance',

        atomA: Atom,
        atomB: Atom,

        length: number,
        sigma: number,
        // type: ??? This is a REFMAC option but I do not know what that means. Hardcoded to 1 for now
        type: 1,
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
    }

    export type Unavailable = {
        rtype: 'unavailable';

        stepName: string;
        reason: string;
    }

    export type Restraint = Distance | Torsion | Unavailable;

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

    function residueNos(metricId: jsLLKA.DinucleotideTorsion, resNo1: number, resNo2: number) {
        switch (metricId) {
        case jsLLKA.DinucleotideTorsion.DELTA_1:
            return [resNo1, resNo1, resNo1, resNo1];
        case jsLLKA.DinucleotideTorsion.EPSILON_1:
            return [resNo1, resNo1, resNo1, resNo2];
        case jsLLKA.DinucleotideTorsion.ZETA_1:
            return [resNo1, resNo1, resNo2, resNo2];
        case jsLLKA.DinucleotideTorsion.ALPHA_2:
            return [resNo1, resNo2, resNo2, resNo2];
        case jsLLKA.DinucleotideTorsion.BETA_2:
            return [resNo2, resNo2, resNo2, resNo2];
        case jsLLKA.DinucleotideTorsion.GAMMA_2:
            return [resNo2, resNo2, resNo2, resNo2];
        case jsLLKA.DinucleotideTorsion.DELTA_2:
            return [resNo2, resNo2, resNo2, resNo2];
        case jsLLKA.DinucleotideTorsion.CHI_1:
            return [resNo1, resNo1, resNo1, resNo1];
        case jsLLKA.DinucleotideTorsion.CHI_2:
            return [resNo2, resNo2, resNo2, resNo2];
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

    function sigma(confal: jsLLKA.LLKAConfal, metricId: jsLLKA.DinucleotideTorsion|jsLLKA.CrossResidueMetric) {
        switch (metricId) {
        case jsLLKA.DinucleotideTorsion.DELTA_1:
            return confal.delta_1 * SigmaFactor;
        case jsLLKA.DinucleotideTorsion.EPSILON_1:
            return confal.epsilon_1 * SigmaFactor;
        case jsLLKA.DinucleotideTorsion.ZETA_1:
            return confal.zeta_1 * SigmaFactor;
        case jsLLKA.DinucleotideTorsion.ALPHA_2:
            return confal.alpha_2 * SigmaFactor;
        case jsLLKA.DinucleotideTorsion.BETA_2:
            return confal.beta_2 * SigmaFactor;
        case jsLLKA.DinucleotideTorsion.GAMMA_2:
            return confal.gamma_2 * SigmaFactor;
        case jsLLKA.DinucleotideTorsion.DELTA_2:
            return confal.delta_2 * SigmaFactor;
        case jsLLKA.DinucleotideTorsion.CHI_1:
            return confal.chi_1 * SigmaFactor;
        case jsLLKA.DinucleotideTorsion.CHI_2:
            return confal.chi_2 * SigmaFactor;
        case jsLLKA.CrossResidueMetric.DIST_CC:
            return confal.CC * SigmaFactor;
        case jsLLKA.CrossResidueMetric.DIST_NN:
            return confal.NN * SigmaFactor;
        case jsLLKA.CrossResidueMetric.TOR_MU:
            return confal.mu * SigmaFactor;
        }

        throw new Error('Unknown metric');
    }

    export function restraints(d: Dnatcofication, maxRmsd: number) {
        const steps = d.table(NdbStructNtcStep);
        const summary = d.table(NdbStructNtcStepSummary);
        const {
            name,
            label_comp_id_1, auth_seq_id_1, label_alt_id_1, PDB_ins_code_1, auth_asym_id_1,
            label_comp_id_2, auth_seq_id_2, label_alt_id_2, PDB_ins_code_2,
            _rowCount
        } = steps;
        const { cartesian_rmsd_closest_NtC_representative, closest_NtC } = summary;

        const restraints = new Array<Restraint>();

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

            if (rmsd > maxRmsd) {
                restraints.push({
                    rtype: 'unavailable',
                    stepName,
                    reason: `RMSD ${rmsd} is too high`,
                });
                continue;

            }

            const retCluster = jsLLKA.classificationClusterForNtC(ntc, ctx);
            const retConfal = jsLLKA.confalForNtC(ntc, ctx);
            if (!retCluster.isSuccess() || !retConfal.isSuccess()) {
                restraints.push({
                    rtype: 'unavailable',
                    stepName,
                    reason: 'Metrics for entire step is not available',
                });
                continue;
            }

            const restraintAtoms = restraintsAtoms(base1, base2);
            const cluster = retCluster.success();
            const confal = retConfal.success();

            retCluster.delete();
            retConfal.delete();

            // FIXME (maybe): This code uses the "expanded" altId and applies the altId to all atoms in a residueNos
            // This is wrong because altId is a property of an atom. At this point it is unclear what kind of a problem
            // this could cause. At the moment we assume that REFMAC will ignore "altecode" directive for atoms with no altId

            // Restraints for dinucleotide torsions
            for (let idx = 0; idx < DinuTorsions.length; idx++) {
                const { atoms } = restraintAtoms[idx];
                const metricId = DinuTorsions[idx];
                const met = metric(cluster, metricId);
                const resNos = residueNos(metricId, resNo1, resNo2);

                if (atoms.length === 0) {
                    restraints.push({
                        rtype: 'unavailable',
                        stepName: stepName,
                        reason: `Data for ${metricName(DinuTorsions[idx])} is not available. The step was most likely classified as NANT.`,
                    });
                } else {
                    restraints.push({
                        rtype: 'torsion',
                        atomA: { name: atoms[0], residue: resNos[0], chain, altId: resNos[0] === resNo1 ? altId1 : altId2, insCode: resNos[0] === resNo1 ? insCode1 : insCode2 },
                        atomB: { name: atoms[1], residue: resNos[1], chain, altId: resNos[1] === resNo1 ? altId1 : altId2, insCode: resNos[1] === resNo1 ? insCode1 : insCode2 },
                        atomC: { name: atoms[2], residue: resNos[2], chain, altId: resNos[2] === resNo1 ? altId1 : altId2, insCode: resNos[2] === resNo1 ? insCode1 : insCode2 },
                        atomD: { name: atoms[3], residue: resNos[3], chain, altId: resNos[3] === resNo1 ? altId1 : altId2, insCode: resNos[3] === resNo1 ? insCode1 : insCode2 },
                        angle: M.r2d(met.meanValue),
                        sigma: sigma(confal, metricId),
                        period: 1,
                    });
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
                        restraints.push({
                            rtype: 'torsion',
                            atomA: { name: atoms[0], residue: resNo1, chain, altId: altId1, insCode: insCode1 },
                            atomB: { name: atoms[1], residue: resNo1, chain, altId: altId1, insCode: insCode1 },
                            atomC: { name: atoms[2], residue: resNo2, chain, altId: altId2, insCode: insCode2 },
                            atomD: { name: atoms[3], residue: resNo2, chain, altId: altId2, insCode: insCode2 },
                            angle: M.r2d(met.meanValue),
                            sigma: sigma(confal, metricId),
                            period: 1,
                        });
                    } else {
                        restraints.push({
                            rtype: 'distance',
                            atomA: { name: atoms[0], residue: resNo1, chain, altId: altId1, insCode: insCode1 },
                            atomB: { name: atoms[1], residue: resNo2, chain, altId: altId2, insCode: insCode2 },
                            length: met.meanValue,
                            sigma: sigma(confal, metricId),
                            type: 1
                        });
                    }
                }
            }

            // Restraints for ribose ring
            // Do first residue first
            for (let idx = 0; idx < RiboseAtoms.length; idx++) {
                const atoms = RiboseAtoms[idx];
                const nuKey = `nu_${idx}` as keyof jsLLKA.LLKANuAnglesMetrics;
                const metric = cluster.nusFirst[nuKey];
                restraints.push({
                    rtype: 'torsion',
                    atomA: { name: atoms[0], residue: resNo1, chain, altId: altId1, insCode: insCode1 },
                    atomB: { name: atoms[1], residue: resNo1, chain, altId: altId1, insCode: insCode1 },
                    atomC: { name: atoms[2], residue: resNo1, chain, altId: altId1, insCode: insCode1 },
                    atomD: { name: atoms[3], residue: resNo1, chain, altId: altId1, insCode: insCode1 },
                    angle: M.r2d(metric.meanValue),
                    sigma: confal.nusFirst[nuKey] * SigmaFactor,
                    period: 1,
                });
            }
            // Do second residue next
            for (let idx = 0; idx < RiboseAtoms.length; idx++) {
                const atoms = RiboseAtoms[idx];
                const nuKey = `nu_${idx}` as keyof jsLLKA.LLKANuAnglesMetrics;
                const metric = cluster.nusSecond[('nu_' + idx) as keyof jsLLKA.LLKANuAnglesMetrics];
                restraints.push({
                    rtype: 'torsion',
                    atomA: { name: atoms[0], residue: resNo2, chain, altId: altId2, insCode: insCode2 },
                    atomB: { name: atoms[1], residue: resNo2, chain, altId: altId2, insCode: insCode2 },
                    atomC: { name: atoms[2], residue: resNo2, chain, altId: altId2, insCode: insCode2 },
                    atomD: { name: atoms[3], residue: resNo2, chain, altId: altId2, insCode: insCode2 },
                    angle: M.r2d(metric.meanValue),
                    sigma: confal.nusSecond[nuKey] * SigmaFactor,
                    period: 1,
                });
            }
        }

        return restraints;
    }

    export function restraintAsText(restraint: Restraint) {
        const atom = (a: Atom) => {
            let s = `chain ${a.chain} residue ${a.residue} atom ${a.name}`;
            if (a.altId)
                s += ` altecode ${a.altId}`;
            if (a.insCode)
                s += ` insertion ${a.insCode}`;

            return s;
        };

        if (restraint.rtype === 'unavailable')
            return `# Missing restraint for step ${restraint.stepName}: ${restraint.reason}`;
        else if (restraint.rtype === 'torsion')
            return `external torsion first ${atom(restraint.atomA)} next ${atom(restraint.atomB)} next ${atom(restraint.atomC)} next ${atom(restraint.atomD)} value ${restraint.angle} sigma ${restraint.sigma} period ${restraint.period}`;
        else if (restraint.rtype === 'distance')
            return `external distance first ${atom(restraint.atomA)} second ${atom(restraint.atomB)} value ${restraint.length} sigma ${restraint.sigma} type ${restraint.type}`;
    }

    export function restraintsAsText(restraints: Restraint[]) {
        let text = '';
        for (const r of restraints)
            text += restraintAsText(r) + '\n';

        return text;
    }
}
