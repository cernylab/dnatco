import { rgb as pdfRgb, PDFDocument, PDFFont, PDFName, PDFPage, PDFString } from 'pdf-lib';
import { NTCm, NTMm, NTUnit } from './space';
import { NTRgba } from './util';

export const PDFUnit = 2.834645669291339;
const PDFUnitToMmRatio = 1.0 / PDFUnit; // Internal PDF unit to millimeter ratio

const HyperlinksNode = PDFName.of('Annots');

export namespace NTPdf {
    export function descenderHeight(font: PDFFont, size: number) {
        const wd = font.heightAtSize(size, { descender: true });
        const wod = font.heightAtSize(size, { descender: false });

        return NTUnit.create(pdmToMm(wd - wod));
    }

    export function makeHyperlinks(pdfDoc: PDFDocument, page: PDFPage, links: { url: string, area: [x: number, y: number, w: number, h: number] }[]) {
        const pdfLinks = [];
        for (const { url, area } of links) {
            const r = area[0] + area[2];
            const d = area[1] + area[3];

            const pdfLink = page.doc.context.register(
                page.doc.context.obj({
                    Type: 'Annot',
                    Subtype: 'Link',
                    Rect: [area[0], area[1], r, d],
                    A: {
                        Type: 'Action',
                        S: 'URI',
                        URI: PDFString.of(url),
                    },
                }),
            );

            pdfLinks.push(pdfLink);
        }

        page.node.set(HyperlinksNode, pdfDoc.context.obj(pdfLinks));
    }

    export function ntUnitToPdm(nt: NTUnit) {
        const mm = NTUnit.asMm(nt);
        return mm / PDFUnitToMmRatio;
    }

    export function pdmToCm(pdm: number): NTCm {
        return NTCm(pdm * PDFUnitToMmRatio / 10.0);
    }

    export function pdmToMm(pdm: number): NTMm {
        return NTMm(pdm * PDFUnitToMmRatio);
    }

    export function rgb(v: NTRgba) {
        return pdfRgb(v.r, v.g, v.b);
    }

    export function textHeight(font: PDFFont, size: number) {
        return NTUnit.create(pdmToMm(font.heightAtSize(size, { descender: true })));
    }

    export function textWidth(text: string, font: PDFFont, size: number) {
        return NTUnit.create(pdmToMm(font.widthOfTextAtSize(text, size)));
    }
}
