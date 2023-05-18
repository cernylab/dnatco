import { PDFDocument, PDFImage } from 'pdf-lib';
import { NTDocument, NTDocumentFonts } from './document';
import { NTEmbeddedImage } from './embedded-image';
import { NTPdf } from './pdf';
import * as NTPrims from './primitives';
import { NTRender, NTTextMetricsCalculators } from './render';
import * as NTR from './renderables';
import { NTMetric, NTWH, NTXYWH, NTUnit } from './space';
import { NTboundingRect, NTerror } from './util';
import { Fonts } from '../fonts';

function area(xywh: NTXYWH<number>): [x: number, y: number, w: number, h: number] {
    return [
        xywh.x,
        xywh.y,
        xywh.width,
        xywh.height!
    ];
}

async function embedOneImage(image: NTPrims.NTImage, pdfDoc: PDFDocument, images: NTEmbeddedImage<PDFImage>[]) {
    let img;
    if (image.format === 'jpg')
        img = await pdfDoc.embedJpg(image.blob);
    else
        img = await pdfDoc.embedPng(image.blob);

    image.tag = images.length;
    images.push(
        NTEmbeddedImage(
            NTUnit.from(NTPdf.pdmToMm(img.width)),
            NTUnit.from(NTPdf.pdmToMm(img.height)),
            img
        )
    );
}

async function embedAllImages(prims: NTPrims.NTPrimitives[], pdfDoc: PDFDocument, images: NTEmbeddedImage<PDFImage>[] = []) {
    for (const item of prims) {
        if (NTPrims.NTImage.is(item)) {
            await embedOneImage(item, pdfDoc, images);
        } else if (NTPrims.NTInset.is(item)) {
            await embedAllImages(item.prims, pdfDoc, images);
        } else if (NTPrims.NTTable.is(item)) {
            for (const row of item.rows) {
                for (const cell of row) {
                    if (cell.content.type === 'image')
                        await embedOneImage(cell.content.prim, pdfDoc, images);
                }
            }
        }
    }

    return images;
}

function flattenRenderables(renderables: NTR.NTRenderables<PDFImage, Uint8Array>[]) {
    const flattened: (NTR.NTRenderableObjects<PDFImage> | NTR.NTRenderableHyperlink)[] = [];

    for (const r of renderables) {
        if (NTR.NTRenderableGroup.is(r)) {
            flattened.push(...flattenRenderables(r.renderables));
        } else
            flattened.push(r);
    }

    return flattened;
}

function descenderHeight(font: NTPrims.NTFont, fonts: NTDocumentFonts) {
    return NTPdf.descenderHeight(fonts[font.family][font.style], font.size);
}

function lineHeight(textHeight: NTUnit, spacing: number): NTUnit {
    return NTUnit.multiply(spacing * 1.5, textHeight);
}

function textHeight(font: NTPrims.NTFont, fonts: NTDocumentFonts) {
    return NTPdf.textHeight(fonts[font.family][font.style], font.size);
}

function textWidth(text: string, font: NTPrims.NTFont, fonts: NTDocumentFonts) {
    return NTPdf.textWidth(text, fonts[font.family][font.style], font.size);
}

const TextMetrics: NTTextMetricsCalculators = {
    descenderHeight,
    lineHeight,
    textHeight,
    textWidth
}

const FontHeightCorrectionFactor = 1.000;

export class NTPdfDocument extends NTDocument<Uint8Array> {
    constructor(
        private readonly pdfDoc: PDFDocument,
        container: NTXYWH,
        private readonly pageSize: NTWH,
        defaultFont: NTPrims.NTFont,
        fonts: NTDocumentFonts,
    ) {
        super(container, defaultFont, fonts);
    }

    private containerIndex(r: NTR.NTRenderables<PDFImage, Uint8Array>) {
        const ch = NTUnit.num(this.container.height!);

        let ry;
        if (NTR.NTRenderableGroup.is(r)) {
            const bRect = r.boundingRect();
            ry = NTUnit.num(NTXYWH.down(bRect)!);
        } else if (NTR.NTRenderableText.is(r)) {
            ry = NTUnit.num(NTUnit.multiply(FontHeightCorrectionFactor, NTXYWH.down(r)!));
        } else if (NTR.NTRenderableHyperlink.is(r)) {
            const bRect = NTR.NTRenderableHyperlink.boundingRect(r);
            ry = NTUnit.num(NTXYWH.down(bRect)!);
        } else {
            ry = NTUnit.num(NTXYWH.down(r)!);
        }

        return Math.floor(ry / ch);
    }

    static async create(
        margins: {
            left: NTMetric,
            top: NTMetric,
            right: NTMetric,
            bottom: NTMetric,
        },
        pageSize: { width: NTMetric, height: NTMetric },
        fonts: Fonts,
        defaultFont?: NTPrims.NTFont
    ) {
        const pdfDoc = await PDFDocument.create();

        const cw = NTUnit.subtract(
            NTUnit.from(pageSize.width),
            NTUnit.add(
                NTUnit.from(margins.right), NTUnit.from(margins.left)
            )
        );
        const ch = NTUnit.subtract(
            NTUnit.from(pageSize.height),
            NTUnit.add(
                NTUnit.from(margins.top), NTUnit.from(margins.bottom)
            )
        );
        if (NTUnit.num(cw) < 0) {
            NTerror('Container width is negative, check page size and margins.');
        }
        if (NTUnit.num(ch) < 0) {
            NTerror('Container height is negative, check page size and margins.');
        }

        const embeddedFonts = await Fonts.embedToPdfDoc(pdfDoc, fonts);

        return new NTPdfDocument(
            pdfDoc,
            { x: NTUnit.from(margins.left), y: NTUnit.from(margins.right), width: cw, height: ch },
            { width: NTUnit.from(pageSize.width), height: NTUnit.from(pageSize.height) },
            { family: 'serif', size: 12, style: 'normal', ...defaultFont },
            embeddedFonts
        );
    }

