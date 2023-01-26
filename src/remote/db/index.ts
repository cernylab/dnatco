import { Result } from '../../dnatco';
import { Coordinates } from '../../dnatco/coordinates';
import { DensityMap } from '../../dnatco/density-map';

export type ResourceFetcher<T> = (pdbId: string) => Promise<Result<T>>;

export type RemoteDatabase = {
    name: string;
    coordinates: ResourceFetcher<Coordinates>;
    densityMaps: ResourceFetcher<DensityMap[]>;
}

export const KnownCoordinateFileTypes: Coordinates['type'][] = ['cif', 'pdb'];
export const KnownDensityMapTypes: DensityMap['type'][] = ['ccp4', 'dsn6'];
export const KnownDensityMapKinds: DensityMap['kind'][] = ['2fo-fc', 'fo-fc', 'em'];
