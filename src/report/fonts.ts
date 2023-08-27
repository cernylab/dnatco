import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { NTDocumentFonts } from './nottex/document';
import { GlobalConfig } from '../global-config';
import '../../../assets/fonts/ttf/pt-serif_regular.ttf';
import '../../../assets/fonts/ttf/pt-serif_bold.ttf';
import '../../../assets/fonts/ttf/pt-serif_bold-italic.ttf';
import '../../../assets/fonts/ttf/pt-serif_italic.ttf';
import '../../../assets/fonts/ttf/pt-sans_regular.ttf';
import '../../../assets/fonts/ttf/pt-sans_bold.ttf';
import '../../../assets/fonts/ttf/pt-sans_bold-italic.ttf';
import '../../../assets/fonts/ttf/pt-sans_italic.ttf';
import '../../../assets/fonts/ttf/pt-mono_regular.ttf';
import '../../../assets/fonts/ttf/pt-mono_bold.ttf';


let fonts = {
    serif: {
        normal: new Uint8Array(),
        bold: new Uint8Array(),
        italic: new Uint8Array(),
        'bold-italic': new Uint8Array(),
    },
    sans: {
        normal: new Uint8Array(),
        bold: new Uint8Array(),
        italic: new Uint8Array(),
        'bold-italic': new Uint8Array(),
    },
    monospace: {
        normal: new Uint8Array(),
        bold: new Uint8Array(),
        italic: new Uint8Array(),
        'bold-italic': new Uint8Array(),
    },
};
let loaded = false;

export type Fonts = typeof fonts;

const Sources = {
    serif: {
        normal: 'fonts/ttf/pt-serif_regular.ttf',
        bold: 'fonts/ttf/pt-serif_bold.ttf',
        italic: 'fonts/ttf/pt-serif_italic.ttf',
        'bold-italic': 'fonts/ttf/pt-serif_bold-italic.ttf',
    },
    sans: {
        normal: 'fonts/ttf/pt-sans_regular.ttf',
        bold: 'fonts/ttf/pt-sans_bold.ttf',
        italic: 'fonts/ttf/pt-sans_italic.ttf',
        'bold-italic': 'fonts/ttf/pt-sans_bold-italic.ttf',
    },
    monospace: {
        normal: 'fonts/ttf/pt-mono_regular.ttf',
        bold: 'fonts/ttf/pt-mono_bold.ttf',
        italic: 'fonts/ttf/pt-mono_regular.ttf',
        'bold-italic': 'fonts/ttf/pt-mono_bold.ttf',
    },
};

export namespace Fonts {
    export function get() {
        if (loaded)
            return fonts;

        throw new Error('Load the fonts by calling the load() function prior to calling get()');
    }

    export async function embedToPdfDoc(pdfDoc: PDFDocument, fonts: Fonts): Promise<NTDocumentFonts> {
        pdfDoc.registerFontkit(fontkit);

        return {
            serif: {
                normal: await pdfDoc.embedFont(fonts.serif.normal),
                bold: await pdfDoc.embedFont(fonts.serif.bold),
                italic: await pdfDoc.embedFont(fonts.serif.italic),
                'bold-italic': await pdfDoc.embedFont(fonts.serif['bold-italic']),
            },
            sans: {
                normal: await pdfDoc.embedFont(fonts.sans.normal),
                bold: await pdfDoc.embedFont(fonts.sans.bold),
                italic: await pdfDoc.embedFont(fonts.sans.italic),
                'bold-italic': await pdfDoc.embedFont(fonts.sans['bold-italic']),
            },
            monospace: {
                normal: await pdfDoc.embedFont(fonts.monospace.normal),
                bold: await pdfDoc.embedFont(fonts.monospace.bold),
                italic: await pdfDoc.embedFont(fonts.monospace.italic),
                'bold-italic': await pdfDoc.embedFont(fonts.monospace['bold-italic']),
            }
        }
    }

    export async function load(loaderFunc?: (subpath: string) => Uint8Array) {
        if (loaded)
            return;

        for (const _family in Sources) {
            const family = _family as keyof typeof Sources;
            const Family = Sources[family]
            for (const _style in Family) {
                const style = _style as keyof typeof Family;
                let buf;

                if (loaderFunc) {
                    buf = loaderFunc(Family[style]);
                } else {
                    const req = await fetch(`${GlobalConfig.data().pathPrefix}/${Family[style]}`);
                    if (!req.ok)
                        throw new Error(`Cannot get font ${Family[style]} that is required for report generation`);

                    buf = new Uint8Array(await req.arrayBuffer());
                }

                fonts[family][style] = buf;
            }
        }

        loaded = true;
    }
}
