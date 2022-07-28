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

    export async function fromPdbId(pdbId: string, db: SupportedDatabases) {
        const [ url, gzipped ] = (() => {
            if (db === 'rcsb')
                return [ `https://files.rcsb.org/download/${pdbId.toUpperCase()}.cif.gz`, true ];
            else if (db === 'redo') {
                const id = pdbId.toLowerCase();
                return [ `https://pdb-redo.eu/db/${id}/${id}_final.cif`, false ];
            } else
                throw new Error('Unsupported database');
        })();

        try {
            const req = await fetch(url);
            if (!req.ok)
                return ErrorResult(`Cannot load data: ${req.statusText}`);
            const cif = await blobToText(await req.arrayBuffer(), gzipped);
            return OkResult(cif);
        } catch (e) {
            return ErrorResult(`Cannot load data ${e}`);
        }
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
