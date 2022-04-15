import { OkResult, ErrorResult } from './';
import { ungzip } from '../zip/unzip';

const Utf8Decoder = new TextDecoder('utf-8');

export namespace Engine {
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

    export async function dnatcoifyCustom(coordsFile: File, densityMapFile: File|null) {
        // HACK

        try {
            const text = await fileToText(coordsFile);
            return OkResult(text);
        } catch (e) {
            return ErrorResult(`Cannot read file: ${e}`);
        }
    }

    export async function dnatcoifyPdbId(pdbId: string) {
        // HACK

        try {
            const req = await fetch(`https://dnatco.datmos.org/v4.1/RCSB/cif_dnatco_updated/${pdbId}_v41C35A23.cif.gz`);
            const cif = await blobToText(await req.arrayBuffer(), true);
            return OkResult(cif);
        } catch (e) {
            return ErrorResult(`Cannot load data ${e}`);
        }
    }

    export async function dnatcoifyLink(link: string) {
        // Not really a hack

        try {
            const req = await fetch(link);

            const cif = await blobToText(await req.arrayBuffer(), false);
            return OkResult(cif);
        } catch (e) {
            return ErrorResult(`Cannot load data ${e}`);
        }
    }
}
