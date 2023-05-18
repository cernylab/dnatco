import { PDFDocument } from 'pdf-lib';
import { NTDocument, NTDocumentFonts } from './document';
import { NTEmbeddedImage } from './embedded-image';
import * as NTPrims from './primitives';
import { NTRender, NTTextMetricsCalculators } from './render';
import * as NTR from './renderables';
import { NTMm, NTUnit, NTXYWH } from './space';
import { Fonts } from '../fonts';

const TextHeightMm = 5;
const TextWidthMm = 3;

// Writers

type TextCoords = {
    fromCol: number;
    toCol: number;
    fromLine: number;
    toLine: number;
}

function calcTextCoords(r: NTR.NTRenderableObjects<string>, maxLines: number, maxCols: number): TextCoords {
    const fromCol = Math.min(
        Math.round(NTUnit.asMm(r.x) / TextWidthMm),
        maxCols
    );
    const toCol = Math.min(
        fromCol + Math.round(NTUnit.asMm(r.width) / TextWidthMm),
        maxCols
    );
    const fromLine = Math.min(
        Math.round(NTUnit.asMm(r.y) / TextHeightMm),
        maxLines
    );
    const toLine = Math.min(
        fromLine + Math.round(NTUnit.asMm(r.height!) / TextHeightMm),
        maxLines
    );

    return { fromCol, toCol, fromLine, toLine };
}

function writeLine(tc: TextCoords, output: string[][]) {
    if (tc.toCol === tc.fromCol) {
        for (let ln = tc.fromLine; ln <= tc.toLine; ln++)
            output[ln][tc.fromCol] = '|';
    } else {
        const k = (tc.toLine - tc.fromLine) / (tc.toCol - tc.fromCol);
        const q = tc.fromLine - k * tc.fromCol;

        for (let col = tc.fromCol; col <= tc.toCol; col++) {
            const ln = Math.floor(k * col + q);
            if (ln >= output.length)
                continue;
            if (col >= output[ln].length)
                break;

            output[ln][col] = '-';
        }
    }
}

function writeRect(tc: TextCoords, output: string[][]) {
    for (let col = tc.fromCol + 1; col <= tc.toCol - 1; col++) {
        output[tc.fromLine][col] = '-';
        output[tc.toLine][col] = '-';
    }

    for (let ln = tc.fromLine + 1; ln <= tc.toLine - 1; ln++) {
        output[ln][tc.fromCol] = '|';
        output[ln][tc.toCol] = '|';
    }

    output[tc.fromLine][tc.fromCol] = '/';
    output[tc.fromLine][tc.toCol] = '\\';
    output[tc.toLine][tc.fromCol] = '\\';
    output[tc.toLine][tc.toCol] = '/';
}

function writeText(text: string, tc: TextCoords, output: string[][]) {
    const outLine = output[tc.fromLine];

    for (let idx = 0; idx < text.length; idx++) {
        const col = idx + tc.fromCol
        if (col >= outLine.length)
            break;
        outLine[col] = text[idx];
    }
}

// Helpers

function bottomMostLine(r: NTR.NTRenderableObjects<string> | NTR.NTRenderableHyperlink) {
    let ll;

    if (NTR.NTRenderableHyperlink.is(r)) {
        const bRect = NTR.NTRenderableHyperlink.boundingRect(r);
        ll = NTXYWH.down(bRect)!;
    } else {
        ll = NTXYWH.down(r)!;
    }

    return ll;
}

function embedOneImage(image: NTPrims.NTImage, images: NTEmbeddedImage<string>[]) {
    const payload = '[image]';

    image.tag = images.length;
    images.push(
        NTEmbeddedImage(
            textWidth(payload),
            textHeight(),
            payload
        )
    );
}

function embedAllImages(prims: NTPrims.NTPrimitives[], images: NTEmbeddedImage<string>[] = []) {
    for (const item of prims) {
        if (NTPrims.NTImage.is(item)) {
            embedOneImage(item, images);
        } else if (NTPrims.NTInset.is(item)) {
            embedAllImages(item.prims, images);
        } else if (NTPrims.NTTable.is(item)) {
            for (const row of item.rows) {
                for (const cell of row) {
                    if (cell.content.type === 'image')
                        embedOneImage(cell.content.prim, images);
                }
            }
        }
    }

    return images;
}

function flattenRenderables(renderables: NTR.NTRenderables<string, string>[]) {
    const flattened: (NTR.NTRenderableObjects<string> | NTR.NTRenderableHyperlink)[] = [];

    for (const r of renderables) {
        if (NTR.NTRenderableGroup.is(r)) {
            flattened.push(...flattenRenderables(r.renderables));
        } else
            flattened.push(r);
    }

    return flattened;
}

