import * as jsLLKA from 'jsllka';
import { Common } from './common';
import { Measure } from "./measure";
import { MappedBondRestraints } from './restraints';
import { Validation } from './validation';
import { Logger } from '../../log/logger';

type MeasuredBond<T> = {
    name1: string,
    name2: string,
    value: keyof T,
    atom1: keyof Measure.AtomsOfInterest,
    atom2: keyof Measure.AtomsOfInterest,
}
function MB<T>(name1: string, name2: string, value: keyof T, atom1: keyof Measure.AtomsOfInterest, atom2: keyof Measure.AtomsOfInterest): MeasuredBond<T> {
    return { name1, name2, value, atom1, atom2 };
}

// Base
const BaseBondsCommon: MeasuredBond<Measure.Measurement>[] = [
    MB<Measure.Measurement>("N1", "C2", 'N1_C2', 'N1', 'C2'),
    MB<Measure.Measurement>("C2", "N3", 'C2_N3', 'C2', 'N3'),
    MB<Measure.Measurement>("N3", "C4", 'N3_C4', 'N3', 'C4'),
    MB<Measure.Measurement>("C4", "C5", 'C4_C5', 'C4', 'C5'),
    MB<Measure.Measurement>("C5", "C6", 'C5_C6', 'C5', 'C6'),
    MB<Measure.Measurement>("C6", "N1", 'C6_N1', 'C6', 'N1')
];
const BaseBondsA: MeasuredBond<Measure.ASpecific>[] = [
    MB<Measure.ASpecific>("C5", "N7", 'C5_N7', 'C5', 'N7'),
    MB<Measure.ASpecific>("N7", "C8", 'N7_C8', 'N7', 'C8'),
    MB<Measure.ASpecific>("C8", "N9", 'C8_N9', 'C8', 'N9'),
    MB<Measure.ASpecific>("N9", "C4", 'N9_C4', 'N9', 'C4'),
    MB<Measure.ASpecific>("C6", "N6", 'C6_N6', 'C6', 'N6'),
];
const BaseBondsC: MeasuredBond<Measure.CSpecific>[] = [
    MB<Measure.CSpecific>("C2", "O2", 'C2_O2', 'C2', 'O2'),
    MB<Measure.CSpecific>("C4", "N4", 'C4_N4', 'C4', 'N4'),
];
const BaseBondsG: MeasuredBond<Measure.GSpecific>[] = [
    MB<Measure.GSpecific>("C5", "N7", 'C5_N7', 'C5', 'N7'),
    MB<Measure.GSpecific>("N7", "C8", 'N7_C8', 'N7', 'C8'),
    MB<Measure.GSpecific>("C8", "N9", 'C8_N9', 'C8', 'N9'),
    MB<Measure.GSpecific>("N9", "C4", 'N9_C4', 'N9', 'C4'),
    MB<Measure.GSpecific>("C6", "O6", 'C6_O6', 'C6', 'O6'),
    MB<Measure.GSpecific>("C2", "N2", 'C2_N2', 'C2', 'N2'),
];
const BaseBondsT: MeasuredBond<Measure.TSpecific>[] = [
    MB<Measure.TSpecific>("C2", "O2", 'C2_O2', 'C2', 'O2'),
    MB<Measure.TSpecific>("C4", "O4", 'C4_O4', 'C4', 'O4'),
    MB<Measure.TSpecific>("C7", "C5", 'C7_C5', 'C7', 'C5'),
];
const BaseBondsU: MeasuredBond<Measure.USpecific>[] = [
    MB<Measure.USpecific>("C2", "O2", 'C2_O2', 'C2', 'O2'),
    MB<Measure.USpecific>("C4", "O4", 'C4_O4', 'C4', 'O4'),
];
// PO4
const PO4Bonds = [
    MB<Measure.Measurement>("OP1", "P", 'OP1_P', 'OP1_2', 'P_2'),
    MB<Measure.Measurement>("OP2", "P", 'OP2_P', 'OP2_2', 'P_2'),
    MB<Measure.Measurement>("O3'", "P", 'O3p_P', 'O3p_1', 'P_2'),
    MB<Measure.Measurement>("O5'", "P", 'O5p_P', 'O5p_2', 'P_2'),
    MB<Measure.Measurement>("O3'", "C3'", 'O3p_C3p', 'O3p_2', 'C3p_2'),
    MB<Measure.Measurement>("O5'", "C5'", 'O5p_C5p', 'O5p_2', 'C5p_2')
];
// Sugar
const SugarBondsCommon = [
    MB<Measure.Measurement>("C1'", "C2'", 'C1p_C2p', 'C1p_2', 'C2p_2'),
    MB<Measure.Measurement>("C2'", "C3'", 'C2p_C3p', 'C2p_2', 'C3p_2'),
    MB<Measure.Measurement>("C3'", "C4'", 'C3p_C4p', 'C3p_2', 'C4p_2'),
    MB<Measure.Measurement>("C4'", "O4'", 'C4p_O4p', 'C4p_2', 'O4p_2'),
    MB<Measure.Measurement>("C1'", "O4'", 'C1p_O4p', 'C1p_2', 'O4p_2'),
    MB<Measure.Measurement>("C4'", "C5'", 'C4p_C5p', 'C4p_2', 'C5p_2'),
];
const SugarBondsOxyribose = [
    MB<Measure.Measurement>("C2'", "O2'", 'C2p_O2p', 'C2p_2', 'O2p_2')
];
const SugarBondsA = [
    MB<Measure.ASpecific>("C1'", "N9", 'C1p_N9', 'C1p_2', 'N9')
];
const SugarBondsC = [
    MB<Measure.CSpecific>("C1'", "N1", 'C1p_N1', 'C1p_2', 'N1')
];
const SugarBondsG = [
    MB<Measure.GSpecific>("C1'", "N9", 'C1p_N9', 'C1p_2', 'N9')
];
const SugarBondsT = [
    MB<Measure.TSpecific>("C1'", "N1", 'C1p_N1', 'C1p_2', 'N1')
];
const SugarBondsU = [
    MB<Measure.USpecific>("C1'", "N1", 'C1p_N1', 'C1p_2', 'N1')
];

