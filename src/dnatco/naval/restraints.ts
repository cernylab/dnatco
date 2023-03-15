import { Csv } from '../../util/csv';

export namespace Restraints {
    const Angle = {
        kind: 'base' as Kind,
        name: '',
        atom1_name: '',
        atom2_name: '',
        atom3_name: '',
        csd_target: 0,
        csd_std: 0,
        pdb_count: 0,
        pdb_mean: 0,
        pdb_std: 0,
        pdb_3low: 0,
        pdb_3high: 0,
        pdb_4low: 0,
        pdb_4high: 0
    };

    const Bond = {
        kind: 'base' as Kind,
        name: '',
        atom1_name: '',
        atom2_name: '',
        csd_target: 0,
        csd_std: 0,
        pdb_count: 0,
        pdb_mean: 0,
        pdb_std: 0,
        pdb_3low: 0,
        pdb_3high: 0,
        pdb_4low: 0,
        pdb_4high: 0
    };

    const Kinds = ['base', 'PO4', 'sugar_basic', 'sugar_pucker'] as const;

    function read<Schema extends (Angle|Bond)>(csvData: string, schema: Schema) {
        const restraints = Csv.read(csvData, ';', '"', schema);
        for (const restr of restraints) {
            if (!Kinds.includes(restr.kind))
                throw new Error(`Unknown restraints kind ${restr.kind}`);
        }

        return restraints;
    }

    export type Angle = typeof Angle;
    export type Bond = typeof Bond;
    export type Kind = (typeof Kinds)[number];

    export function angles(csvData: string) {
        return read(csvData, Angle);
    }

    export function bonds(csvData: string) {
        return read(csvData, Bond);
    }
}

export namespace MappedAngleRestraints {
    export type MRArray = Array<Restraints.Angle>;

    export type Bases = {
        A: MRArray;
        C: MRArray;
        G: MRArray;
        T: MRArray;
        U: MRArray;
    }

    export type PO4 = {
        AA_0: MRArray;
        AA_1: MRArray;
        AA_2: MRArray;
        AA_3: MRArray;
        AS_0: MRArray;
        AS_1: MRArray;
        AS_2: MRArray;
        AS_3: MRArray;
        other: MRArray;
    }

    export type SugarBasic = {
        A_G: MRArray;
        DA_DG: MRArray;
        U_C: MRArray;
        DT_DC: MRArray;
    }

    export type SugarPucker = {
        A_G_C2p_endo: MRArray;
        A_G_C3p_endo: MRArray;
        A_G_other: MRArray;
        U_C_C2p_endo: MRArray;
        U_C_C3p_endo: MRArray;
        DA_DG_C2p_endo: MRArray;
        DA_DG_C3p_endo: MRArray;
        DA_DG_other: MRArray;
        DT_DC_C2p_endo: MRArray;
        DT_DC_C3p_endo: MRArray;
        DT_DC_other: MRArray;
    }

    export type Groups = {
        bases: Bases,
        PO4: PO4,
        sugarBasic: SugarBasic
        sugarPucker: SugarPucker,
    }

