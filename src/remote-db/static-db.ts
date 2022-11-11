import { RemoteDatabase } from './';
import { ErrorResult, OkResult } from '../dnatco';
import { Coordinates } from '../dnatco/coordinates';
import { DensityMap } from '../dnatco/density-map';
import { replaceAll } from '../util';
import { ungzip } from '../zip/unzip';

const Utf8Decoder = new TextDecoder('utf-8');

export function StaticDb(name: string, coords: { link: string, type: Coordinates['type'], gzipped: boolean }, densityMap?: { link: string, type: DensityMap['type'] }): RemoteDatabase {
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
        densityMap: async (id) => {
            if (!densityMap)
                return ErrorResult('Database does not provide density maps');

            const req = await fetch(replaceAll(densityMap.link, '${id}', id));
            if (!req.ok)
                return ErrorResult('Failed to download density map');

            try {
                return OkResult({ data: new Uint8Array(await req.arrayBuffer()), type: densityMap.type });
            } catch (e) {
                return ErrorResult(`Invalid database reponse: ${e}`);
            }
        }
    };
}
