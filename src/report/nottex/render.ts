import { NTEmbeddedImage } from './embedded-image';
import { NTDocument, NTDocumentFonts } from './document';
import * as NTPrims from './primitives';
import { NTPdf } from './pdf';
import * as NTR from './renderables';
import { NTUnit, NTXYWH } from './space';
import { NTcantorEncode, NTerror, NTwarning, NTBlackColor, NTRgba, NTboundingRect } from './util';
import { replaceAll } from '../../util';

type NTBoundary = {
    left: NTUnit,
    right: NTUnit,
    bottom?: NTUnit,
}
namespace NTBoundary {
    export function width(b: NTBoundary) {
        return NTUnit.subtract(b.right, b.left);
    }
}

// Trivial dummy-ish render target to use inside the NTBox rendering loop
class NTBoxRenderTarget<ImgPayload, T> {
    references = new Map<string, NTR.NTRenderables<ImgPayload, T>>();
    renderables: NTR.NTRenderables<ImgPayload, T>[] = [];

    constructor(private readonly _ctx: NTRenderContext<ImgPayload, T>, readonly ref?: string) {
    }

    addRenderable(r: NTR.NTRenderables<ImgPayload, T>, ref?: string) {
        this.renderables.push(r);
        if (ref) {
            if (!this.references.has(ref))
                this.references.set(ref, r);
        }
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
}

type NTTrivialRenderTarget<ImgPayload, Output> = NTRenderContext<ImgPayload, Output> | NTR.NTRenderableGroup<ImgPayload, Output> | NTBoxRenderTarget<ImgPayload, Output>;

function adjustTextRenderablesPosition(
    rends: NTR.NTRenderableRect | NTR.NTRenderableText[],
    xywh: NTXYWH,
    vPos: NTUnit,
    contentHeight: NTUnit,
    vAlign: NTPrims.NTVAlignment,
    lineSpacing: number,
    font: NTPrims.NTFont,
    fonts: NTDocumentFonts,
    tm: NTTextMetricsCalculators,
) {
    const dh = tm.descenderHeight(font, fonts);
    const th = NTPdf.textHeight(fonts[font.family][font.style], font.size);

    if (Array.isArray(rends)) {
        for (const r of rends) {
            r.x = xywh.x;
            r.y = alignVertically(NTUnit.subtract(vPos, dh), th, contentHeight, vAlign);

            vPos = NTUnit.add(vPos, tm.lineHeight(th, lineSpacing));
        }
    } else {
        rends.x = xywh.x;
        rends.y = alignVertically(NTUnit.subtract(vPos, dh), th, contentHeight, vAlign);

        vPos = NTUnit.add(vPos, tm.lineHeight(th, lineSpacing));
    }
}

function alignHorizontally(offset: NTUnit, contentWidth: NTUnit, boundaryWidth: NTUnit, alignment: NTPrims.NTHAlignment): NTUnit {
    const cw = NTUnit.num(contentWidth);
    const bw = NTUnit.num(boundaryWidth);
    const off = NTUnit.num(offset);

    if (alignment === 'left')
        return offset;
    else if (alignment === 'center') {
        return (off + (bw - cw) / 2) as NTUnit;
    } else {
        return (off + (bw - cw)) as NTUnit;
    }
}

function alignVertically(offset: NTUnit, contentHeight: NTUnit, boundaryHeight: NTUnit, alignment: NTPrims.NTVAlignment): NTUnit {
    if (alignment === 'top')
        return offset;
    else if (alignment === 'center') {
        const diff = NTUnit.subtract(boundaryHeight, contentHeight);
        return NTUnit.add(offset, NTUnit.multiply(0.5, diff));
    } else {
        const diff = NTUnit.subtract(boundaryHeight, contentHeight);
        return NTUnit.add(offset, diff);
    }
}

function lineOfText(text: string, props: NTPrims.NTText, lineSpacing: number, vPosition: NTUnit, boundary: NTBoundary, fonts: NTDocumentFonts, tm: NTTextMetricsCalculators) {
    if (boundary.bottom !== undefined && NTUnit.num(vPosition) > NTUnit.num(boundary.bottom))
        return { renderable: void 0, vPosition };

    const { left, width, height } = positionText(text, props, boundary, fonts, tm);
    const r = NTR.NTRenderableText.mk(text, props.font, props.color, { x: left, y: vPosition, width, height });

    return { renderable: r, vPosition: NTUnit.add(vPosition, tm.lineHeight(height, lineSpacing)) };
}

function makeBoundary(box: NTXYWH, boundary: NTBoundary, top: NTUnit): NTBoundary {
    const left = NTUnit.add(box.x, boundary.left);

    const _right = NTUnit.add(left, box.width);
    const right = ((_right as number) > (boundary.right as number)) ? boundary.right : _right;

    let bottom;
    if (boundary.bottom === undefined) {
        bottom = box.height ? NTUnit.add(top, box.height) : void 0;
    } else {
        if (box.height === undefined)
            bottom = boundary.bottom;
        else {
            const _bottom = NTUnit.add(top, box.height);
            bottom = (_bottom as number) > (boundary.bottom as number) ? boundary.bottom : _bottom;
        }
    }

    return { left, right, bottom };
}

function normalizeWhitespaces(s: string) {
    return replaceAll(replaceAll(s, '\t', ' '), '\n', ' ');
}

function positionText(text: string, props: NTPrims.NTText, boundary: NTBoundary, fonts: NTDocumentFonts, tm: NTTextMetricsCalculators) {
    const height = tm.textHeight(props.font, fonts);
    const width = tm.textWidth(text, props.font, fonts);
    const left = alignHorizontally(boundary.left, width, NTBoundary.width(boundary), props.hAlign);
    const right = NTUnit.add(boundary.left, width);

    if (NTUnit.num(right) > NTUnit.num(boundary.right))
        NTwarning(`Text width ${width} spills over boundary`);

    return { left, right, width, height };
}

function spanningRectangles<ImgPayload, T>(
    props: { backgroundColor: NTRgba | 'none', border: NTUnit, borderColor: NTRgba },
    xywh: NTXYWH,
    zIndex: number,
    ctx: NTRenderContext<ImgPayload, T>
) {
    const rects = [];
    if (NTUnit.isZero(ctx.containerHeight)) {
        rects.push(NTR.NTRenderableRect.mk(props.backgroundColor, props.border, props.borderColor, xywh, zIndex));
    } else {
        let y = NTUnit.num(xywh.y);
        const totalHeight = NTUnit.num(xywh.height!);
        const contHeight = NTUnit.num(ctx.containerHeight);

        let remainingHeight = totalHeight;
        while (remainingHeight > 0) {
            const cn = y === 0 ? 1 : Math.ceil(y / contHeight);
            const nextContainerBound = contHeight * cn;
            const stopAtBoundary = y + remainingHeight >= nextContainerBound;
            let nextY = stopAtBoundary ? nextContainerBound - 1 : y + remainingHeight;
            let h = nextY - y;

            const _xywh = {
                x: xywh.x,
                y: y as NTUnit,
                width: xywh.width,
                height: h as NTUnit
            };
            const r = NTR.NTRenderableRect.mk(
                props.backgroundColor, props.border, props.borderColor,
                _xywh,
                zIndex,
                true
            );
            rects.push(r);

            if (stopAtBoundary) {
                // We need to make sure that we stop right ahead of the boundary
                // and begin right after the boundary. We subtract 1 from the boundary position
                // and add 2 to move past it.
                h += 2;
                nextY += 2;
            }

            remainingHeight -= h;
            y = nextY;
        }
    }

    return rects;
}

function stringToChars(s: string) {
    return s.split('');
}

function stringToWords(s: string) {
    return s.split(' '); // TODO: Newlines and tabs
}

function tokensToLines(tokens: string[], delimiter: string, props: NTPrims.NTText, lineSpacing: number, vPosition: NTUnit, boundary: NTBoundary, fonts: NTDocumentFonts, tm: NTTextMetricsCalculators) {
    const maxWidth = NTUnit.num(NTBoundary.width(boundary));

    let vPos = vPosition;
    let line = tokens[0];
    let rends = [];
    for (let idx = 1; idx < tokens.length; idx++) {
        const tok = tokens[idx];
        const provLine = line + (line.length > 0 ? delimiter : '') + tok;
        const provWidth = tm.textWidth(provLine, props.font, fonts);

        if (NTUnit.num(provWidth) >= maxWidth) {
            const ret = lineOfText(line, props, lineSpacing, vPos, boundary, fonts, tm);
            if (ret.renderable)
                rends.push(ret.renderable);
            vPos = ret.vPosition;

            line = tok;
        } else
            line = provLine;
    }
    if (line.length > 0) {
        const ret = lineOfText(line, props, lineSpacing, vPos, boundary, fonts, tm);
        if (ret.renderable)
            rends.push(ret.renderable);
        vPos = ret.vPosition;
    }

    return { renderables: rends, vPosition: vPos }
}

export type NTTextMetricsCalculators = {
    descenderHeight: (font: NTPrims.NTFont, fonts: NTDocumentFonts) => NTUnit,
    lineHeight: (textHeight: NTUnit, spacing: number) => NTUnit,
    textHeight: (font: NTPrims.NTFont, fonts: NTDocumentFonts) => NTUnit,
    textWidth: (text: string, font: NTPrims.NTFont, fonts: NTDocumentFonts) => NTUnit,
}

export class NTRenderContext<ImgPayload, T> {
    renderables: NTR.NTRenderables<ImgPayload, T>[] = [];
    references = new Map<string, NTR.NTRenderables<ImgPayload, T>>();

