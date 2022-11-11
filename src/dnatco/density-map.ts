import { OkResult, ErrorResult, Result } from './';
import { RemoteDatabases, SupportedRemoteDatabases } from '../remote-db/register';

export type DensityMap = {
    data: Uint8Array,
    type: 'ccp4'|'dsn6'|'ds',
};

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

    export async function fromFile(file: File): Promise<Result<DensityMap>> {
        try {
            const buf = await file.arrayBuffer();
            const data = new Uint8Array(buf);
            const type = mapType(file);

            return OkResult({ data, type });
        } catch (e) {
            return ErrorResult(`${e}`);
        }
    }

    export async function fromLink(link: string, type: DensityMap['type']): Promise<Result<DensityMap>> {
        try {
            const req = await fetch(link);
            if (!req.ok)
                return ErrorResult(`Cannot load data: ${req.statusText}`);
            const blob = await req.arrayBuffer();
            return OkResult({ data: new Uint8Array(blob), type });
        } catch (e) {
            return ErrorResult(`Cannot load data: ${e}`);
        }
    }

    export async function fromPdbId(pdbId: string, db: SupportedRemoteDatabases): Promise<Result<DensityMap>> {
        const _db = RemoteDatabases[db];
        return _db.densityMap(pdbId);
    }
}
