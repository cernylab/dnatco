import { OkResult, ErrorResult } from './';
import { RemoteDatabase } from '../remote-db';
import { Utf8Decoder } from '../util';
import { ungzip } from '../zip/unzip';


export type Coordinates = {
    data: string;
    type: 'cif'|'pdb';
}

export namespace Coordinates {
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

    export async function fromFile(file: File, type: Coordinates['type']) {
        try {
            const text = await fileToText(file);
            return OkResult({ data: text, type });
        } catch (e) {
            return ErrorResult(`Cannot read file: ${e}`);
        }
    }

    export async function fromPdbId(pdbId: string, db: RemoteDatabase) {
        return await db.coordinates(pdbId);
    }

    export async function fromLink(link: string, type: Coordinates['type']) {
        // Not really a hack

        try {
            const req = await fetch(link);
            if (!req.ok)
                return ErrorResult(`Cannot load data: ${req.statusText}`);
            const cif = await blobToText(await req.arrayBuffer(), false);
            return OkResult({ data: cif, type });
        } catch (e) {
            return ErrorResult(`Cannot load data ${e}`);
        }
    }
}
