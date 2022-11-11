import { Result } from '../dnatco';
import { Coordinates } from '../dnatco/coordinates';
import { DensityMap } from '../dnatco/density-map';

export type ResourceFetcher<T> = (pdbId: string) => Promise<Result<T>>;

export type RemoteDatabase = {
    name: string;
    coordinates: ResourceFetcher<Coordinates>;
    densityMap: ResourceFetcher<DensityMap>;
}