    constructor(
        readonly ntDoc: NTDocument<T>,
        private readonly textMetrics: NTTextMetricsCalculators,
        readonly images: NTEmbeddedImage<ImgPayload>[] = []
    ) {
    }

    addRenderable(r: NTR.NTRenderables<ImgPayload, T>, ref?: string) {
        this.renderables.push(r);
        if (ref) {
            if (!this.references.has(ref))
                this.references.set(ref, r);
        }
    }

    embeddedImage(tag: number) {
        if (tag < 0 || tag >= this.images.length)
            NTerror(`Image tag "${tag}" is invalid`);

        return this.images[tag];
    }

    getRef(ref: string) {
        return this.references.get(ref)!;
    }

    hasRef(ref: string) {
        return this.references.has(ref);
    }

    get containerHeight() {
        return this.ntDoc.container.height!;
    }

    get ctx() {
        return this;
    }

    get fonts() {
        return this.ntDoc.fonts;
    }

    get tm() {
        return this.textMetrics;
    }
}

export namespace NTRender {
    function box<ImgPayload, T>(bx: NTPrims.NTBox, vPosition: NTUnit, boundary: NTBoundary, parent: NTRenderContext<ImgPayload, T> | NTR.NTRenderableGroup<ImgPayload, T>) {
        const scopeBoundary = makeBoundary(bx.xywh, boundary, vPosition);

        vPosition = NTUnit.add(vPosition, bx.xywh.y);

        // In a NTBox all references are local to the box
        const target = new NTBoxRenderTarget<ImgPayload, T>(parent.ctx);

        for (const p of bx.prims) {
            let vPos = vPosition;
            let floating = false;
            if (p.ref && target.references.has(p.ref)) {
                const refObj = target.references.get(p.ref)!;
                vPos = NTR.NTRenderable.xy(refObj).y;
                floating = true;

                console.log(`Floating with reference ${p.ref}`);
            }

            if (NTPrims.NTLineText.is(p)) {
                vPos = lineText(p, vPos, scopeBoundary, parent.fonts, target);
            } else if (NTPrims.NTParagraphText.is(p)) {
                vPos = paragraphText(p, vPos, scopeBoundary, parent.fonts, target);
            } else if (NTPrims.NTVSpace.is(p)) {
                if (floating)
                    NTwarning('Cannot add vertical space in floating context');
                else
                    vPos = NTUnit.add(vPos, p.height);
            } else if (NTPrims.NTBreakLine.is(p)) {
                if (floating) {
                    // This should never happen but let us be sure
                    NTwarning('Line breaks are not allowed in floating context.');
                    return vPosition;
                }

                const lh = parent.tm.lineHeight(parent.tm.textHeight(p.font, parent.fonts), 1);
                return NTUnit.add(vPos, lh);
            } else if (NTPrims.NTRect.is(p)) {
                const rc = { ...p };
                rc.x = NTUnit.add(rc.x, bx.xywh.x);
                vPos = rect(rc, vPos, target);
            }

            if (!floating)
                vPosition = vPos;
        }

        for (const r of target.renderables)
            parent.addRenderable(r);

        return vPosition;
    }

