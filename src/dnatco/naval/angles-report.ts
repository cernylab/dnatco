import * as jsLLKA from 'jsllka';
import { Common } from "./common";
import { Measure } from "./measure";
import { MappedAngleRestraints } from "./restraints";
import { Validation } from "./validation";

type MeasuredAngle<T> = {
    name1: string,
    name2: string,
    name3: string,
    value: keyof T,
    atom1: keyof Measure.AtomsOfInterest,
    atom2: keyof Measure.AtomsOfInterest,
    atom3: keyof Measure.AtomsOfInterest,
}
function MA<T>(name1: string, name2: string, name3: string, value: keyof T, atom1: keyof Measure.AtomsOfInterest, atom2: keyof Measure.AtomsOfInterest, atom3: keyof Measure.AtomsOfInterest): MeasuredAngle<T> {
    return { name1, name2, name3, value, atom1, atom2, atom3 };
}

const BaseAnglesCommon: MeasuredAngle<Measure.Measurement>[] = [
    MA<Measure.Measurement>("C6", "N1", "C2", 'C6_N1_C2', 'C6', 'N1', 'C2'),
    MA<Measure.Measurement>("N1", "C2", "N3", 'N1_C2_N3', 'N1', 'C2', 'N3'),
    MA<Measure.Measurement>("C2", "N3", "C4", 'C2_N3_C4', 'C2', 'N3', 'C4'),
    MA<Measure.Measurement>("N3", "C4", "C5", 'N3_C4_C5', 'N3', 'C4', 'C5'),
    MA<Measure.Measurement>("C4", "C5", "C6", 'C4_C5_C6', 'C4', 'C5', 'C6'),
    MA<Measure.Measurement>("C5", "C6", "N1", 'C5_C6_N1', 'C5', 'C6', 'N1')
];
const BaseAnglesA: MeasuredAngle<Measure.ASpecific>[] = [
    MA<Measure.ASpecific>("N3", "C4", "N9", 'N3_C4_N9', 'N3', 'C4', 'N9'),
    MA<Measure.ASpecific>("C6", "C5", "N7", 'C6_C5_N7', 'C6', 'C5', 'N7'),
    MA<Measure.ASpecific>("C5", "C4", "N9", 'C5_C4_N9', 'C5', 'C4', 'N9'),
    MA<Measure.ASpecific>("C4", "N9", "C8", 'C4_N9_C8', 'C4', 'N9', 'C8'),
    MA<Measure.ASpecific>("N9", "C8", "N7", 'N9_C8_N7', 'N9', 'C8', 'N7'),
    MA<Measure.ASpecific>("C8", "N7", "C5", 'C8_N7_C5', 'C8', 'N7', 'C5'),
    MA<Measure.ASpecific>("N7", "C5", "C4", 'N7_C5_C4', 'N7', 'C5', 'C4'),
    MA<Measure.ASpecific>("N6", "C6", "N1", 'N6_C6_N1', 'N6', 'C6', 'N1'),
    MA<Measure.ASpecific>("N6", "C6", "C5", 'N6_C6_C5', 'N6', 'C6', 'C5'),
];
const BaseAnglesC: MeasuredAngle<Measure.CSpecific>[] = [
    MA<Measure.CSpecific>("O2", "C2", "N1", 'O2_C2_N1', 'O2', 'C2', 'N1'),
    MA<Measure.CSpecific>("O2", "C2", "N3", 'O2_C2_N3', 'O2', 'C2', 'N3'),
    MA<Measure.CSpecific>("N4", "C4", "C5", 'N4_C4_C5', 'N4', 'C4', 'C5'),
    MA<Measure.CSpecific>("N4", "C4", "N3", 'N4_C4_N3', 'N4', 'C4', 'N3'),
];
const BaseAnglesG: MeasuredAngle<Measure.GSpecific>[] = [
    MA<Measure.GSpecific>("N3", "C4", "N9", 'N3_C4_N9', 'N3', 'C4', 'N9'),
    MA<Measure.GSpecific>("C6", "C5", "N7", 'C6_C5_N7', 'C6', 'C5', 'N7'),
    MA<Measure.GSpecific>("C5", "C4", "N9", 'C5_C4_N9', 'C5', 'C4', 'N9'),
    MA<Measure.GSpecific>("C4", "N9", "C8", 'C4_N9_C8', 'C4', 'N9', 'C8'),
    MA<Measure.GSpecific>("N9", "C8", "N7", 'N9_C8_N7', 'N9', 'C8', 'N7'),
    MA<Measure.GSpecific>("C8", "N7", "C5", 'C8_N7_C5', 'C8', 'N7', 'C5'),
    MA<Measure.GSpecific>("N7", "C5", "C4", 'N7_C5_C4', 'N7', 'C5', 'C4'),
    MA<Measure.GSpecific>("O6", "C6", "N1", 'O6_C6_N1', 'O6', 'C6', 'N1'),
    MA<Measure.GSpecific>("O6", "C6", "C5", 'O6_C6_C5', 'O6', 'C6', 'C5'),
    MA<Measure.GSpecific>("N2", "C2", "N1", 'N2_C2_N1', 'N2', 'C2', 'N1'),
    MA<Measure.GSpecific>("N2", "C2", "N3", 'N2_C2_N3', 'N2', 'C2', 'N3'),
];
const BaseAnglesT: MeasuredAngle<Measure.TSpecific>[] = [
    MA<Measure.TSpecific>("O2", "C2", "N1", 'O2_C2_N1', 'O2', 'C2', 'N1'),
    MA<Measure.TSpecific>("O2", "C2", "N3", 'O2_C2_N3', 'O2', 'C2', 'N3'),
    MA<Measure.TSpecific>("O4", "C4", "C5", 'O4_C4_C5', 'O4', 'C4', 'C5'),
    MA<Measure.TSpecific>("O4", "C4", "N3", 'O4_C4_N3', 'O4', 'C4', 'N3'),
    MA<Measure.TSpecific>("C7", "C5", "C4", 'C7_C5_C4', 'C7', 'C5', 'C4'),
    MA<Measure.TSpecific>("C7", "C5", "C6", 'C7_C5_C6', 'C7', 'C5', 'C6'),
];
const BaseAnglesU: MeasuredAngle<Measure.USpecific>[] = [
    MA<Measure.USpecific>("O2", "C2", "N1", 'O2_C2_N1', 'O2', 'C2', 'N1'),
    MA<Measure.USpecific>("O2", "C2", "N3", 'O2_C2_N3', 'O2', 'C2', 'N3'),
    MA<Measure.USpecific>("O4", "C4", "C5", 'O4_C4_C5', 'O4', 'C4', 'C5'),
    MA<Measure.USpecific>("O4", "C4", "N3", 'O4_C4_N3', 'O4', 'C4', 'N3'),
];
// PO4
const PO4Angles: MeasuredAngle<Measure.Measurement>[] = [
    MA<Measure.Measurement>("OP1", "P", "OP2", 'OP1_P_OP2', 'OP1_2', 'P_2', 'OP2_2'),
    MA<Measure.Measurement>("OP1", "P", "O3'", 'OP1_P_O3p', 'OP1_2', 'P_2', 'O3p_1'),
    MA<Measure.Measurement>("OP1", "P", "O5'", 'OP1_P_O5p', 'OP1_2', 'P_2', 'O5p_2'),
    MA<Measure.Measurement>("OP2", "P", "O3'", 'OP2_P_O3p', 'OP2_2', 'P_2', 'O3p_1'),
    MA<Measure.Measurement>("OP2", "P", "O5'", 'OP2_P_O5p', 'OP2_2', 'P_2', 'O5p_2'),
    MA<Measure.Measurement>("O3'", "P", "O5'", 'O3p_P_O5p', 'O3p_1', 'P_2', 'O5p_2'),
    MA<Measure.Measurement>("P", "O3'", "C3'", 'P_O3p_C3p', 'P_2', 'O3p_1', 'C3p_1'),
    MA<Measure.Measurement>("P", "O5'", "C5'", 'P_O5p_C5p', 'P_2', 'O5p_2', 'C5p_2'),
];
// Sugar
const SugarAnglesCommon: MeasuredAngle<Measure.Measurement>[] = [
    MA<Measure.Measurement>("C1'", "C2'", "C3'", 'C1p_C2p_C3p', 'C1p_2', 'C2p_2', 'C3p_2'),
    MA<Measure.Measurement>("C2'", "C3'", "C4'", 'C2p_C3p_C4p', 'C2p_2', 'C3p_2', 'C4p_2'),
    MA<Measure.Measurement>("C3'", "C4'", "O4'", 'C3p_C4p_O4p', 'C3p_2', 'C4p_2', 'O4p_2'),
    MA<Measure.Measurement>("C1'", "O4'", "C4'", 'C1p_O4p_C4p', 'C1p_2', 'O4p_2', 'C4p_2'),
    MA<Measure.Measurement>("C2'", "C1'", "O4'", 'C2p_C1p_O4p', 'C2p_2', 'C1p_2', 'O4p_2'),
    MA<Measure.Measurement>("C2'", "C3'", "O3'", 'C2p_C3p_O3p', 'C2p_2', 'C3p_2', 'O3p_2'),
    MA<Measure.Measurement>("C4'", "C3'", "O3'", 'C4p_C3p_O3p', 'C4p_2', 'C3p_2', 'O3p_2'),
    MA<Measure.Measurement>("C3'", "C4'", "C5'", 'C3p_C4p_C5p', 'C3p_2', 'C4p_2', 'C5p_2'),
    MA<Measure.Measurement>("C5'", "C4'", "O4'", 'C5p_C4p_O4p', 'C5p_2', 'C4p_2', 'O4p_2'),
];
const SugarAnglesOxyribose: MeasuredAngle<Measure.Measurement>[] = [
    MA<Measure.Measurement>("C1'", "C2'", "O2'", 'C1p_C2p_O2p', 'C1p_2', 'C2p_2', 'O2p_2'),
    MA<Measure.Measurement>("C3'", "C2'", "O2'", 'C3p_C2p_O2p', 'C3p_2', 'C2p_2', 'O2p_2'),
];
const SugarAnglesA: MeasuredAngle<Measure.ASpecific>[] = [
    MA<Measure.ASpecific>("N9", "C1'", "O4'", 'N9_C1p_O4p', 'N9', 'C1p_2', 'O4p_2'),
    MA<Measure.ASpecific>("N9", "C1'", "C2'", 'N9_C1p_C2p', 'N9', 'C1p_2', 'C2p_2'),
    MA<Measure.ASpecific>("C4'", "C5'", "O5'", 'C4p_C5p_O5p', 'C4p_2', 'C5p_2', 'O5p_2'),
    MA<Measure.ASpecific>("C1'", "N9", "C4", 'C1p_N9_C4', 'C1p_2', 'N9', 'C4'),
    MA<Measure.ASpecific>("C1'", "N9", "C8", 'C1p_N9_C8', 'C1p_2', 'N9', 'C8')
];
const SugarAnglesC: MeasuredAngle<Measure.CSpecific>[] = [
    MA<Measure.CSpecific>("N1", "C1'", "O4'", 'N1_C1p_O4p', 'N1', 'C1p_2', 'O4p_2'),
    MA<Measure.CSpecific>("N1", "C1'", "C2'", 'N1_C1p_C2p', 'N1', 'C1p_2', 'C2p_2'),
    MA<Measure.CSpecific>("C4'", "C5'", "O5'", 'C4p_C5p_O5p', 'C4p_2', 'C5p_2', 'O5p_2'),
    MA<Measure.CSpecific>("C1'", "N1", "C2", 'C1p_N1_C2', 'C1p_2', 'N1', 'C2'),
    MA<Measure.CSpecific>("C1'", "N1", "C6", 'C1p_N1_C6', 'C1p_2', 'N1', 'C6')
];
const SugarAnglesG: MeasuredAngle<Measure.GSpecific>[] = [
    MA<Measure.GSpecific>("N9", "C1'", "O4'", 'N9_C1p_O4p', 'N9', 'C1p_2', 'O4p_2'),
    MA<Measure.GSpecific>("N9", "C1'", "C2'", 'N9_C1p_C2p', 'N9', 'C1p_2', 'C2p_2'),
    MA<Measure.GSpecific>("C4'", "C5'", "O5'", 'C4p_C5p_O5p', 'C4p_2', 'C5p_2', 'O5p_2'),
    MA<Measure.GSpecific>("C1'", "N9", "C4", 'C1p_N9_C4', 'C1p_2', 'N9', 'C4'),
    MA<Measure.GSpecific>("C1'", "N9", "C8", 'C1p_N9_C8', 'C1p_2', 'N9', 'C8')
];
const SugarAnglesT: MeasuredAngle<Measure.TSpecific>[] = [
    MA<Measure.TSpecific>("N1", "C1'", "O4'", 'N1_C1p_O4p', 'N1', 'C1p_2', 'O4p_2'),
    MA<Measure.TSpecific>("N1", "C1'", "C2'", 'N1_C1p_C2p', 'N1', 'C1p_2', 'C2p_2'),
    MA<Measure.TSpecific>("C4'", "C5'", "O5'", 'C4p_C5p_O5p', 'C4p_2', 'C5p_2', 'O5p_2'),
    MA<Measure.TSpecific>("C1'", "N1", "C2", 'C1p_N1_C2', 'C1p_2', 'N1', 'C2'),
    MA<Measure.TSpecific>("C1'", "N1", "C6", 'C1p_N1_C6', 'C1p_2', 'N1', 'C6')
];
const SugarAnglesU: MeasuredAngle<Measure.USpecific>[] = [
    MA<Measure.USpecific>("N1", "C1'", "O4'", 'N1_C1p_O4p', 'N1', 'C1p_2', 'O4p_2'),
    MA<Measure.USpecific>("N1", "C1'", "C2'", 'N1_C1p_C2p', 'N1', 'C1p_2', 'C2p_2'),
    MA<Measure.USpecific>("C4'", "C5'", "O5'", 'C4p_C5p_O5p', 'C4p_2', 'C5p_2', 'O5p_2'),
    MA<Measure.USpecific>("C1'", "N1", "C2", 'C1p_N1_C2', 'C1p_2', 'N1', 'C2'),
    MA<Measure.USpecific>("C1'", "N1", "C6", 'C1p_N1_C6', 'C1p_2', 'N1', 'C6')
];

