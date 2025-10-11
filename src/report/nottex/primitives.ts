import { PDFFont } from 'pdf-lib';
import { NTPdf } from './pdf';
import { NTMetric, NTMm, NTUnit, NTXYWH } from './space';
import { NTerror, NTBlackColor, NTWhiteColor, NTHyperlinkColor } from './util';
import { NRgba } from '../../util/colors';

export type NTHAlignment = 'left' | 'center' | 'right';
export type NTVAlignment = 'top' | 'center' | 'bottom';

interface NTPrimitive {
    ref?: string,
}

export const NTFontFamily = ['serif', 'sans', 'monospace'] as const;
export const NTFontStyle = ['normal' , 'bold', 'italic', 'bold-italic'] as const;
export type NTFont = {
    family: typeof NTFontFamily[number],
    style: typeof NTFontStyle[number],
    size: number,
};
export function NTFont(family: NTFont['family'], style: NTFont['style'], size: number): NTFont {
    return { family, style, size };
}

export type NTText = {
    color: NRgba,
    font: NTFont,
    hAlign: NTHAlignment,
}

export class NTBox implements NTPrimitive {
    readonly type = 'ntbox';
    readonly xywh: NTXYWH;
    ref?: string;
    prims: NTTrivialPrimitives[] = [];

    constructor(
        xywh: NTXYWH,
        private readonly defaultFont: NTFont,
        ref?: string
    ) {
        this.ref = ref;
        this.xywh = { ...xywh };
    }

    breakLine(font?: NTFont) {
        const bl = NTBreakLine.mk({ ...this.defaultFont, ...font });
        this.prims.push(bl);
    }

    clone() {
        const box = new NTBox(this.xywh, this.defaultFont, this.ref);
        box.prims = [...this.prims];

        return box;
    }

    lineText(text: string, options?: NTLineText.Options, ref?: string) {
        const lt = NTLineText.mk(text, NTLineText.props(this.defaultFont, options), ref);
        this.prims.push(lt);
    }

    paragraphText(text: string, options?: NTParagraphText.Options, ref?: string) {
        const pt = NTParagraphText.mk(text, NTParagraphText.props(this.defaultFont, options), ref);
        this.prims.push(pt);
    }

    rect(xywh: NTXYWH, options?: NTRect.Options, ref?: string) {
        const rect = NTRect.mk(xywh, NTRect.props(options), ref);
        this.prims.push(rect);
    }

    vSpace(height: NTUnit | NTMetric) {
        this.prims.push(NTVSpace.mk(height));
    }
}
export namespace NTBox {
    export function is(obj: NTAnyPrimitive): obj is NTBox {
        return obj.type === 'ntbox';
    }

    export function mk(xywh: NTXYWH, defaultFont: NTFont, ref?: string) {
        if (!xywh.height)
            NTerror('NTBox must have a height');

        return new NTBox(xywh, defaultFont, ref);
    }
}

export type NTBreakLine = {
    type: 'ntbreakline',
    font: NTFont,
} & NTPrimitive;
export namespace NTBreakLine {
    export function is(obj: NTAnyPrimitive): obj is NTBreakLine {
        return obj.type === 'ntbreakline';
    }

    export function mk(font: NTFont): NTBreakLine {
        return {
            type: 'ntbreakline',
            font,
        }
    };
}

export type NTFramedLineText = {
    type: 'ntframedlinetext',
    text: string,
} & NTFramedLineText.Props & NTPrimitive;
export namespace NTFramedLineText {
    export type Options = {
        border?: NTUnit | NTMetric,
        borderColor?: NRgba,
        backgroundColor?: NRgba | 'none',
        hMargin?: NTUnit | NTMetric | 'fill',
        vMargin?: NTUnit | NTMetric,
        textHAlign?: NTHAlignment,
    } & NTLineText.Options;

    export type Props = {
        border: NTUnit,
        borderColor: NRgba,
        backgroundColor: NRgba | 'none',
        hMargin: NTUnit | 'fill',
        vMargin: NTUnit,
        textHAlign: NTHAlignment,
    } & NTLineText.Props;

    export function is(obj: NTAnyPrimitive): obj is NTFramedLineText {
        return obj.type === 'ntframedlinetext';
    }

    export function mk(text: string, props: Props, ref?: string): NTFramedLineText {
        return {
            type: 'ntframedlinetext',
            text,
            ...props,
            ref,
        };
    }

