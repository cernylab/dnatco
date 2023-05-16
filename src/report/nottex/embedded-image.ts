import { NTUnit } from './space';

export type NTEmbeddedImage<T> = {
    width: NTUnit,
    height: NTUnit,
    payload: T,
}
export function NTEmbeddedImage<T>(width: NTUnit, height: NTUnit, payload: T): NTEmbeddedImage<T> {
    return { width, height, payload };
}