export namespace AnglesReport {
    function baseRestraints(m: Measure.Measurement, restrs: MappedAngleRestraints.Bases) {
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
                return restrs.U;
        }
    }

    function PO4Restraints(m: Measure.Measurement, restrs: MappedAngleRestraints.PO4, atom1: string, atom2: string, atom3: string) {
        // NOTE: There is some funky business going on with alpha and zeta torsions
        // Be prepared to swap zeta and alpha around based the particular angle that is being validated

        const zetaConf = m.zetaPrevConf;
        const alphaConf = m.alphaConf;

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

        return restrs.other;
    }

    function sbRestraints(m: Measure.Measurement, restrs: MappedAngleRestraints.SugarBasic) {
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
                return restrs.DT_DC;
        }
    }

    function spRestraints(m: Measure.Measurement, restrsPucker: MappedAngleRestraints.SugarPucker, restrsBasic: MappedAngleRestraints.SugarBasic) {
        if (m.pucker) {
            if (m.pucker === 'C2Endo') {
                if (Common.baseIs(m.stdBase, 'A', 'G'))
                    return restrsPucker.A_G_C2p_endo;

                if (Common.baseIs(m.stdBase, 'U', 'C'))
                    return restrsPucker.U_C_C2p_endo;

                if (Common.baseIs(m.stdBase, 'DA', 'DG'))
                    return restrsPucker.DA_DG_C2p_endo;

                if (Common.baseIs(m.stdBase, 'DT', 'DC'))
                    return restrsPucker.DT_DC_C2p_endo;

            } else if (m.pucker == 'C3Endo') {
                if (Common.baseIs(m.stdBase, 'A', 'G'))
                    return restrsPucker.A_G_C3p_endo;

                if (Common.baseIs(m.stdBase, 'U', 'C'))
                    return restrsPucker.U_C_C3p_endo;

                if (Common.baseIs(m.stdBase, 'DA', 'DG'))
                    return restrsPucker.DA_DG_C3p_endo;

                if (Common.baseIs(m.stdBase, 'DT',  'DC'))
                    return restrsPucker.DT_DC_C3p_endo;
            } else {
                if (Common.baseIs(m.stdBase, 'A', 'G'))
                    return restrsPucker.A_G_other;

                if (Common.baseIs(m.stdBase, 'U', 'C'))
                    return restrsBasic.U_C; // This is intentional

                if (Common.baseIs(m.stdBase, 'DA', 'DG'))
                    return restrsPucker.DA_DG_other;

                if (Common.baseIs(m.stdBase, 'DT', 'DC'))
                    return restrsPucker.DT_DC_other;
            }
        } else {
            if (Common.baseIs(m.stdBase, 'A', 'G'))
                return restrsBasic.A_G;

            if (Common.baseIs(m.stdBase, 'U', 'C'))
                return restrsBasic.U_C;

            if (Common.baseIs(m.stdBase, 'DA', 'DG'))
                return restrsBasic.DA_DG;

            if (Common.baseIs(m.stdBase, 'DT', 'DC'))
                return restrsBasic.DT_DC;
        }

        throw new Error('Cannot figure out which SugarPucker restraint to use');
    }

    function validateAngle(
        report: Report,
        m: Measure.Measurement,
        restrs: MappedAngleRestraints.MRArray,
        n1: string, n2: string, n3: string,
        a1: jsLLKA.LLKAAtom, a2: jsLLKA.LLKAAtom, a3: jsLLKA.LLKAAtom,
        length: number
    ) {
        const r = restrs.find(x => x.atom1_name === n1 && x.atom2_name === n2 && x.atom3_name === n3);
        if (!r) {
            console.warn(`No restraint for bond ${n1} - ${n2} - ${n3}`);
        } else {
            report.push({
                name: r.name,
                atoms: {
                    a: Validation.Atom(a1.label_atom_id, a1.label_comp_id, Common.residueId(a1.auth_seq_id, a1.pdbx_PDB_ins_code), Common.maybeAltId(a1.label_alt_id), a1.label_seq_id),
                    b: Validation.Atom(a2.label_atom_id, a2.label_comp_id, Common.residueId(a2.auth_seq_id, a2.pdbx_PDB_ins_code), Common.maybeAltId(a2.label_alt_id), a2.label_seq_id),
                    c: Validation.Atom(a3.label_atom_id, a3.label_comp_id, Common.residueId(a3.auth_seq_id, a3.pdbx_PDB_ins_code), Common.maybeAltId(a3.label_alt_id), a3.label_seq_id),
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
                chainId: m.chainId,
            });
        }
    }

    function validateAngles<
        Angles extends Array<T>,
        T extends MeasuredAngle<Degrees>,
        Degrees
    >(report: Report, m: Measure.Measurement, restrs: MappedAngleRestraints.MRArray, angles: Angles, degrees: Degrees) {
        for (const a of angles) {
            validateAngle(report, m, restrs, a.name1, a.name2, a.name3, m.aoi[a.atom1] as jsLLKA.LLKAAtom, m.aoi[a.atom2] as jsLLKA.LLKAAtom, m.aoi[a.atom3] as jsLLKA.LLKAAtom, degrees[a.value] as number);
        }
    }

    function validateBondsPO4(report: Report, m: Measure.Measurement, restraints: MappedAngleRestraints.PO4, angles: typeof PO4Angles) {
        for (const a of angles) {
            const lv = m[a.value];
            const restrs = PO4Restraints(m, restraints, a.name1, a.name2, a.name3);

            if (typeof lv === 'number')
                validateAngle(report, m, restrs, a.name1, a.name2, a.name3, m.aoi[a.atom1] as jsLLKA.LLKAAtom, m.aoi[a.atom2] as jsLLKA.LLKAAtom, m.aoi[a.atom3] as jsLLKA.LLKAAtom, lv);
        }
    }

    export type Report = Validation.Report<Validation.AngleAtoms>;


    export function make(measurements: Measure.Measurement[], restraints: MappedAngleRestraints.Groups, enabledValidators: number) {
        const report: Report = [];

        for (const m of measurements) {
            // Base
            if (enabledValidators & Validation.ValidatorBase) {
                const restrs = baseRestraints(m, restraints.bases);
                validateAngles(report, m, restrs, BaseAnglesCommon, m);

                const b = m.base;
                if (Measure.isA(b))
                    validateAngles(report, m, restrs, BaseAnglesA, b);
                else if (Measure.isC(b))
                    validateAngles(report, m, restrs, BaseAnglesC, b);
                else if (Measure.isG(b))
                    validateAngles(report, m, restrs, BaseAnglesG, b);
                else if (Measure.isT(b))
                    validateAngles(report, m, restrs, BaseAnglesT, b);
                else if (Measure.isU(b))
                    validateAngles(report, m, restrs, BaseAnglesU, b);
            }

            // PO4
            if (enabledValidators & Validation.ValidatorPO4)
                validateBondsPO4(report, m, restraints.PO4, PO4Angles)

            // Sugar basic
            if (enabledValidators & Validation.ValidatorSugarBasic) {
                const restrs = sbRestraints(m, restraints.sugarBasic);
                validateAngles(report, m, restrs, SugarAnglesCommon, m);
                if (!m.isDeoxyribose)
                    validateAngles(report, m, restrs, SugarAnglesOxyribose, m);
                const b = m.base;
                if (Measure.isA(b))
                    validateAngles(report, m, restrs, SugarAnglesA, b);
                else if (Measure.isC(b))
                    validateAngles(report, m, restrs, SugarAnglesC, b);
                else if (Measure.isG(b))
                    validateAngles(report, m, restrs, SugarAnglesG, b);
                else if (Measure.isT(b))
                    validateAngles(report, m, restrs, SugarAnglesT, b);
                else if (Measure.isU(b))
                    validateAngles(report, m, restrs, SugarAnglesU, b);
            }

            // Sugar pucker
            if (enabledValidators & Validation.ValidatorSugarPucker) {
                const restrs = spRestraints(m, restraints.sugarPucker, restraints.sugarBasic);
                validateAngles(report, m, restrs, SugarAnglesCommon, m);
                if (!m.isDeoxyribose)
                    validateAngles(report, m, restrs, SugarAnglesOxyribose, m);
                const b = m.base;
                if (Measure.isA(b))
                    validateAngles(report, m, restrs, SugarAnglesA, b);
                else if (Measure.isC(b))
                    validateAngles(report, m, restrs, SugarAnglesC, b);
                else if (Measure.isG(b))
                    validateAngles(report, m, restrs, SugarAnglesG, b);
                else if (Measure.isT(b))
                    validateAngles(report, m, restrs, SugarAnglesT, b);
                else if (Measure.isU(b))
                    validateAngles(report, m, restrs, SugarAnglesU, b);
            }
        }

        return report;
    }
}
