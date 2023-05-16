import { NTEmbeddedImage } from './embedded-image';
import * as NTPrims from './primitives';
import { NTRenderContext } from './render';
import { NTUnit, NTXYWH } from './space';
import { NTboundingRect, NTwarning, NTRgba } from './util';

export namespace NTRenderable {
    export function xy(r: NTRenderables<any, any>): { x: NTUnit, y: NTUnit } {
        if (NTRenderableGroup.is(r)) {
            const bRect = r.boundingRect();
            return { x: bRect.x, y: bRect.y };
        } else if (NTRenderableHyperlink.is(r)) {
            const bRect = NTRenderableHyperlink.boundingRect(r);
            return { x: bRect.x, y: bRect.y };
        } else {
            return { x: r.x, y: r.y };
        }
    }

    export function y(r: NTRenderables<any, any>): NTUnit {
        if (NTRenderableGroup.is(r)) {
            return r.boundingRect().y;
        } else if (NTRenderableHyperlink.is(r)) {
            return NTRenderableHyperlink.boundingRect(r).y;
        } else {
            return r.y;
        }
    }
}

export type NTRenderableObject = {
    zIndex: number,
} & NTXYWH;

export class NTRenderableGroup<ImgPayload, T> {
    readonly type = 'ntrenderablegroup';
    renderables: NTRenderables<ImgPayload, T>[] = [];

    constructor(private readonly _ctx: NTRenderContext<ImgPayload, T>, readonly ref?: string) {
    }

    addRenderable(r: NTRenderables<ImgPayload, T>, ref?: string) {
        this.renderables.push(r);
        if (ref)
            NTwarning(`Primitive with reference "${ref}" is in a group. References inside groups are ignored.`);
    }

    boundingRect(): NTXYWH {
        const xywhs = [];
        for (const obj of this.renderables) {
            if (NTRenderableGroup.is(obj))
                xywhs.push(obj.boundingRect());
            else if (NTRenderableHyperlink.is(obj))
                xywhs.push(NTRenderableHyperlink.boundingRect(obj))
            else
                xywhs.push(obj);
        }

        return NTboundingRect(xywhs);
    }

    embeddedImage(tag: number) {
        return this._ctx.embeddedImage(tag);
    }

    get ctx() {
        return this._ctx;
    }

    get fonts() {
        return this._ctx.fonts;
    }

    get tm() {
        return this._ctx.tm;
    }
};
export namespace NTRenderableGroup {
    export function is(obj: NTRenderables<any, any>): obj is NTRenderableGroup<any, any> {
        return obj.type === 'ntrenderablegroup';
    }

    export function mk<ImgPayload, T>(_ctx: NTRenderContext<ImgPayload, T>, ref?: string) {
        return new NTRenderableGroup(_ctx, ref);
    }
}

export type NTRenderableHyperlink = {
    type: 'ntrenderablehyperlink',
    url: string;
    lines: NTRenderableText[],
    zIndex: number
};
export namespace NTRenderableHyperlink {
    export function boundingRect(h: NTRenderableHyperlink) {
        return NTboundingRect(h.lines);
    }

    export function is(obj: NTRenderables<any, any>): obj is NTRenderableHyperlink {
        return obj.type === 'ntrenderablehyperlink';
    }

    export function mk(lines: NTRenderableText[], url: string, zIndex = 0): NTRenderableHyperlink {
        return {
            type: 'ntrenderablehyperlink',
            lines,
            url,
            zIndex
        };
    }
}

export type NTRenderableImage<ImgPayload> = {
    type: 'ntrenderableimage',
    image: NTEmbeddedImage<ImgPayload>
    scale: number,
} & NTRenderableObject;
export namespace NTRenderableImage {
    export function is<ImgPayload>(obj: NTRenderables<ImgPayload, any>): obj is NTRenderableImage<ImgPayload> {
        return obj.type === 'ntrenderableimage';
    }

    export function mk<ImgPayload>(image: NTEmbeddedImage<ImgPayload>, scale: number, xywh: NTXYWH, zIndex = 0): NTRenderableImage<ImgPayload> {
        return {
            type: 'ntrenderableimage',
            image,
            scale,
            ...xywh,
            zIndex
        };
    }
}

export type NTRenderableLine = {
    type: 'ntrenderableline',
    thickness: NTUnit,
} & NTRenderableObject;
export namespace NTRenderableLine {
    export function is(obj: NTRenderables<any, any>): obj is NTRenderableLine {
        return obj.type === 'ntrenderableline';
    }

    export function mk(thickness: NTUnit, xywh: NTXYWH, zIndex = 0): NTRenderableLine {
        return {
            type: 'ntrenderableline',
            thickness,
            ...xywh,
            zIndex
        };
    }
}

export type NTRenderableRect = {
    type: 'ntrenderablerect',
    border: NTUnit,
    borderColor: NTRgba,
    color: NTRgba | 'none',
    dontAlign: boolean,
    unimportant: boolean,
} & NTRenderableObject;
export namespace NTRenderableRect {
    export function is(obj: NTRenderables<any, any>): obj is NTRenderableRect {
        return obj.type === 'ntrenderablerect';
    }

    export function mk(color: NTRgba | 'none', border: NTUnit, borderColor: NTRgba, xywh: NTXYWH, zIndex = 0, dontAlign = false, unimportant = false): NTRenderableRect {
        return {
            type: 'ntrenderablerect',
            border,
            borderColor,
            color,
            ...xywh,
            zIndex,
            dontAlign,
            unimportant,
        };
    }
}

export type NTRenderableText = {
    type: 'ntrenderabletext',
    color: NTRgba,
    font: NTPrims.NTFont,
    text: string,
} & NTRenderableObject;
export namespace NTRenderableText {
    export function is(obj: NTRenderables<any, any>): obj is NTRenderableText {
        return obj.type === 'ntrenderabletext';
    }

    export function mk(text: string, font: NTPrims.NTFont, color: NTRgba, xywh: NTXYWH, zIndex = 0): NTRenderableText {
        return {
            type: 'ntrenderabletext',
            text,
            font,
            ...xywh,
            color,
            zIndex
        };
    }
}

export type NTRenderables<ImgPayload, T> = NTRenderableGroup<ImgPayload, T> | NTRenderableHyperlink | NTRenderableObjects<ImgPayload>;
export type NTRenderableObjects<ImgPayload> = NTRenderableImage<ImgPayload> | NTRenderableLine | NTRenderableRect | NTRenderableText;
