export namespace Requests {
    export type Rscc = {
        coords: string,
        coordsType: 'cif' | 'pdb',
        coeffs: string,
    };
    export function Rscc(coords: string, coordsType: 'cif' | 'pdb', coeffs: string): Rscc {
        return { coords, coordsType, coeffs };
    }

    export type Search = {
        NtC: string;
        maxCount: number;
        redundant: boolean;
        large: boolean;
    };
    export function Search(NtC: string, maxCount: number, redundant: boolean, large: boolean): Search {
        return { NtC, maxCount, redundant, large };
    }

    export type Request = Requests.Rscc | Requests.Search;
}