export namespace BondsReport {
    function baseRestraints(m: Measure.Measurement, restrs: MappedBondRestraints.Bases) {
        switch (m.stdBase) {
            case 'A':
            case 'DA':
                return restrs.A;
            case 'C':
            case 'DC':
                return restrs.C;
            case 'G':
            case 'DG':
                return restrs.G;
            case 'DT':
                return restrs.T;
            case 'U':
            case 'DU':
                return restrs.U;
        }
    }

    function PO4Restraints(m: Measure.Measurement, restrs: MappedBondRestraints.PO4, atom1: string, atom2: string) {
        const swapAlpha = atom1 === "O3'" && atom2 === "C3'";

        const zetaConf = swapAlpha ? m.zetaConf : m.zetaPrevConf;
        const alphaConf = swapAlpha ? m.alphaNextConf : m.alphaConf;

        if (zetaConf && zetaConf === 'ScMinus' && alphaConf && alphaConf === 'ScMinus')
            return restrs.AS_1;

        if (zetaConf && zetaConf === 'ScPlus' && alphaConf && alphaConf === 'ScPlus')
            return restrs.AS_3;

        if (zetaConf && zetaConf === 'ScMinus' && alphaConf && alphaConf === 'Ap')
            return restrs.AA_0;

        if (zetaConf && zetaConf === 'Ap' && alphaConf && alphaConf === 'ScMinus')
            return restrs.AA_1;

        if (zetaConf && zetaConf === 'Ap' && alphaConf && alphaConf === 'ScPlus')
            return restrs.AA_2;

        if (zetaConf && zetaConf === 'ScPlus' && alphaConf && alphaConf === 'Ap')
            return restrs.AA_3;

        if (Common.baseIs(m.stdBase, 'A', 'G'))
            return restrs.other_A_G;

        if (Common.baseIs(m.stdBase, 'C', 'U'))
            return restrs.other_U_C;

        if (Common.baseIs(m.stdBase, 'DA', 'DG'))
            return restrs.other_DA_DG;

        if (Common.baseIs(m.stdBase, 'DC', 'DT', 'DU'))
            return restrs.other_DT_DC;

        throw new Error('Cannot figure out which PO4 restraint to use');
    }

