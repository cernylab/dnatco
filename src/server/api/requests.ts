import { checkShape } from '../util';

export namespace Requests {
    export const Rscc = {
        coords: '',
        coordsType: '',
        coeffs: '',
        resolution: void 0 as (number | undefined),
    };
    export type Rscc = typeof Rscc;

    export const Search = {
        NtC: '',
        maxCount: 0,
        redundant: false,
        large: false,
    };
    export type Search = typeof Search;

    export function check<T extends Record<string, unknown>>(req: unknown, template: T, sanity?: (v: T) => boolean): req is T {
        if (!checkShape(req, template, false))
            return false;

        return sanity ? sanity(req) : true;
    }
}
