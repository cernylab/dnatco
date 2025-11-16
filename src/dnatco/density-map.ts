import { OkResult, ErrorResult, Result } from './';
import { RemoteDatabase } from '../remote/db';
import { fileSuffixes } from '../util';

export const DensityMapKinds = ['fo-fc', '2fo-fc', 'em'] as const;

export type DensityMap = {
    data: Uint8Array,
    type: 'ccp4'|'dsn6'|'ds',
    kind: typeof DensityMapKinds[number],
};

const Dns6Suffixes = ['dsn6'];
const Ccp4Suffixes = ['ccp4', 'map', 'mrc'];

function isDsn6File(data: Uint8Array): boolean {
    // DSN6 files have a 512-byte header with no simple magic bytes
    // Basic sanity check: file should be at least 512 bytes and be a binary format
    if (data.length < 512)
        return false;

    // DSN6 is a very specific format - we rely on extension for now
    // A more robust check would validate the header structure but that's complex
    // and DSN6 is a legacy format primarily identified by extension
    return false; // Content-based detection not implemented for DSN6
}

function isMtzFile(data: Uint8Array): boolean {
    // MTZ files start with 'MTZ ' magic bytes
    if (data.length < 4)
        return false;
    return data[0] === 0x4D && data[1] === 0x54 && data[2] === 0x5A && data[3] === 0x20;
}

function isCcp4MapFile(data: Uint8Array): boolean {
    // CCP4/MRC map files have "MAP " marker at bytes 208-211
    if (data.length < 212)
        return false;

    const mapMarkerOffset = 208;
    return data[mapMarkerOffset] === 0x4D &&
           data[mapMarkerOffset + 1] === 0x41 &&
           data[mapMarkerOffset + 2] === 0x50 &&
           data[mapMarkerOffset + 3] === 0x20;
}

function detectMapTypeFromContent(data: Uint8Array): 'ccp4' | 'dsn6' | null {
    if (isMtzFile(data))
        return null; // MTZ is not a map format, should use coefficients
    if (isCcp4MapFile(data))
        return 'ccp4';
    if (isDsn6File(data))
        return 'dsn6';
    return null;
}

export namespace DensityMap {
    function mapType(file: File) {
        const idx = file.name.lastIndexOf('.');
        if (idx === -1)
            throw new Error('Cannot determine type of density map file');

        const suffix = file.name.substring(idx + 1).toLowerCase();
        if (suffix === 'dsn6')
            return 'dsn6';
        else if (Ccp4Suffixes.includes(suffix))
            return 'ccp4';

        throw new Error('Density map file has unknown type. Only CCP4 and DSN6 maps are currently supported.');
    }

    export async function fromFile(file: File, kind: DensityMap['kind']): Promise<Result<DensityMap[]>> {
        try {
            const buf = await file.arrayBuffer();
            const data = new Uint8Array(buf);

            // Check if this is an MTZ file
            if (isMtzFile(data)) {
                return ErrorResult(`File "${file.name}" is an MTZ file containing structure factors, not a density map. MTZ files should be uploaded with kind="coefficients" (Map coefficients), but this file was uploaded with kind="${kind}". This is likely a bug - please refresh the page and try again.`);
            }

            // Try content-based detection first
            let type = detectMapTypeFromContent(data);

            // Fall back to extension-based detection if content detection fails
            if (!type) {
                type = mapType(file);
            }

            return OkResult([{ data, type, kind }]);
        } catch (e) {
            return ErrorResult(`${e}`);
        }
    }

    export async function fromLink(link: string, type: DensityMap['type'], kind: DensityMap['kind']): Promise<Result<DensityMap[]>> {
        try {
            const req = await fetch(link);
            if (!req.ok)
                return ErrorResult(`Cannot load data: ${req.statusText}`);
            const blob = await req.arrayBuffer();
            return OkResult([{ data: new Uint8Array(blob), type, kind }]);
        } catch (e) {
            return ErrorResult(`Cannot load data: ${e}`);
        }
    }

    export async function fromPdbId(pdbId: string, db: RemoteDatabase): Promise<Result<DensityMap[]>> {
        return db.densityMaps(pdbId);
    }

    export function guessType(file: File): DensityMap['type']|'unknown' {
        // This function is synchronous and can only check file extension
        // For content-based detection, use fromFile() which is async
        const suffixes = fileSuffixes(file.name);
        if (suffixes.length === 0)
            return 'unknown';

        const suff = suffixes[suffixes.length - 1];
        if (Dns6Suffixes.includes(suff))
            return 'dsn6';
        else if (Ccp4Suffixes.includes(suff))
            return 'ccp4';
        else
            return 'unknown';
    }

    export function guessTypeFromData(data: Uint8Array): DensityMap['type']|'unknown' {
        // Content-based detection using binary signatures
        const type = detectMapTypeFromContent(data);
        return type ?? 'unknown';
    }
}