    export function props(defaultFont: NTFont, options?: Options): Props {
        return {
            border: options?.border ? NTUnit.from(options.border) : NTUnit.zero(),
            borderColor: options?.borderColor ?? NTBlackColor,
            backgroundColor: options?.backgroundColor ?? NTWhiteColor,
            hMargin: options?.hMargin
                ? options.hMargin === 'fill'
                    ? 'fill'
                    : NTUnit.from(options.hMargin) : NTUnit.zero(),
            vMargin: options?.vMargin ? NTUnit.from(options.vMargin) : NTUnit.zero(),
            textHAlign: options?.textHAlign ?? 'center',
            ...NTLineText.props(defaultFont, options),
        };
    }
}

export type NTHyperlink = {
    type: 'nthyperlink',
    text: string,
    url: string,
} & NTLineText.Props & NTPrimitive;
export namespace NTHyperlink {
    export function is(obj: NTAnyPrimitive): obj is NTHyperlink {
        return obj.type === 'nthyperlink';
    }

    export function mk(text: string, url: string, props: NTLineText.Props, ref?: string): NTHyperlink {
        return {
            type: 'nthyperlink',
            text,
            url,
            ...props,
            ref
        };
    }
}

export type NTImage = {
    type: 'ntimage',
    format: 'jpg' | 'png',
    blob: ArrayBuffer,
    tag: number // Used internally by the renderer
} & NTImage.Props & NTPrimitive;
export namespace NTImage {
    export type Options = Partial<Props>;
    export type Props = {
        scale: number,
        hAlign: NTHAlignment,
        vAlign: NTVAlignment,
        caption: string,
        captionPosition: 'above' | 'below',
        captionFont: NTFont,
        captionHAlign: NTHAlignment,
    };

    export function is(obj: NTAnyPrimitive): obj is NTImage {
        return obj.type === 'ntimage';
    }

    export function mk(format: NTImage['format'], blob: ArrayBuffer, props: Props, ref?: string): NTImage {
        return {
            type: 'ntimage',
            format,
            blob,
            ...props,
            tag: -1,
            ref
        };
    }

    export function props(defaultFont: NTFont, options?: Options): Props {
        return {
            hAlign: options?.hAlign ?? 'left',
            vAlign: options?.vAlign ?? 'top',
            scale: options?.scale ?? 1.0,
            caption: options?.caption ?? '',
            captionPosition: options?.captionPosition ?? 'above',
            captionFont: options?.captionFont ?? defaultFont,
            captionHAlign: options?.captionHAlign ?? 'left',
        };
    }
}

export class NTInset implements NTPrimitive {
    readonly type = 'ntinset';
    ref?: string;
    prims: NTPrimitives[] = [];

    constructor(
        readonly xywh: NTXYWH,
        private readonly defaultFont: NTFont,
        private readonly defaultFontObj: PDFFont,
        readonly props: NTInset.Props,
        ref?: string
    ) {
        this.ref = ref;
    }

    breakPage() {
        this.prims.push(NTPageBreak.mk());
    }

    breakLine(font?: NTFont) {
        const bl = NTBreakLine.mk({ ...this.defaultFont, ...font });
        this.prims.push(bl);
    }

    framedLineText(text: string, options: NTFramedLineText.Options, ref?: string) {
        const blt = NTFramedLineText.mk(text, NTFramedLineText.props(this.defaultFont, options), ref);
        this.prims.push(blt);
    }

    hyperlink(text: string, url: string, options?: NTLineText.Options, ref?: string) {
        const h = NTHyperlink.mk(text, url, NTLineText.props(this.defaultFont, options), ref);
        this.prims.push(h);
    }

    image(format: NTImage['format'], blob: ArrayBuffer, options?: NTImage.Options, ref?: string) {
        const im = NTImage.mk(format, blob, NTImage.props(this.defaultFont, options), ref);
        this.prims.push(im);
    }

    inset(xywh: NTXYWH, options?: NTInset.Options, ref?: string) {
        const inset = NTInset.mk(xywh, this.defaultFont, this.defaultFontObj, options, ref);
        this.prims.push(inset);

        return inset;
    }

    lineText(text: string, options?: NTLineText.Options, ref?: string) {
        const lt = NTLineText.mk(text, NTLineText.props(this.defaultFont, options), ref);
        this.prims.push(lt);
    }

