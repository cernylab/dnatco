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
            const type = mapType(file);

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
}