    function framedLineText<ImgPayload, T>(flt: NTPrims.NTFramedLineText, vPosition: NTUnit, boundary: NTBoundary, fonts: NTDocumentFonts, parent: NTRenderContext<ImgPayload, T>) {
        const tm = parent.tm;
        const tw = tm.textWidth(flt.text, flt.font, fonts);
        const th = tm.textHeight(flt.font, fonts);
        const dh = tm.descenderHeight(flt.font, fonts);

        const twoBorder = NTUnit.multiply(2, flt.border);
        const twoVMargin = NTUnit.multiply(2, flt.vMargin);

        const hMargin = flt.hMargin === 'fill'
            ? NTUnit.multiply(0.5, NTUnit.subtract(NTUnit.subtract(NTBoundary.width(boundary), tw), twoBorder))
            : flt.hMargin;
        const twoHMargin = NTUnit.multiply(2, hMargin);


        const fw = NTUnit.add(NTUnit.add(tw, twoBorder), twoHMargin);
        const fh = NTUnit.add(NTUnit.add(th, twoBorder), twoVMargin);

        const bShift = NTUnit.multiply(0.5, flt.border); // To account for the fact that the border is drawn from the middle out

        const baseX = alignHorizontally(NTUnit.add(boundary.left, bShift), fw, NTUnit.subtract(NTBoundary.width(boundary), flt.border), flt.hAlign);

        const tx = alignHorizontally(baseX, tw, fw, flt.textHAlign);
        const ty = alignVertically(NTUnit.subtract(vPosition , dh), th, fh, 'center');

        const rGroup = NTR.NTRenderableGroup.mk(parent, flt.ref);
        rGroup.addRenderable(NTR.NTRenderableRect.mk(flt.backgroundColor, flt.border, flt.borderColor, { x: baseX, y: vPosition, width: fw, height: fh }, -1));
        rGroup.addRenderable(NTR.NTRenderableText.mk(flt.text, flt.font, flt.color, { x: tx, y: NTUnit.add(ty, bShift), width: tw, height: th }));

        parent.addRenderable(rGroup, flt.ref);

        return NTUnit.add(NTUnit.add(vPosition, fh), flt.border);
    }