    paragraphText(text: string, options?: NTParagraphText.Options, ref?: string) {
        const pt = NTParagraphText.mk(text, NTParagraphText.props(this.defaultFont, options), ref);
        this.prims.push(pt);
    }

    rect(xywh: NTXYWH, options?: NTRect.Options, ref?: string) {
        const rect = NTRect.mk(xywh, NTRect.props(options), ref);
        this.prims.push(rect);
    }

    table(numColumns: number, options?: Partial<NTTable.Options>, ref?: string) {
        const tbl = NTTable.mk(numColumns, this.defaultFont, this.defaultFontObj, options, ref);
        this.prims.push(tbl);

        return tbl;
    }

    vSpace(height: NTUnit | NTMetric) {
        this.prims.push(NTVSpace.mk(height));
    }
}
export namespace NTInset {
    export type Options = {
        defaultFontSize?: number,
        backgroundColor?: NRgba | 'none',
        border?: NTMetric | NTUnit,
        borderColor?: NRgba,
    };
    export type Props = {
        backgroundColor: NRgba | 'none',
        border: NTUnit,
        borderColor: NRgba,
    };

    export function is(obj: NTAnyPrimitive): obj is NTInset {
        return obj.type === 'ntinset';
    }

    export function mk(xywh: NTXYWH, defaultFont: NTFont, defaultFontObj: PDFFont, options?: Options, ref?: string) {
        return new NTInset(xywh, defaultFont, defaultFontObj, props(options), ref);
    }

    export function props(options?: Options): Props {
        const border = options?.border === undefined
            ? NTUnit.zero()
            : NTMetric.is(options?.border)
                ? NTUnit.from(options?.border) : options?.border;

        return {
            backgroundColor: options?.backgroundColor ?? 'none',
            border,
            borderColor: options?.borderColor ?? NTBlackColor,
        };
    }
}

export type NTLine = {
    type: 'ntline',
} & NTXYWH & NTLine.Props & NTPrimitive;
export namespace NTLine {
    export type Props = {
        thickness: NTUnit;
    };

    export function is(obj: NTAnyPrimitive): obj is NTLine {
        return obj.type === 'ntline';
    }

    export function mk(xywh: NTXYWH, thickness?: NTUnit, ref?: string): NTLine {
        return {
            type: 'ntline',
            ...xywh,
            thickness: thickness ?? NTUnit.from(NTMm(1)),
            ref,
        };
    }
}

export type NTLineText = {
    type: 'ntlinetext',
    text: string,
} & NTLineText.Props & NTPrimitive;
export namespace NTLineText {
    export type Options = {
        color?: NRgba,
        font?: Partial<NTFont>,
        hAlign?: NTHAlignment,
    };
    export type Props = NTText;

    export function is(obj: NTAnyPrimitive): obj is NTLineText {
        return obj.type === 'ntlinetext';
    }

    export function mk(text: string, props: Props, ref?: string): NTLineText {
        return {
            type: 'ntlinetext',
            text,
            ...props,
            ref,
        };
    }

    export function props(defaultFont: NTFont, options?: Options): Props {
        return {
            color: options?.color ?? NTBlackColor,
            hAlign: options?.hAlign ?? 'left',
            font: { ...defaultFont, ...options?.font },
        };
    }
}

export type NTPageBreak = {
    type: 'ntpagebreak',
} & NTPrimitive;
export namespace NTPageBreak {
    export function is(obj: NTAnyPrimitive): obj is NTPageBreak {
        return obj.type === 'ntpagebreak';
    }

    export function mk(): NTPageBreak {
        return {
            type: 'ntpagebreak',
        };
    }
}

export type NTParagraphText = {
    type: 'ntparagraphtext',
    text: string,
} & NTParagraphText.Props & NTPrimitive;
export namespace NTParagraphText {
    export type Options = {
        color?: NRgba,
        font?: Partial<NTFont>,
        hAlign? :NTHAlignment,
        lineSpacing?: number,
        dontSeparate?: boolean,
        breakWords?: boolean,
    }
    export type Props = {
        color: NRgba,
        lineSpacing: number,
        dontSeparate: boolean,
        breakWords: boolean,
    } & NTText;

    export function is(obj: NTAnyPrimitive): obj is NTParagraphText {
        return obj.type === 'ntparagraphtext';
    }