    export function map(restraints: Restraints.Angle[]) {
        const groups = {
            bases: {
                A: [],
                C: [],
                G: [],
                T: [],
                U: []
            },
            PO4: {
                AA_0: [],
                AA_1: [],
                AA_2: [],
                AA_3: [],
                AS_0: [],
                AS_1: [],
                AS_2: [],
                AS_3: [],
                other: [],
            },
            sugarBasic: {
                A_G: [],
                DA_DG: [],
                U_C: [],
                DT_DC: [],
            },
            sugarPucker: {
                A_G_C2p_endo: [],
                A_G_C3p_endo: [],
                A_G_other: [],
                U_C_C2p_endo: [],
                U_C_C3p_endo: [],
                DA_DG_C2p_endo: [],
                DA_DG_C3p_endo: [],
                DA_DG_other: [],
                DT_DC_C2p_endo: [],
                DT_DC_C3p_endo: [],
                DT_DC_other: [],
            },
        } as Groups;

        for (const restr of restraints) {
            if (restr.kind === 'base') {
                if (restr.name == 'A/DA')
                    groups.bases.A.push(restr);
                else if (restr.name == 'C/DC')
                    groups.bases.C.push(restr);
                else if (restr.name == 'G/DG')
                    groups.bases.G.push(restr);
                else if (restr.name == 'T/DT')
                    groups.bases.T.push(restr);
                else if (restr.name == 'U/DU')
                    groups.bases.U.push(restr);
                else
                    throw new Error(`Unknown restraint "${restr.name}"`);
            } else if (restr.kind === 'PO4') {
                if (restr.name == 'PO4==AA_0')
                    groups.PO4.AA_0.push(restr);
                else if (restr.name === 'PO4==AA_1')
                    groups.PO4.AA_1.push(restr);
                else if (restr.name === 'PO4==AA_2')
                    groups.PO4.AA_2.push(restr);
                else if (restr.name === 'PO4==AA_3')
                    groups.PO4.AA_3.push(restr);
                else if (restr.name === 'PO4==AS_0')
                    groups.PO4.AS_0.push(restr);
                else if (restr.name === 'PO4==AS_1')
                    groups.PO4.AS_1.push(restr);
                else if (restr.name === 'PO4==AS_2')
                    groups.PO4.AS_2.push(restr);
                else if (restr.name === 'PO4==AS_3')
                    groups.PO4.AS_3.push(restr);
                else if (restr.name === 'other')
                    groups.PO4.other.push(restr);
                else
                    throw new Error(`Unknown restraint "${restr.name}"`);
            } else if (restr.kind === 'sugar_basic') {
                if (restr.name === 'sugar_basic==A_G')
                    groups.sugarBasic.A_G.push(restr);
                else if (restr.name === 'sugar_basic==U_T_C')
                    groups.sugarBasic.U_C.push(restr);
                else if (restr.name === 'sugar_basic==DA_DG')
                    groups.sugarBasic.DA_DG.push(restr);
                else if (restr.name === 'sugar_basic==DU_DT_DC')
                    groups.sugarBasic.DT_DC.push(restr);
                else
                    throw new Error(`Unknown restraint "${restr.name}"`);
            } else if (restr.kind === 'sugar_pucker') {
                if (restr.name === 'pucker==A_G_C2p_endo')
                    groups.sugarPucker.A_G_C2p_endo.push(restr);
                else if (restr.name === 'pucker==A_G_C3p_endo')
                    groups.sugarPucker.A_G_C3p_endo.push(restr);
                else if (restr.name === 'pucker==A_G_other')
                    groups.sugarPucker.A_G_other.push(restr);
                else if (restr.name === 'pucker==U_T_C_C2p_endo')
                    groups.sugarPucker.U_C_C2p_endo.push(restr);
                else if (restr.name === 'pucker==U_T_C_C3p_endo')
                    groups.sugarPucker.U_C_C3p_endo.push(restr);
                else if (restr.name === 'pucker==DA_DG_C2p_endo')
                    groups.sugarPucker.DA_DG_C2p_endo.push(restr);
                else if (restr.name === 'pucker==DA_DG_C3p_endo')
                    groups.sugarPucker.DA_DG_C3p_endo.push(restr);
                else if (restr.name === 'pucker==DA_DG_other')
                    groups.sugarPucker.DA_DG_other.push(restr);
                else if (restr.name === 'pucker==DU_DT_DC_C2p_endo')
                    groups.sugarPucker.DT_DC_C2p_endo.push(restr);
                else if (restr.name === 'pucker==DU_DT_DC_C3p_endo')
                    groups.sugarPucker.DT_DC_C3p_endo.push(restr);
                else if (restr.name === 'pucker==DU_DT_DC_other')
                    groups.sugarPucker.DT_DC_other.push(restr);
                else
                    throw new Error(`Unknown restraint "${restr.name}"`);
            }
        }

        return groups;
    }
}

export namespace MappedBondRestraints {
    export type MRArray = Array<Restraints.Bond>

    export type Bases = {
        A: MRArray;
        C: MRArray;
        G: MRArray;
        T: MRArray;
        U: MRArray;
    }

    export type PO4 = {
        AA_0: MRArray;
        AA_1: MRArray;
        AA_2: MRArray;
        AA_3: MRArray;
        AS_0: MRArray;
        AS_1: MRArray;
        AS_2: MRArray;
        AS_3: MRArray;
        other_A_G: MRArray;
        other_DA_DG: MRArray;
        other_U_C: MRArray;
        other_DT_DC: MRArray;
    };

    export type SugarBasic = {
        A_G: MRArray;
        DA_DG: MRArray;
        U_C: MRArray;
        DT_DC: MRArray;
    }

    export type SugarPucker = {
        A_G_C2p_endo: MRArray;
        A_G_C3p_endo: MRArray;
        A_G_other: MRArray;
        U_C_C2p_endo: MRArray;
        U_C_C3p_endo: MRArray;
        DA_DG_C2p_endo: MRArray;
        DA_DG_C3p_endo: MRArray;
        DA_DG_other: MRArray;
        DT_DC_C2p_endo: MRArray;
        DT_DC_C3p_endo: MRArray;
        DT_DC_other: MRArray;
    }

    export type Groups = {
        bases: Bases,
        PO4: PO4,
        sugarBasic: SugarBasic
        sugarPucker: SugarPucker,
    }