    function hyperlink<ImgPayload, T>(h: NTPrims.NTHyperlink, vPosition: NTUnit, boundary: NTBoundary, fonts: NTDocumentFonts, parent: NTRenderContext<ImgPayload, T>) {
        const chars = stringToChars(h.text);
        if (chars.length < 1)
            return vPosition;

        const ret = tokensToLines(chars, '', h, 1, vPosition, boundary, fonts, parent.tm);

        parent.addRenderable(NTR.NTRenderableHyperlink.mk(ret.renderables, h.url));

        return ret.vPosition;
    }

    function image<ImgPayload, T>(im: NTPrims.NTImage, vPosition: NTUnit, boundary: NTBoundary, parent: NTRenderContext<ImgPayload, T> | NTR.NTRenderableGroup<ImgPayload, T>) {
        const tm = parent.tm;
        const img = parent.embeddedImage(im.tag);

        const width = NTUnit.multiply(im.scale, img.width);
        const height = NTUnit.multiply(im.scale, img.height);

        const x = alignHorizontally(boundary.left, width, NTBoundary.width(boundary), im.hAlign);

        const rGroup = NTR.NTRenderableGroup.mk(parent.ctx);

        let finalVPosition = vPosition;
        if (im.caption.length > 0) {
            const ImageFontStyle: NTPrims.NTText = {
                font: {
                    family: 'serif',
                    style: 'normal',
                    size: im.captionFontSize
                },
                color: NTBlackColor,
                hAlign: 'left',
            };

            const lineSkipHeight = tm.lineHeight(tm.textHeight(ImageFontStyle.font, parent.fonts), 1);

            let captionVPos = vPosition;
            let imageVPos = vPosition;
            if (im.captionPosition === 'below') {
                captionVPos = NTUnit.add(
                    NTUnit.add(vPosition, height),
                    tm.descenderHeight(ImageFontStyle.font, parent.fonts)
                );
            }

            const words = stringToWords(im.caption);
            const ret = tokensToLines(words, ' ', ImageFontStyle, 1, captionVPos, boundary, parent.fonts, tm,);

            if (im.captionPosition === 'above') {
                imageVPos = NTUnit.add(vPosition, lineSkipHeight);
                finalVPosition = NTUnit.add(imageVPos, height);
            } else {
                finalVPosition = ret.vPosition;
            }

            const xywh = { x, y: imageVPos, width, height };
            rGroup.addRenderable(NTR.NTRenderableImage.mk(img, im.scale, xywh));
            for (const r of ret.renderables)
                rGroup.addRenderable(r);
        } else {
            const xywh = { x, y: vPosition, width, height };
            rGroup.addRenderable(NTR.NTRenderableImage.mk(img, im.scale, xywh));

            finalVPosition = NTUnit.add(vPosition, height);
        }

        parent.addRenderable(rGroup);

        return finalVPosition;
    }

