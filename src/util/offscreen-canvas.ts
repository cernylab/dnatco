import { EnvDetect } from './env-detect';

export namespace UOffscreenCanvas {
    export function make(width: number, height: number) {
        if (EnvDetect.isNode()) {
            const { createCanvas } = require('canvas');
            return createCanvas(width, height);
        } else
            return new OffscreenCanvas(width, height);
    }

    export async function toBuffer(canvas: OffscreenCanvas) {
        if (EnvDetect.isNode()) {
            // @ts-ignore
            return canvas.toBuffer('image/png');
        } else {
            // @ts-ignore
            const blob = await canvas.convertToBlob();
            return await (blob as Blob).arrayBuffer();
        }
    }
}
