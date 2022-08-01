import { OkResult, ErrorResult } from './';
import { ungzip } from '../zip/unzip';

const Utf8Decoder = new TextDecoder('utf-8');

export namespace Reader {
    export type SupportedDatabases = 'rcsb' | 'redo';

    async function blobToText(buf: ArrayBuffer, gzipped: boolean) {
        const data = new Uint8Array(buf);
        const ungzipped = gzipped ? await ungzip(data) : data;
        return Utf8Decoder.decode(ungzipped);
    }

    async function fileToText(file: File) {
        if (file.name.endsWith('.gz')) {
            const buf = await file.arrayBuffer();
            return await blobToText(buf, true);
        }
        return await file.text();
    }

    export async function fromFile(coordsFile: File, densityMapFile: File|null) {
        try {
            const text = await fileToText(coordsFile);
            return OkResult(text);
        } catch (e) {
            return ErrorResult(`Cannot read file: ${e}`);
        }
    }

    export async function fromPdbId(pdbId: string, db: SupportedDatabases, localDbUrl: string, localDbGzipped: boolean) {
        const resources = (()  => {
            const resources = new Array<{ url: string, gzipped: boolean }>();

            if (localDbUrl.length > 0) {
                const url = localDbUrl.replace('${db}', db).replace('${pdbId}', pdbId.toLowerCase());
                resources.push({ url, gzipped: true });
            }

            if (db === 'rcsb') {
                resources.push(
                    { url: `https://files.rcsb.org/download/${pdbId.toUpperCase()}.cif.gz`, gzipped: localDbGzipped }
                );
            } else if (db === 'redo') {
                const id = pdbId.toLowerCase();
                resources.push({ url: `https://pdb-redo.eu/db/${id}/${id}_final.cif`, gzipped: false });
            } else
                throw new Error('Unsupported database');

            return resources;
        })();

        for (const res of resources) {
            try {
                const req = await fetch(res.url);
                if (!req.ok) {
                    console.warn(`Data not available at ${res.url}, error ${req.status}`);
                    continue;
                }

                const cif = await blobToText(await req.arrayBuffer(), res.gzipped);
                return OkResult(cif);
            } catch (e) {
                console.warn(`Cannot fetch data from resource ${res.url}: ` + e);
            }
        }

        return ErrorResult(`Cannot load data from any source`);
    }

    export async function fromLink(link: string) {
        // Not really a hack

        try {
            const req = await fetch(link);
            if (!req.ok)
                return ErrorResult(`Cannot load data: ${req.statusText}`);
            const cif = await blobToText(await req.arrayBuffer(), false);
            return OkResult(cif);
        } catch (e) {
            return ErrorResult(`Cannot load data ${e}`);
        }
    }
}