    export function mk(text: string, props: Props, ref?: string): NTParagraphText {
        return {
            type: 'ntparagraphtext',
            text,
            ...props,
            ref,
        };
    }

    export function props(defaultFont: NTFont, options?: Options): Props {
        return {
            color: options?.color ?? NTBlackColor,
            hAlign: options?.hAlign ?? 'left',
            font: { ...defaultFont, ...options?.font },
            lineSpacing: options?.lineSpacing ?? 1,
            dontSeparate: options?.dontSeparate ?? false,
            breakWords: options?.breakWords ?? false,
        };
    }
}

export type NTRect = {
    type: 'ntrect',
} & NTXYWH & NTRect.Props & NTPrimitive;
export namespace NTRect {
    export type Options = {
        border?: NTMetric | NTUnit;
        borderColor?: NRgba,
        color?: NRgba,
    }
    export type Props = {
        border: NTUnit,
        borderColor: NRgba,
        color: NRgba | 'none',
    };

    export function is(obj: NTAnyPrimitive): obj is NTRect {
        return obj.type === 'ntrect';
    }

    export function mk(xywh: NTXYWH, props: Props, ref?: string): NTRect {
        return {
            type: 'ntrect',
            ...xywh,
            ...props,
            ref,
        };
    }

    export function props(options?: Options): Props {
        return {
            border: options?.border ? NTUnit.from(options.border) : NTUnit.zero(),
            borderColor: options?.borderColor ?? NTBlackColor,
            color: options?.color ?? 'none',
        };
    }
}

export class NTTable implements NTPrimitive {
    readonly type = 'nttable';
    rows: NTTable.Cell[][] = [];
    props: NTTable.Props;
    ref?: string;

    constructor(readonly numColumns: number, readonly defaultFont: NTFont, readonly defaultFontObj: PDFFont, options?: NTTable.Options, ref?: string) {
        this.ref = ref;

        const defaultPadding = NTPdf.textWidth(' ', defaultFontObj, defaultFont.size);

        this.props = {
            border: options?.border ? NTUnit.from(options.border) : NTUnit.zero(),
            borderColor: options?.borderColor ?? NTBlackColor,
            hAlign: options?.hAlign ?? 'left',
            padding: options?.padding
                ? {
                    top: options.padding?.top !== undefined ? NTUnit.from(options.padding.top) : defaultPadding,
                    left: options.padding?.left !== undefined ? NTUnit.from(options?.padding?.left) : defaultPadding,
                    right: options.padding?.right !== undefined ? NTUnit.from(options?.padding?.right) : defaultPadding,
                    bottom: options.padding?.bottom !== undefined ? NTUnit.from(options?.padding?.bottom) : defaultPadding,
                }
                : { top: defaultPadding, left: defaultPadding, right: defaultPadding, bottom: defaultPadding },
            useDescenderHeightCorrection: options?.useDescenderHeightCorrection ?? true,
        }
    }

    addRow(cells: NTTable.Cell[]) {
        if (cells.length > this.numColumns)
            NTerror(`Number of cells (${cells.length}) is greater than the number of columns in the table (${this.numColumns})`);

        this.rows.push(cells);
    }

    getBox(xywh: NTXYWH) {
        return NTBox.mk(xywh, this.defaultFont);
    }
}
export namespace NTTable {
    export type Options = {
        border?: NTUnit | NTMetric,
        borderColor?: NRgba,
        hAlign?: Props['hAlign'],
        padding?: {
            top?: NTUnit | NTMetric,
            left?: NTUnit | NTMetric,
            right?: NTUnit | NTMetric,
            bottom?: NTUnit | NTMetric,
        },
        useDescenderHeightCorrection?: boolean,
    }
    export type Props = {
        border: NTUnit,
        borderColor: NRgba,
        hAlign: NTHAlignment | 'fill',
        padding: {
            top: NTUnit,
            left: NTUnit,
            right: NTUnit,
            bottom: NTUnit,
        },
        useDescenderHeightCorrection: boolean,
    }

    export function is(obj: NTAnyPrimitive): obj is NTTable {
        return obj.type === 'nttable';
    }

    export function mk(numColumns: number, defaultFont: NTFont, defaultFontObj: PDFFont, options?: NTTable.Options, ref?: string) {
        return new NTTable(numColumns, defaultFont, defaultFontObj, options, ref);
    }

