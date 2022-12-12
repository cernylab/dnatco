/* * * * * * * * * * * * * * * * * * * * *
 *                                       *
 * THIS CODE WILL BE REPLACED WITH CODE  *
 * THAT WILL CALCULATE RSCC DIRECTLY     *
 * FROM THE STRUCTURE AND DENSITY MAP.   *
 *                                       *
 * THIS IS JUST A LAME STOPGAP MEASURE.  *
 *                                       *
 * * * * * * * * * * * * * * * * * * * * */

import { ErrorResult, OkResult, Result } from './';
import { isArr, isNum } from '../util/json';

const RsccCache = new Map<string, number[]>();

function isRscc(v: any): v is number[] {
    return isArr(v, isNum);
}

export namespace Rscc {
    export async function structureRscc(pdbId: string): Promise<Result<number[]>> {
        pdbId = pdbId.toLowerCase();

        const cached = RsccCache.get(pdbId);
        if (cached)
            return OkResult(cached);

        try {
            const req = await fetch(`./rscc/${pdbId}.rscc`);
            if (!req.ok)
                return ErrorResult(req.statusText);

            const json = await req.json();
            if (!isRscc(json))
                return ErrorResult('Invalid data');

            RsccCache.set(pdbId, json);

            return OkResult(json);
        } catch (e) {
            return ErrorResult((e as Error).toString());
        }
    }
}