function numberOfNeededLines(renderables: (NTR.NTRenderableObjects<string> | NTR.NTRenderableHyperlink)[]) {
    let bottomMost = NTUnit.zero();
    for (const r of renderables) {
        const b = bottomMostLine(r);
        if (b > bottomMost)
            bottomMost = b;
    }

    return Math.ceil(NTUnit.asMm(bottomMost) / TextHeightMm);
}

// Typesetting dimensions providers

function descenderHeight() {
    return 0 as NTUnit;
}

function lineHeight(textHeight: NTUnit, spacing: number) {
    return NTUnit.multiply(spacing, textHeight);
}

function textHeight() {
    return NTUnit.from(NTMm(TextHeightMm));
}

function textWidth(text: string) {
    return NTUnit.from(NTMm(text.length * TextWidthMm));
}

const TextMetrics: NTTextMetricsCalculators = {
    descenderHeight,
    lineHeight,
    textHeight,
    textWidth
};

export class NTTextDocument extends NTDocument<string> {
    constructor(
        private readonly characterWidth: number,
        private readonly pageBreakSkip: number,
        fonts: NTDocumentFonts
    ) {
        super(
            {
                x: NTUnit.zero(),
                y: NTUnit.zero(),
                width: NTUnit.from(NTMm(characterWidth * TextWidthMm)),
                height: NTUnit.zero()
            },
            NTPrims.NTFont('serif', 'normal', 12),
            fonts
        );
    }

    static async create(characterWidth: number, pageBreakSkip: number, fonts: Fonts) {
        // Super sad, we do not have sufficient abstraction for this now
        const pdfDoc = await PDFDocument.create();
        const embeddedFonts = await Fonts.embedToPdfDoc(pdfDoc, fonts);

        return new NTTextDocument(characterWidth, pageBreakSkip, embeddedFonts);
    }

    async render() {
        const images = embedAllImages(this.root.prims);

        const renderables = flattenRenderables(
            NTRender.render(
                TextMetrics,
                images,
                NTUnit.multiply(this.pageBreakSkip, NTUnit.from(NTMm(TextHeightMm))),
                this.root,
                this
            )
        );
        renderables.sort((a, b) => {
            if (a.zIndex === b.zIndex) {
                const aY = NTR.NTRenderable.y(a);
                const bY = NTR.NTRenderable.y(b);

                return NTUnit.subtract(aY, bY);
            } else
                return a.zIndex - b.zIndex;
        });


        const numLines = numberOfNeededLines(renderables);
        const output = [];
        for (let line = 0; line < numLines; line++)
            output.push(new Array(this.characterWidth).fill(' '));

        // Render everything
        for (const r of renderables) {
            if (NTR.NTRenderableHyperlink.is(r)) {
                if (r.lines.length > 0) {
                    for (const line of r.lines) {
                        const tc = calcTextCoords(line, output.length - 1, this.characterWidth - 1);
                        writeText(line.text, tc, output);
                    }
                    const tc = calcTextCoords(r.lines[r.lines.length - 1], output.length - 1, this.characterWidth - 1);
                    const url = '[' + r.url + ']';
                    const outLine = output[tc.fromLine];
                    for (let idx = 0; idx < url.length; idx++) {
                        const col = tc.toCol + idx + 1;
                        const ch = url[idx];
                        if (col < outLine.length)
                            outLine[col] = ch;
                        else {
                            // Spill outside the maximum character limit - we cannot do anything better without the risk of getting messed up later by other renderables
                            outLine.push(ch);
                        }
                    }
                }
            } else {
                const tc = calcTextCoords(r, output.length - 1, this.characterWidth - 1);

                if (NTR.NTRenderableLine.is(r)) {
                    writeLine(tc, output);
                } else if (NTR.NTRenderableImage.is(r)) {
                    writeText(r.image.payload, tc, output);
                } else if (NTR.NTRenderableText.is(r)) {
                    writeText(r.text, tc, output);
                } else if (NTR.NTRenderableRect.is(r)) {
                    if (!r.unimportant)
                        writeRect(tc, output);
                }
            }
        }

        let out = '';
        for (const line of output) {
            let idx = line.length - 1;
            while (idx > -1) {
                if (line[idx] !== ' ')
                    break;
                idx--;
            }

            if (idx < 0)
                out += '\n';
            else
                out += line.slice(0, idx + 1).join('') + '\n';
        }

        return out;
    }

    static typesettingDimensions() {
        return {
            characterWidth: NTUnit.from(NTMm(TextWidthMm)),
            characterHeight: NTUnit.from(NTMm(TextHeightMm)),
            lineHeight: NTUnit.from(NTMm(TextHeightMm)),
        };
    }
}
