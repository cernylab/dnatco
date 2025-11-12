export namespace Requests {
    export type Rscc = {
        coords: string,
        coordsType: 'cif' | 'pdb',
        coeffs: string,
        mapKind: string,
        resolution: number,
    };
    export function Rscc(coords: string, coordsType: 'cif' | 'pdb', coeffs: string, mapKind: string, resolution: number): Rscc {
        return { coords, coordsType, coeffs, mapKind, resolution };
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
