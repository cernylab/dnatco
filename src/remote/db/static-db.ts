import { RemoteDatabase } from './';
import { ErrorResult, OkResult } from '../../dnatco';
import { Coordinates } from '../../dnatco/coordinates';
import { DensityMap } from '../../dnatco/density-map';
import { replaceAll, Utf8Decoder } from '../../util';
import { ungzip } from '../../zip/unzip';

function transformId(id: string, transformation?: IdTransformations) {
    if (transformation === 'lower-case')
        return id.toLowerCase();
    else if (transformation === 'upper-case')
        return id.toUpperCase();
    return id;
}

export const IdTransformations = ['lower-case', 'upper-case'] as const;
export type IdTransformations = typeof IdTransformations[number];

export type StaticDb = {
    id: string;
    name: string,
    coords: { link: string, type: Coordinates['type'], gzipped: boolean, idTransformation?: IdTransformations },
    densityMaps?: { link: string, type: DensityMap['type'], kind: DensityMap['kind'], idTransformation?: IdTransformations }[],
}

export function StaticDb(
    name: string,
    coords: StaticDb['coords'],
    densityMaps?: StaticDb['densityMaps'],
): RemoteDatabase {
    return {
        name,
        coordinates: async (pdbId) => {
            const id = transformId(pdbId, coords.idTransformation);
            const req = await fetch(replaceAll(coords.link, '${pdbId}', id));
            if (!req.ok)
                return ErrorResult(`Invalid database response: ${req.statusText}`);

            try {
                if (coords.gzipped) {
                    const data = new Uint8Array(await req.arrayBuffer());
                    const ungzipped = await ungzip(data);
                    return OkResult({ data: Utf8Decoder.decode(ungzipped), type: coords.type });
                } else
                    return OkResult({data: await req.text(), type: coords.type });
            } catch (e) {
                return ErrorResult(`Invalid database reponse: ${e}`);
            }
        },
        densityMaps: async (id) => {
            if (!densityMaps)
                return ErrorResult('Database does not provide density maps');

            const maps = new Array<DensityMap>();
            for (const dm of densityMaps) {
                const _id = transformId(id, dm.idTransformation)
                const req = await fetch(replaceAll(dm.link, '${id}', _id));
                if (!req.ok)
                    console.warn(`Failed to download density map: ${req.statusText}`);
                else {
                    try {
                        const data = new Uint8Array(await req.arrayBuffer());
                        maps.push({ data, type: dm.type, kind: dm.kind });
                    } catch (e) {
                        console.warn(`Invalid database reponse: ${e}`);
                    }
                }
            }

            if (maps.length === 0)
                return ErrorResult('No density maps are available for the structure');
            return OkResult(maps);
        }
    };
}
