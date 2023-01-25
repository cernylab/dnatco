import { isArr } from '../util/json';
import { WebApi } from '../web-api';
import { Requests } from '../web-api/requests';
import { Serialization } from '../util/serialization';

export namespace Rscc {
    const Item = [ 0, 0 ] as Rscc;
    export type Rscc = [atomId: number, rscc: number];
    export type RsccList = Rscc[];

    function isRscc(v: unknown): v is Rscc {
        if (!Array.isArray(v))
            return false;

        if (v.length !== Item.length)
            return false;

        for (let idx = 0; idx < Item.length; idx++) {
            if (typeof v[idx] !== typeof Item[idx])
                return false;
        }

        return true;
    }

    function isList(v: unknown): v is RsccList {
        return isArr(v, isRscc);
    }

    export async function calculateRemotely(coords: File, coordsType: 'cif' | 'pdb', coeffs: File) {
        const b64coords = await Serialization.toBase64(coords);
        const b64coeffs = await Serialization.toBase64(coeffs);

        const req = Requests.Rscc(b64coords, coordsType, b64coeffs);

        const pending = WebApi.request('api/rscc', req);
        return await WebApi.resolve(pending, isList);
    }

    export async function fetchFromDb(pdbId: string): Promise<RsccList> {
        const req = await fetch(`rscc/${pdbId}.rscc`);
        if (!req.ok)
            throw new Error(req.statusText);

        const rsccList = await req.json();
        if (!isList(rsccList))
            throw new Error('Invalid data');

        return rsccList.sort((a, b) => a[0] - b[0]);
    }
}
