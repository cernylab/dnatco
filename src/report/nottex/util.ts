import { NTUnit, NTXYWH } from './space';

const XName = '\u03BD\u03BF\u03C4TEX';

export const NTBlackColor = NTRgba(0, 0, 0);
export const NTHyperlinkColor = NTRgba(0.278, 0.651, 1);
export const NTWhiteColor = NTRgba(1, 1, 1);

export type NTRgba = {
    r: number,
    g: number,
    b: number,
    a: number,
}
export function NTRgba(r: number, g: number, b: number, a = 1): NTRgba {
    return { r, g, b, a };
}
export function NTboundingRect<T extends number = NTUnit>(areas: NTXYWH<T>[]) {
    let x = Number.MAX_VALUE;
    let y = Number.MAX_VALUE;
    let right = 0;
    let down = 0;

    for (const o of areas) {
        const _x = o.x;
        const _y = o.y;

        const _right = NTXYWH.right(o);
        const _down = NTXYWH.down(o) ?? 0;

        if (_x < x)
            x = _x;
        if (_y < y)
            y = _y;

        if (_right > right)
            right = _right;
        if (_down > down)
            down = _down;
    }

    return {
        x: x as T,
        y: y as T,
        width: (right - x) as T,
        height: (down - y) as T,
    };
}

export function NTcantorDecode(z: number) {
    const w = Math.floor((Math.sqrt(8 * z + 1) - 1) / 2);
    const t = (w * w + w) / 2;

    const y = z - t;
    const x = w - y;

    return { x: x, y: y };
}

export function NTcantorEncode(x: number, y: number) {
    return 0.5 * (x + y) * (x + y + 1) + y;
}

export function NTerror(message: string) {
    console.error(`${XName} Error: ${message}`);
    throw new Error(message);
}

export function NTwarning(message: string) {
    console.warn(`${XName} Warning: ${message}`);
}