    function sbRestraints(m: Measure.Measurement, restrs: MappedBondRestraints.SugarBasic) {
        switch (m.stdBase) {
            case 'A':
            case 'G':
                return restrs.A_G;
            case 'DA':
            case 'DG':
                return restrs.DA_DG;
            case 'C':
            case 'U':
                return restrs.U_C;
            case 'DC':
            case 'DT':
            case 'DU':
                return restrs.DT_DC;
        }
    }

    function spRestraints(m: Measure.Measurement, restrsPucker: MappedBondRestraints.SugarPucker, restrsBasic: MappedBondRestraints.SugarBasic) {
        if (m.pucker) {
            if (m.pucker === 'C2Endo') {
                if (Common.baseIs(m.stdBase, 'A', 'G'))
                    return restrsPucker.A_G_C2p_endo;

                if (Common.baseIs(m.stdBase, 'U', 'C'))
                    return restrsPucker.U_C_C2p_endo;

                if (Common.baseIs(m.stdBase, 'DA', 'DG'))
                    return restrsPucker.DA_DG_C2p_endo;

                if (Common.baseIs(m.stdBase, 'DT', 'DC', 'DU'))
                    return restrsPucker.DT_DC_C2p_endo;

            } else if (m.pucker == 'C3Endo') {
                if (Common.baseIs(m.stdBase, 'A', 'G'))
                    return restrsPucker.A_G_C3p_endo;

                if (Common.baseIs(m.stdBase, 'U', 'C'))
                    return restrsPucker.U_C_C3p_endo;

                if (Common.baseIs(m.stdBase, 'DA', 'DG'))
                    return restrsPucker.DA_DG_C3p_endo;

                if (Common.baseIs(m.stdBase, 'DT', 'DC', 'DU'))
                    return restrsPucker.DT_DC_C3p_endo;
            } else {
                if (Common.baseIs(m.stdBase, 'A', 'G'))
                    return restrsPucker.A_G_other;

                if (Common.baseIs(m.stdBase, 'U', 'C'))
                    return restrsBasic.U_C; // This is intentional

                if (Common.baseIs(m.stdBase, 'DA', 'DG'))
                    return restrsPucker.DA_DG_other;

                if (Common.baseIs(m.stdBase, 'DT', 'DC', 'DU'))
                    return restrsPucker.DT_DC_other;
            }
        } else {
            if (Common.baseIs(m.stdBase, 'A', 'G'))
                return restrsBasic.A_G;

            if (Common.baseIs(m.stdBase, 'U', 'C'))
                return restrsBasic.U_C;

            if (Common.baseIs(m.stdBase, 'DA', 'DG'))
                return restrsBasic.DA_DG;

            if (Common.baseIs(m.stdBase, 'DT', 'DC', 'DU'))
                return restrsBasic.DT_DC;
        }

        throw new Error('Cannot figure out which SugarPucker restraint to use');
    }

    function validateBond(
        report: Report,
        m: Measure.Measurement,
        restrs: MappedBondRestraints.MRArray,
        n1: string, n2: string,
        a1: jsLLKA.LLKAAtom, a2: jsLLKA.LLKAAtom,
        length: number
    ) {
        const r = restrs.find(x => x.atom1_name === n1 && x.atom2_name === n2);
        if (!r) {
            Logger.log(Logger.Severity.Warning, `No restraint for bond ${n1} - ${n2}`);
        } else {
            report.push({
                name: r.name,
                atoms: {
                    a: Validation.Atom(a1.label_atom_id, a1.label_comp_id, Common.residueId(a1.auth_seq_id, a1.pdbx_PDB_ins_code), Common.maybeAltId(a1.label_alt_id), a1.label_seq_id),
                    b: Validation.Atom(a2.label_atom_id, a2.label_comp_id, Common.residueId(a2.auth_seq_id, a2.pdbx_PDB_ins_code), Common.maybeAltId(a2.label_alt_id), a2.label_seq_id),
                },
                calculated_value: length,
                target_value: r.csd_target,
                target_sigma: r.csd_std,
                pdb_allowed_left: r.pdb_3low,
                pdb_allowed_right: r.pdb_3high,
                pdb_suspicious_left: r.pdb_4low,
                pdb_suspicious_right: r.pdb_4high,
                pdbcode: m.pdbcode,
                modelNum: m.modelNum,
                chain: m.chain,
                chainId: m.chainId
            });
        }
    }