    async render() {
        // Image embedding is async (because of course it is)
        // We need to embed all images beforehand to avoid the async/await disaster in the rendering loop
        const images = await embedAllImages(this.root.prims, this.pdfDoc);

        const renderables = NTRender.render(TextMetrics, images, NTUnit.zero(), this.root, this);

        const pw = NTPdf.ntUnitToPdm(this.pageSize.width);
        const ph = NTPdf.ntUnitToPdm(this.pageSize.height);
        const ps = [pw, ph] as [number, number];

        const leftMargin = NTPdf.ntUnitToPdm(this.container.x);
        const topMargin = NTPdf.ntUnitToPdm(this.container.y);

        // Divide up the renderables by the container first
        const renderablesByContainer = new Array<NTR.NTRenderables<PDFImage, Uint8Array>[]>;
        for (const r of renderables) {
            const cIdx = this.containerIndex(r);
            while (renderablesByContainer.length < cIdx + 1)
                renderablesByContainer.push([]);
            renderablesByContainer[cIdx].push(r);
        }

        // Sort the renderables in the container by their vertical position
        // We need that to be able to start to draw renderables from the top of the container
        for (const rends of renderablesByContainer) {
            rends.sort((a, b) => {
                const aY = NTR.NTRenderable.y(a);
                const bY = NTR.NTRenderable.y(b);

                return NTUnit.subtract(aY, bY);
            });
        }

        // Render everything
        for (let cIdx = 0; cIdx < renderablesByContainer.length; cIdx++) {
            const rends = renderablesByContainer[cIdx];
            if (rends.length < 1)
                continue;

            const page = this.pdfDoc.addPage(ps);
            const contOff = NTPdf.ntUnitToPdm(NTUnit.multiply(cIdx, this.container.height!));

            // Position of the first renderable in this container might not be a multiple of the container height (and in most cases it won't be)
            // Make sure that we add the appropriate alignment to always start at the top of the container
            const topmostY = NTPdf.ntUnitToPdm(NTR.NTRenderable.y(rends[0]));
            const alignmentOffset = topmostY - contOff;

            // Now that we know how to align renderables to the top of the container,
            // flatten renderable groups into a single array of objects
            // and resort then by z-index to get correct overdraw.
            const flatRends = flattenRenderables(rends);
            flatRends.sort((a, b) => a.zIndex - b.zIndex);


            const links: { url: string, area: [x: number, y: number, w: number, h: number] }[] = [];
            for (const r of flatRends) {
                if (NTR.NTRenderableHyperlink.is(r)) {
                    const areas: NTXYWH<number>[] = [];
                    for (const line of r.lines) {
                        const w = NTPdf.ntUnitToPdm(line.width);
                        const h = NTPdf.ntUnitToPdm(line.height ?? NTUnit.zero());
                        const x = NTPdf.ntUnitToPdm(line.x) + leftMargin;
                        const y = ph - (NTPdf.ntUnitToPdm(line.y) - contOff - alignmentOffset) - h - topMargin;

                        page.drawText(line.text, {
                            x,
                            y,
                            font: this.fonts[line.font.family][line.font.style],
                            size: line.font.size,
                            color: NTPdf.rgb(line.color),
                        });

                        areas.push({ x, y, width: w, height: h });
                    }
                    links.push({ url: r.url, area: area(NTboundingRect(areas)) });
                } else {
                    const w = NTPdf.ntUnitToPdm(r.width);
                    const h = NTPdf.ntUnitToPdm(r.height ?? NTUnit.zero());
                    const x = NTPdf.ntUnitToPdm(r.x) + leftMargin;
                    const y = ph - (NTPdf.ntUnitToPdm(r.y) - contOff - alignmentOffset) - h - topMargin;

                    if (NTR.NTRenderableLine.is(r)) {
                        page.drawLine({
                            start: { x, y },
                            end: { x: x + w, y: y + h },
                            thickness: NTPdf.ntUnitToPdm(r.thickness),
                        });
                    } else if (NTR.NTRenderableRect.is(r)) {
                        const borderWidth = NTPdf.ntUnitToPdm(r.border);

                        // Some rectangles might be positioned specifically into the container
                        // by the renderer and the autoalignment to the top of the container would
                        // screw this up. Remove the alignment if the "dontAlign" flag is set.
                        page.drawRectangle({
                            x,
                            y: y - (borderWidth / 2) - (r.dontAlign ? alignmentOffset : 0),
                            width: w,
                            height: h,
                            borderWidth,
                            borderColor: NTPdf.rgb(r.borderColor),
                            borderOpacity: r.borderColor.a,
                            color: r.color !== 'none' ? NTPdf.rgb(r.color) : void 0,
                            opacity: r.color !== 'none' ? r.color.a : void 0,
                        });
                    } else if (NTR.NTRenderableText.is(r)) {
                        page.drawText(r.text, {
                            x,
                            y,
                            font: this.fonts[r.font.family][r.font.style],
                            size: r.font.size,
                            color: NTPdf.rgb(r.color),
                        });
                    } else if (NTR.NTRenderableImage.is(r)) {
                        page.drawImage(
                            r.image.payload,
                            {
                                x,
                                y,
                                width: w,
                                height: h
                            }
                        )
                    }
                }
            }

            if (links.length > 0)
                NTPdf.makeHyperlinks(this.pdfDoc, page, links);
        }

        return await this.pdfDoc.save();
    }
}
