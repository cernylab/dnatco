import { PDFFont } from 'pdf-lib';
import * as NTPrims from './primitives';
import { NTMetric, NTXYWH, NTUnit } from './space';
import { NTHyperlinkColor } from './util';

export abstract class NTDocument<Output> {
    protected root;

    constructor(
        readonly container: NTXYWH,
        readonly defaultFont: NTPrims.NTFont,
        readonly fonts: NTDocumentFonts,
    ) {
        this.root = NTPrims.NTInset.mk(
            { x: NTUnit.zero(), y: NTUnit.zero(), width: this.container.width },
            this.defaultFont,
            this.fonts[this.defaultFont.family][this.defaultFont.style]
        );
    }

    breakLine(font?: NTPrims.NTFont) {
        this.root.breakLine(font);
    }

    breakPage() {
        this.root.breakPage();
    }

    framedLineText(text: string, options: NTPrims.NTFramedLineText.Options, ref?: string) {
        this.root.framedLineText(text, options, ref);
    }

    image(format: NTPrims.NTImage['format'], blob: ArrayBuffer, options?: NTPrims.NTImage.Options, ref?: string) {
        this.root.image(format, blob, options, ref);
    }

    inset(xywh: NTXYWH, options?: NTPrims.NTInset.Options, ref?: string) {
        return this.root.inset(xywh, options, ref);
    }

    lineText(text: string, options?: NTPrims.NTLineText.Options, ref?: string) {
        this.root.lineText(text, options, ref);
    }

    hyperlink(text: string, url: string, options?: NTPrims.NTLineText.Options, ref?: string) {
        const opts = {
            ...options,
            color: options?.color ?? NTHyperlinkColor
        };
        this.root.hyperlink(text, url, opts, ref);
    }

    paragraphText(text: string, options?: NTPrims.NTParagraphText.Options, ref?: string) {
        this.root.paragraphText(text, options, ref);
    }

    rect(xywh: NTXYWH, options?: NTPrims.NTRect.Options, ref?: string) {
        this.root.rect(xywh, options, ref);
    }

    table(numColumns: number, options?: NTPrims.NTTable.Options, ref?: string) {
        return this.root.table(numColumns, options, ref);
    }

    vSpace(height: NTUnit | NTMetric) {
        this.root.vSpace(height);
    }

    abstract render(): Promise<Output>;
}

export type NTDocumentFonts = Record<
    typeof NTPrims.NTFontFamily[number],
    Record<typeof NTPrims.NTFontStyle[number], PDFFont>
>;