    function inset<ImgPayload, T>(ins: NTPrims.NTInset, vPosition: NTUnit, boundary: NTBoundary, ctx: NTRenderContext<ImgPayload, T>) {
        const scopeBoundary = makeBoundary(ins.xywh, boundary, vPosition);

        vPosition = NTUnit.add(vPosition, ins.xywh.y);
        const initialVPos = vPosition;

        for (const p of ins.prims)
            vPosition = primitive(p, vPosition, scopeBoundary, ctx);

        if (ins.props.backgroundColor !== 'none' || NTUnit.num(ins.props.border) !== 0) {
            const height = NTUnit.subtract(vPosition, initialVPos);
            const rects = spanningRectangles(
                ins.props,
                { x: ins.xywh.x, y: initialVPos, width: ins.xywh.width, height: height },
                -1,
                ctx
            );
            for (const r of rects)
                ctx.addRenderable(r);
        }

        if (scopeBoundary.bottom && (NTUnit.num(scopeBoundary.bottom) > NTUnit.num(vPosition))) {
            return scopeBoundary.bottom;
        } else
            return vPosition;
    }

    function lineText<ImgPayload, T>(lt: NTPrims.NTLineText, vPosition: NTUnit, boundary: NTBoundary, fonts: NTDocumentFonts, parent: NTTrivialRenderTarget<ImgPayload, T>) {
        const ret = lineOfText(lt.text, lt, 1, vPosition, boundary, fonts, parent.tm);
        if (ret.renderable)
            parent.addRenderable(ret.renderable, lt.ref);

        return ret.vPosition;
    }

    function paragraphText<ImgPayload, T>(pt: NTPrims.NTParagraphText, vPosition: NTUnit, boundary: NTBoundary, fonts: NTDocumentFonts, parent: NTTrivialRenderTarget<ImgPayload, T>) {
        const tm = parent.tm;
        const text = normalizeWhitespaces(pt.text);
        const toks = pt.breakWords ? stringToChars(text) : stringToWords(text);
        if (toks.length < 1)
            return vPosition;

        const ret = tokensToLines(toks, pt.breakWords ? '' : ' ', pt, pt.lineSpacing, vPosition, boundary, fonts, tm);
        for (const r of ret.renderables)
            parent.addRenderable(r);
        vPosition = ret.vPosition;

        // Add one extra blank line after the paragraph
        if (!pt.dontSeparate)
            return NTUnit.add(vPosition, tm.lineHeight(tm.textHeight(pt.font, fonts), pt.lineSpacing));
        else
            return vPosition;
    }

    function primitive<ImgPayload, T>(p: NTPrims.NTPrimitives, vPosition: NTUnit, boundary: NTBoundary, ctx: NTRenderContext<ImgPayload, T>) {
        let vPos = vPosition;
        let floating = false;
        if (p.ref && ctx.hasRef(p.ref)) {
            const refObj = ctx.getRef(p.ref);
            vPos = NTR.NTRenderable.xy(refObj).y;
            floating = true;
        }

        if (NTPrims.NTInset.is(p)) {
            vPos = inset(p, vPos, boundary, ctx);
        } else if (NTPrims.NTFramedLineText.is(p)) {
            vPos = framedLineText(p, vPos, boundary, ctx.fonts, ctx);
        } else if (NTPrims.NTLineText.is(p)) {
            vPos = lineText(p, vPos, boundary, ctx.fonts, ctx);
        } else if (NTPrims.NTParagraphText.is(p)) {
            vPos = paragraphText(p, vPos, boundary, ctx.fonts, ctx);
        } else if (NTPrims.NTHyperlink.is(p)) {
            vPos = hyperlink(p, vPos, boundary, ctx.fonts, ctx);
        } else if (NTPrims.NTTable.is(p)) {
            vPos = table(p, vPos, boundary, ctx);
        } else if (NTPrims.NTVSpace.is(p)) {
            if (floating)
                NTwarning('Cannot add vertical space in floating context');
            else
                vPos = NTUnit.add(vPos, p.height);
        } else if (NTPrims.NTPageBreak.is(p)) {
            if (floating) {
                // This should never happen but let us be sure
                NTwarning('Page breaks are not allowed in floating context.');
                return vPosition;
            }
            if (boundary.bottom) {
                NTwarning('Page breaks are not allowed in boxes with a fixed vertical size.');
                return vPosition;
            }
            if (NTUnit.isZero(ctx.containerHeight))
                return vPosition; // No page breaks on infinite containers

            const ch = NTUnit.num(ctx.containerHeight);
            const vp = NTUnit.num(vPos);
            const advance = Math.ceil(vp / ch) * ch - vp;

            return NTUnit.add(vPos, advance as NTUnit);
        } else if (NTPrims.NTImage.is(p)) {
            vPos = image(p, vPos, boundary, ctx);
        } else if (NTPrims.NTBreakLine.is(p)) {
            if (floating) {
                // This should never happen but let us be sure
                NTwarning('Line breaks are not allowed in floating context.');
                return vPosition;
            }

            const lh = ctx.tm.lineHeight(ctx.tm.textHeight(p.font, ctx.fonts), 1);
            return NTUnit.add(vPos, lh);
        } else if (NTPrims.NTRect.is(p)) {
            vPos = rect(p, vPos, ctx);
        }

        return floating ? vPosition : vPos;
    }