    export type Cell = {
        content: Cell.Content;
    } & Cell.Props;
    export namespace Cell {
        export type BoxContent = {
            type: 'box',
            prim: NTBox,
        };
        export type HyperlinkContent = {
            type: 'hyperlink',
            prim: NTHyperlink,
            maxWidth: NTUnit | NTMetric
        };
        export type LineTextContent = {
            type: 'linetext',
            prim: NTLineText,
        };
        export type ImageContent = {
            type: 'image',
            prim: NTImage,
        };
        export type ParagraphTextContent = {
            type: 'paragraphtext',
            prim: NTParagraphText,
            maxWidth: NTUnit,
        };
        export type RectContent = {
            type: 'rect',
            prim: NTRect,
        };

        export type Content = BoxContent | HyperlinkContent | LineTextContent | ImageContent | ParagraphTextContent | RectContent;

        export type Options = Partial<Props>;
        export type Props = {
            backgroundColor: NRgba | 'none',
            colSpan: number,
            vAlign: NTVAlignment,
        };
        export type ParagraphTextOptions = {
            maxWidth: NTUnit | NTMetric
        } & NTParagraphText.Options;

        export function box(theBox: NTBox, cellOptions?: Options): Cell {
            return {
                content: {
                    type: 'box',
                    prim: theBox,
                },
                ...props(cellOptions),
            };
        }

        export function hyperlink(text: string, url: string, maxWidth: NTMetric | NTUnit, table: NTTable, cellOptions?: Options): Cell {
            return {
                content: {
                    type: 'hyperlink',
                    prim: NTHyperlink.mk(text, url, { color: NTHyperlinkColor, font: table.defaultFont, hAlign: 'left' }),
                    maxWidth,
                },
                ...props(cellOptions)
            };
        }

        export function image(format: NTImage['format'], blob: ArrayBuffer, table: NTTable, options?: NTImage.Options, cellOptions?: Options): Cell {
            return {
                content: {
                    type: 'image',
                    prim: NTImage.mk(format, blob, NTImage.props(table.defaultFont, options)),
                },
                ...props(cellOptions)
            };
        }

        export function lineText(text: string, table: NTTable, options?: NTLineText.Options, cellOptions?: Cell.Options): Cell {
            return {
                content: {
                    type: 'linetext',
                    prim: NTLineText.mk(text, NTLineText.props(table.defaultFont, options)),
                },
                ...props(cellOptions)
            };
        }

        export function paragraphText(text: string, table: NTTable, options: ParagraphTextOptions, cellOptions?: Cell.Options): Cell {
            return {
                content: {
                    type: 'paragraphtext',
                    prim: NTParagraphText.mk(text, NTParagraphText.props(table.defaultFont, options)),
                    maxWidth: NTUnit.from(options.maxWidth),
                },
                ...props(cellOptions)
            };
        }

        export function props(options?: Options) {
            return {
                backgroundColor: options?.backgroundColor ?? 'none',
                colSpan: options?.colSpan ?? 1,
                vAlign: options?.vAlign ?? 'center',
            };
        }

        export function rect(xywh: NTXYWH, options?: NTRect.Options, cellOptions?: Cell.Options): Cell {
            return {
                content: {
                    type: 'rect',
                    prim: NTRect.mk(xywh, NTRect.props(options)),
                },
                ...props(cellOptions)
            };
        }
    }
}

export type NTVSpace = {
    type: 'ntvspace',
    height: NTUnit,
} & NTPrimitive;
export namespace NTVSpace {
    export function is(obj: NTAnyPrimitive): obj is NTVSpace {
        return obj.type === 'ntvspace';
    }

    export function mk(height: NTUnit | NTMetric): NTVSpace {
        return {
            type: 'ntvspace',
            height: NTUnit.from(height),
        };
    }
}

export type NTPrimitives = NTInset | NTFramedLineText | NTLineText |
    NTParagraphText | NTTable | NTVSpace |
    NTPageBreak | NTHyperlink | NTImage |
    NTBreakLine | NTLine | NTRect | NTBox;
export type NTTrivialPrimitives = Omit<NTPrimitives, 'NTPageBreak' | 'NTHyperlink' | 'NTTable' | 'NTInset' | 'NTImage' | 'NTBox' | 'NTFramedLineText'>;
export type NTAnyPrimitive = NTPrimitives | NTTrivialPrimitives;
