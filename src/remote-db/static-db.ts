import { RemoteDatabase } from './';
import { ErrorResult, OkResult } from '../dnatco';
import { Coordinates } from '../dnatco/coordinates';
import { DensityMap } from '../dnatco/density-map';
import { replaceAll } from '../util';
import { ungzip } from '../zip/unzip';

const Utf8Decoder = new TextDecoder('utf-8');

export function StaticDb(
    name: string,
    coords: { link: string, type: Coordinates['type'], gzipped: boolean },
    densityMaps?: { link: string, type: DensityMap['type'], kind: DensityMap['kind'] }[]
): RemoteDatabase {
    return {
        name,
        coordinates: async (pdbId) => {
            const req = await fetch(replaceAll(coords.link, '${pdbId}', pdbId));
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
                const req = await fetch(replaceAll(dm.link, '${id}', id));
                if (!req.ok)
                    console.warn(`Failed to download density map: ${req.statusText}`);

                try {
                    const data = new Uint8Array(await req.arrayBuffer());
                    maps.push({ data, type: dm.type, kind: dm.kind });
                } catch (e) {
                    console.warn(`Invalid database reponse: ${e}`);
                }
            }

            if (maps.length === 0)
                return ErrorResult('No density maps are available for the structure');
            return OkResult(maps);
        }
    };
}