    function rect<ImgPayload, T>(rect: NTPrims.NTRect, vPosition: NTUnit, parent: NTTrivialRenderTarget<ImgPayload, T>) {
        const xywh = { x: rect.x, y: NTUnit.add(rect.y, vPosition), width: rect.width, height: rect.height };
        const r = NTR.NTRenderableRect.mk(rect.color, rect.border, rect.borderColor, xywh);
        parent.addRenderable(r);

        return NTUnit.add(vPosition, rect.y);
    }

    function table<ImgPayload, T>(tbl: NTPrims.NTTable, vPosition: NTUnit, boundary: NTBoundary, parent: NTRenderContext<ImgPayload, T>) {
        if (tbl.rows.length < 1)
            return vPosition;

        const fonts = parent.fonts;
        const tm = parent.tm;

        // Calculate dimensions
        const paragraphCells = new Map<number, NTR.NTRenderableText[]>;
        const hyperlinkCells = new Map<number, NTR.NTRenderableHyperlink>;
        const rowHeights = [];
        const columnWidths = (new Array<NTUnit>(tbl.numColumns)).fill(NTUnit.zero(), 0);
        const twoMargin = NTUnit.multiply(2, tbl.props.margin);
        for (let rowIdx = 0; rowIdx < tbl.rows.length; rowIdx++) {
            const row = tbl.rows[rowIdx];

            let rowHeight = NTUnit.zero();

            if (row.length > tbl.numColumns)
                NTerror(`Number of cells in a row (${row.length}) is greater than the number of columns in the table (${tbl.numColumns})`);

            let actualColIdx = 0;
            for (let colIdx = 0; colIdx < row.length; colIdx++) {
                const cell = row[colIdx];

                if (actualColIdx >= columnWidths.length)
                    NTerror(`Cells span beyond the number of columns in table. Check if 'colSpan' options make sense.'`);

                let w;
                let h;

                const ct = cell.content;
                if (ct.type === 'linetext') {
                    w = tm.textWidth(ct.prim.text, ct.prim.font, fonts);
                    h = tm.textHeight(ct.prim.font, fonts);
                } else if (ct.type === 'image') {
                    if (ct.prim.caption !== '')
                        NTwarning('Captions for images contained in tables are currently unsupported.');

                    const img = parent.embeddedImage(ct.prim.tag);
                    w = NTUnit.multiply(ct.prim.scale, img.width);
                    h = NTUnit.multiply(ct.prim.scale, img.height);

                    // TODO We will eventually want to include the caption dimensions here
                } else if (ct.type === 'paragraphtext') {
                    const text = normalizeWhitespaces(ct.prim.text);

                    const toks = ct.prim.breakWords ? stringToChars(text) : stringToWords(text);
                    if (toks.length < 1) {
                        w = tm.textWidth(' ', tbl.defaultFont, fonts);
                        h = tm.textHeight(tbl.defaultFont, fonts);
                    } else {
                        const scopeBoundary = { ...boundary };
                        scopeBoundary.right = NTUnit.add(boundary.left, ct.maxWidth);
                        const ret = tokensToLines(toks, ct.prim.breakWords ? '' : ' ', ct.prim, ct.prim.lineSpacing, NTUnit.zero(), scopeBoundary, fonts, tm);
                        const bRect = NTboundingRect(ret.renderables);
                        w = bRect.width;
                        h = ret.vPosition; // We are passing zero as the initial vPosition, therefore the returned vPosition is the height

                        const cantorTag = NTcantorEncode(rowIdx, colIdx);
                        paragraphCells.set(cantorTag, ret.renderables);
                    }
                } else if (ct.type === 'rect') {
                    w = ct.prim.width;
                    h = ct.prim.height ?? NTUnit.zero(); // The null case should not happen
                } else if (ct.type === 'box') {
                    w = ct.prim.xywh.width;
                    h = ct.prim.xywh.height!;
                } else {
                    const toks = stringToChars(normalizeWhitespaces(ct.prim.text));

                    if (toks.length < 1) {
                        w = tm.textWidth(' ', tbl.defaultFont, fonts);
                        h = tm.textHeight(tbl.defaultFont, fonts);
                    } else {
                        const scopeBoundary = { ...boundary };
                        scopeBoundary.right = NTUnit.add(boundary.left, NTUnit.from(ct.maxWidth));
                        const ret = tokensToLines(toks, '', ct.prim, 1, NTUnit.zero(), scopeBoundary, fonts, tm);
                        const hyperlink = NTR.NTRenderableHyperlink.mk(ret.renderables, ct.prim.url)
                        const bRect = NTR.NTRenderableHyperlink.boundingRect(hyperlink);
                        w = bRect.width;
                        h = ret.vPosition; // We are passing zero as the initial vPosition, therefore the returned vPosition is the height

                        const cantorTag = NTcantorEncode(rowIdx, colIdx);
                        hyperlinkCells.set(cantorTag, hyperlink);
                    }
                }

                w = NTUnit.add(w, twoMargin);
                h = NTUnit.add(h!, twoMargin);

                if (NTUnit.num(h) > NTUnit.num(rowHeight))
                    rowHeight = h;
                if (cell.colSpan === 1 && NTUnit.num(w) > NTUnit.num(columnWidths[actualColIdx])) {
                    columnWidths[actualColIdx] = w;
                } else if (cell.colSpan > 1) {
                    let blockTotalWidth = columnWidths[actualColIdx];
                    let tailWidth = NTUnit.zero();
                    for (let _idx = actualColIdx + 1; _idx < columnWidths.length && _idx < actualColIdx + cell.colSpan; _idx++) {
                        tailWidth = NTUnit.add(tailWidth, columnWidths[actualColIdx]);
                    }
                    tailWidth = NTUnit.add(
                        NTUnit.multiply(cell.colSpan - 1, tbl.props.border),
                        tailWidth
                    );
                    blockTotalWidth = NTUnit.add(blockTotalWidth, tailWidth);

                    if (NTUnit.num(w) > NTUnit.num(blockTotalWidth)) {
                        columnWidths[actualColIdx] = NTUnit.subtract(w, tailWidth);
                    }
                }

                actualColIdx += cell.colSpan;
            }

            rowHeights.push(rowHeight);
        }
        columnWidths.forEach((v, idx) => {
            if (v === 0)
                NTerror(`Could not calculate width for table column ${idx}. Check table cells options.`);
        });

        const totalTableWidth = NTUnit.add(NTUnit.multiply(tbl.numColumns + 1, tbl.props.border), columnWidths.reduce((p, c) => NTUnit.add(p, c), NTUnit.zero()));
        const baseX = alignHorizontally(boundary.left, totalTableWidth, NTBoundary.width(boundary), tbl.props.hAlign);
        const drawBorders = NTUnit.num(tbl.props.border) > 0;

        let refUsed = false;

        // Render
        for (let rowIdx = 0; rowIdx < tbl.rows.length; rowIdx++) {
            const row = tbl.rows[rowIdx];
            const cellHeight = rowHeights[rowIdx];
            const rowHeight = NTUnit.add(tbl.props.border, cellHeight);
            const contentHeight = NTUnit.subtract(cellHeight, twoMargin);

            const rGroup = NTR.NTRenderableGroup.mk(parent.ctx, !refUsed ? tbl.ref : void 0);
            refUsed = true;

            let x = baseX;
            let colSpanShift = 0;
            for (let colIdx = 0; colIdx < row.length; colIdx++) {
                const cell = row[colIdx];

                // Content vertical position must be shifted down by the thickness of the border and the margin
                const contentVPos = NTUnit.add(tbl.props.margin, NTUnit.add(vPosition, tbl.props.border));
                const cellTotalWidth = columnWidths.slice(colIdx + colSpanShift, colIdx + colSpanShift + cell.colSpan).reduce((p, c) => NTUnit.add(p, c), NTUnit.zero());
                const columnWidth = NTUnit.add(cellTotalWidth, NTUnit.multiply(cell.colSpan, tbl.props.border));
                const xywh = {
                    x: NTUnit.add(tbl.props.margin, NTUnit.add(x, tbl.props.border)),
                    y: contentVPos,
                    width: NTUnit.subtract(NTUnit.subtract(columnWidth, twoMargin), tbl.props.border)
                };
                const scopeBoundary = makeBoundary(xywh, boundary, vPosition);
                const ct = cell.content;

                if (cell.backgroundColor !== 'none') {
                    rGroup.addRenderable(NTR.NTRenderableRect.mk(
                        cell.backgroundColor,
                        NTUnit.zero(),
                        NTBlackColor,
                        {
                            x: NTUnit.add(x, tbl.props.border),
                            y: NTUnit.add(vPosition, tbl.props.border),
                            width: NTUnit.subtract(columnWidth, tbl.props.border),
                            height: cellHeight
                        },
                        -1,
                        false,
                        true
                    ));
                }

                if (ct.type === 'linetext') {
                    const dh = tm.descenderHeight(ct.prim.font, fonts);
                    const th = NTPdf.textHeight(fonts[ct.prim.font.family][ct.prim.font.style], ct.prim.font.size);
                    const vPos = alignVertically(NTUnit.subtract(contentVPos, dh), th, contentHeight, cell.vAlign);

                    lineText(ct.prim, vPos, scopeBoundary, fonts, rGroup);
                } else if (ct.type === 'image') {
                    const im = { ...ct.prim };

                    im.caption = '';
                    image(im, contentVPos, scopeBoundary, rGroup);
                } else if (ct.type === 'paragraphtext') {
                    const cantorTag = NTcantorEncode(rowIdx, colIdx);
                    const rends = paragraphCells.get(cantorTag)!;

                    adjustTextRenderablesPosition(rends, xywh, contentVPos, contentHeight, cell.vAlign, ct.prim.lineSpacing, ct.prim.font, fonts, tm);
                    for (const r of rends)
                        rGroup.addRenderable(r);
                } else if (ct.type === 'rect') {
                    const rc = { ...ct.prim };
                    rc.x = NTUnit.add(rc.x, xywh.x);
                    rect(rc, contentVPos, rGroup);
                } else if (ct.type === 'box') {
                    const bx = ct.prim;
                    bx.xywh.x = NTUnit.add(xywh.x, bx.xywh.x);
                    box(bx, contentVPos, scopeBoundary, rGroup);
                } else if (ct.type === 'hyperlink') {
                    const cantorTag = NTcantorEncode(rowIdx, colIdx);
                    const hyperlink = hyperlinkCells.get(cantorTag)!;

                    adjustTextRenderablesPosition(hyperlink.lines, xywh, contentVPos, contentHeight, cell.vAlign, 1, ct.prim.font, fonts, tm);
                    rGroup.addRenderable(hyperlink);
                }

                if (drawBorders) {
                    const borderWidth = columnWidth;
                    const hBorderWidth = NTUnit.add(columnWidth, tbl.props.border);
                    const vPosBorder = NTUnit.add(vPosition, NTUnit.multiply(0.5, tbl.props.border));
                    const xBorder = NTUnit.add(x, NTUnit.multiply(0.5, tbl.props.border));
                    const xhBorder = x;

                    // Top
                    rGroup.addRenderable(
                        NTR.NTRenderableLine.mk(
                            tbl.props.border,
                            { x: xhBorder, y: vPosBorder, width: hBorderWidth, height: NTUnit.zero() }
                        )
                    );

                    // Left
                    rGroup.addRenderable(
                        NTR.NTRenderableLine.mk(
                            tbl.props.border,
                            { x: xBorder, y: vPosBorder, width: NTUnit.zero(), height: rowHeight }
                        )
                    );

                    // Bottom
                    rGroup.addRenderable(
                        NTR.NTRenderableLine.mk(
                            tbl.props.border,
                            { x: xhBorder, y: NTUnit.add(vPosBorder, rowHeight), width: hBorderWidth, height: NTUnit.zero() }
                        )
                    );

                    // Right
                    rGroup.addRenderable(
                        NTR.NTRenderableLine.mk(
                            tbl.props.border,
                            { x: NTUnit.add(xBorder, borderWidth), y: vPosBorder, width: NTUnit.zero(), height: rowHeight }
                        )
                    );
                }

                colSpanShift += (cell.colSpan - 1);
                x = NTUnit.add(x, columnWidth);
            }

            parent.addRenderable(rGroup);
            vPosition = NTUnit.add(vPosition, rowHeight);
        }

        return NTUnit.add(vPosition, tbl.props.border);
    }

    export function render<ImgPayload, T>(
        textMetrics: NTTextMetricsCalculators,
        images: NTEmbeddedImage<ImgPayload>[],
        root: NTPrims.NTInset,
        doc: NTDocument<T>
    ) {
        const ctx = new NTRenderContext(doc, textMetrics, images);
        const boundary: NTBoundary = {
            left: 0 as NTUnit,
            right: root.xywh.width,
        };

        inset(root, 0 as NTUnit, boundary, ctx);

        return ctx.renderables;
    }
}