    export function map(restraints: Restraints.Bond[]) {
        const groups = {
            bases: {
                A: [],
                C: [],
                G: [],
                T: [],
                U: []
            },
            PO4: {
                AA_0: [],
                AA_1: [],
                AA_2: [],
                AA_3: [],
                AS_0: [],
                AS_1: [],
                AS_2: [],
                AS_3: [],
                other_A_G: [],
                other_DA_DG: [],
                other_U_C: [],
                other_DT_DC: [],
            },
            sugarBasic: {
                A_G: [],
                DA_DG: [],
                U_C: [],
                DT_DC: [],
            },
            sugarPucker: {
                A_G_C2p_endo: [],
                A_G_C3p_endo: [],
                A_G_other: [],
                U_C_C2p_endo: [],
                U_C_C3p_endo: [],
                DA_DG_C2p_endo: [],
                DA_DG_C3p_endo: [],
                DA_DG_other: [],
                DT_DC_C2p_endo: [],
                DT_DC_C3p_endo: [],
                DT_DC_other: [],
            },
        } as Groups;

        for (const restr of restraints) {
            if (restr.kind === 'base') {
                if (restr.name === 'A/DA')
                    groups.bases.A.push(restr);
                else if (restr.name === 'C/DC')
                    groups.bases.C.push(restr);
                else if (restr.name === 'G/DG')
                    groups.bases.G.push(restr);
                else if (restr.name === 'T/DT')
                    groups.bases.T.push(restr);
                else if (restr.name === 'U/DU')
                    groups.bases.U.push(restr);
                else
                    throw new Error(`Unknown restraint "${restr.name}"`);
            } else if (restr.kind === 'PO4') {
                if (restr.name === 'PO4==AA_0')
                    groups.PO4.AA_0.push(restr);
                else if (restr.name === 'PO4==AA_1')
                    groups.PO4.AA_1.push(restr);
                else if (restr.name === 'PO4==AA_2')
                    groups.PO4.AA_2.push(restr);
                else if (restr.name === 'PO4==AA_3')
                    groups.PO4.AA_3.push(restr);
                else if (restr.name === 'PO4==AS_0')
                    groups.PO4.AS_0.push(restr);
                else if (restr.name === 'PO4==AS_1')
                    groups.PO4.AS_1.push(restr);
                else if (restr.name === 'PO4==AS_2')
                    groups.PO4.AS_2.push(restr);
                else if (restr.name === 'PO4==AS_3')
                    groups.PO4.AS_3.push(restr);
                else if (restr.name === 'other==A_G')
                    groups.PO4.other_A_G.push(restr);
                else if (restr.name === 'other==DA_DG')
                    groups.PO4.other_DA_DG.push(restr);
                else if (restr.name === 'other==U_T_C')
                    groups.PO4.other_U_C.push(restr);
                else if (restr.name === 'other==DU_DT_DC')
                    groups.PO4.other_DT_DC.push(restr);
                else
                    throw new Error(`Unknown restraint "${restr.name}"`);
            } else if (restr.kind === 'sugar_basic') {
                if (restr.name === 'sugar_basic==A_G')
                    groups.sugarBasic.A_G.push(restr);
                else if (restr.name === 'sugar_basic==U_T_C')
                    groups.sugarBasic.U_C.push(restr);
                else if (restr.name === 'sugar_basic==DA_DG')
                    groups.sugarBasic.DA_DG.push(restr);
                else if (restr.name === 'sugar_basic==DU_DT_DC')
                    groups.sugarBasic.DT_DC.push(restr);
                else
                    throw new Error(`Unknown restraint "${restr.name}"`);
            } else if (restr.kind === 'sugar_pucker') {
                if (restr.name === 'pucker==A_G_C2p_endo')
                    groups.sugarPucker.A_G_C2p_endo.push(restr);
                else if (restr.name === 'pucker==A_G_C3p_endo')
                    groups.sugarPucker.A_G_C3p_endo.push(restr);
                else if (restr.name === 'pucker==A_G_other')
                    groups.sugarPucker.A_G_other.push(restr);
                else if (restr.name === 'pucker==U_T_C_C2p_endo')
                    groups.sugarPucker.U_C_C2p_endo.push(restr);
                else if (restr.name === 'pucker==U_T_C_C3p_endo')
                    groups.sugarPucker.U_C_C3p_endo.push(restr);
                else if (restr.name === 'pucker==DA_DG_C2p_endo')
                    groups.sugarPucker.DA_DG_C2p_endo.push(restr);
                else if (restr.name === 'pucker==DA_DG_C3p_endo')
                    groups.sugarPucker.DA_DG_C3p_endo.push(restr);
                else if (restr.name === 'pucker==DA_DG_other')
                    groups.sugarPucker.DA_DG_other.push(restr);
                else if (restr.name === 'pucker==DU_DT_DC_C2p_endo')
                    groups.sugarPucker.DT_DC_C2p_endo.push(restr);
                else if (restr.name === 'pucker==DU_DT_DC_C3p_endo')
                    groups.sugarPucker.DT_DC_C3p_endo.push(restr);
                else if (restr.name === 'pucker==DU_DT_DC_other')
                    groups.sugarPucker.DT_DC_other.push(restr);
                else
                    throw new Error(`Unknown restraint "${restr.name}"`);
            }
        }

        return groups;
    }
}
