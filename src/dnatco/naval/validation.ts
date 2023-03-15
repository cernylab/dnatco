export namespace Validation {
    export const ValidatorBase = 1 << 0;
    export const ValidatorPO4 = 1 << 1;
    export const ValidatorSugarBasic = 1 << 2;
    export const ValidatorSugarPucker = 1 << 3;

    export type Atom = {
        name: string,
        res_name: string,
        resid: string,
        altloc: string,
    }
    export function Atom(name: string, res_name: string, resid: string, altloc: string): Atom {
        return { name, res_name, resid, altloc };
    }

    export type AngleAtoms = {
        a: Atom
        b: Atom,
        c: Atom,
    }

    export type BondAtoms = {
        a: Atom,
        b: Atom,
    }

    export type ReportItem<Atoms> = {
        name: string,
        atoms: Atoms,
        calculated_value: number,
        target_value: number,
        target_sigma: number,
        pdb_allowed_left: number,
        pdb_allowed_right: number,
        pdb_suspicious_left: number,
        pdb_suspicious_right: number,
        pdbcode: string,
        modelNum: number,
        chain: string,
    }

    export type Report<Atoms> = ReportItem<Atoms>[];
}
