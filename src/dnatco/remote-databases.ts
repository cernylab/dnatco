import { DensityMap } from './density-map';

export type DatabaseResource = {
    url: string|null;
    gzipped: boolean;
}

export type RemoteDatabase = {
    coordinatesResource: (pdbId: string) => DatabaseResource;
    densityMapResource: (pdbId: string) => DatabaseResource;
    densityMapType: DensityMap['type']|null;
}

export type SupportedRemoteDatabases = 'rcsb'|'redo';
export const RemoteDatabases: Record<SupportedRemoteDatabases, RemoteDatabase> = {
    'rcsb': {
        coordinatesResource: (pdbId: string) => ({ url: `https://files.rcsb.org/download/${pdbId.toUpperCase()}.cif.gz`, gzipped: true }),
        densityMapResource: (pdbId: string) => ({ url: `https://edmaps.rcsb.org/maps/${pdbId.toLowerCase()}_2fofc.dsn6`, gzipped: false }),
        densityMapType: 'dsn6',
    },
    'redo': {
        coordinatesResource: (pdbId: string) => {
            const id = pdbId.toLowerCase();
            return { url: `https://pdb-redo.eu/db/${id}/${id}_final.cif`, gzipped: false };
        },
        densityMapResource: () => ({ url: null, gzipped: false }),
        densityMapType: null,
    }
}