    function validateBonds<
        Bonds extends Array<T>,
        T extends MeasuredBond<Lengths>,
        Lengths
    >(report: Report, m: Measure.Measurement, restrs: MappedBondRestraints.MRArray, bonds: Bonds, lengths: Lengths) {
        for (const b of bonds) {
            validateBond(report, m, restrs, b.name1, b.name2, m.aoi[b.atom1] as jsLLKA.LLKAAtom, m.aoi[b.atom2] as jsLLKA.LLKAAtom, lengths[b.value] as number);
        }
    }

    function validateBondsPO4(report: Report, m: Measure.Measurement, restraints: MappedBondRestraints.PO4, bonds: typeof PO4Bonds) {
        for (const b of bonds) {
            const lv = m[b.value];
            const restrs = PO4Restraints(m, restraints, b.name1, b.name2)!;

            if (typeof lv === 'number')
                validateBond(report, m, restrs, b.name1, b.name2, m.aoi[b.atom1] as jsLLKA.LLKAAtom, m.aoi[b.atom2] as jsLLKA.LLKAAtom, lv);
        }
    }

    export type Report = Validation.Report<Validation.BondAtoms>;

    export function make(measurements: Measure.Measurement[], restraints: MappedBondRestraints.Groups, enabledValidators: number) {
        const report: Report = [];

        for (const m of measurements) {
            // Base
            if (enabledValidators & Validation.ValidatorBase) {
                const restrs = baseRestraints(m, restraints.bases);
                validateBonds(report, m, restrs, BaseBondsCommon, m);

                const b = m.base;
                if (Measure.isA(b))
                    validateBonds(report, m, restrs, BaseBondsA, b);
                else if (Measure.isC(b))
                    validateBonds(report, m, restrs, BaseBondsC, b);
                else if (Measure.isG(b))
                    validateBonds(report, m, restrs, BaseBondsG, b);
                else if (Measure.isT(b))
                    validateBonds(report, m, restrs, BaseBondsT, b);
                else if (Measure.isU(b))
                    validateBonds(report, m, restrs, BaseBondsU, b);
            }

            // PO4
            if (enabledValidators & Validation.ValidatorPO4)
                validateBondsPO4(report, m, restraints.PO4, PO4Bonds)

            // Sugar basic
            if (enabledValidators & Validation.ValidatorSugarBasic) {
                const restrs = sbRestraints(m, restraints.sugarBasic);
                validateBonds(report, m, restrs, SugarBondsCommon, m);
                if (!m.isDeoxyribose)
                    validateBonds(report, m, restrs, SugarBondsOxyribose, m);
                const b = m.base;
                if (Measure.isA(b))
                    validateBonds(report, m, restrs, SugarBondsA, b);
                else if (Measure.isC(b))
                    validateBonds(report, m, restrs, SugarBondsC, b);
                else if (Measure.isG(b))
                    validateBonds(report, m, restrs, SugarBondsG, b);
                else if (Measure.isT(b))
                    validateBonds(report, m, restrs, SugarBondsT, b);
                else if (Measure.isU(b))
                    validateBonds(report, m, restrs, SugarBondsU, b);
            }

            // Sugar pucker
            if (enabledValidators & Validation.ValidatorSugarPucker) {
                const restrs = spRestraints(m, restraints.sugarPucker, restraints.sugarBasic);
                validateBonds(report, m, restrs, SugarBondsCommon, m);
                if (!m.isDeoxyribose)
                    validateBonds(report, m, restrs, SugarBondsOxyribose, m);
                const b = m.base;
                if (Measure.isA(b))
                    validateBonds(report, m, restrs, SugarBondsA, b);
                else if (Measure.isC(b))
                    validateBonds(report, m, restrs, SugarBondsC, b);
                else if (Measure.isG(b))
                    validateBonds(report, m, restrs, SugarBondsG, b);
                else if (Measure.isT(b))
                    validateBonds(report, m, restrs, SugarBondsT, b);
                else if (Measure.isU(b))
                    validateBonds(report, m, restrs, SugarBondsU, b);
            }
        }

        return report;
    }
}
