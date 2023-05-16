import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { NTDocumentFonts } from './nottex/document';
import { GlobalConfig } from '../global-config';
import '../../../assets/fonts/SourceSansPro-Bold.ttf';
import '../../../assets/fonts/SourceSansPro-BoldItalic.ttf';
import '../../../assets/fonts/SourceSansPro-Italic.ttf';
import '../../../assets/fonts/SourceSansPro-Regular.ttf';


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
        normal: 'fonts/SourceSansPro-Regular.ttf',
        bold: 'fonts/SourceSansPro-Bold.ttf',
        italic: 'fonts/SourceSansPro-Italic.ttf',
        'bold-italic': 'fonts/SourceSansPro-BoldItalic.ttf',
    },
    sans: {
        normal: 'fonts/SourceSansPro-Regular.ttf',
        bold: 'fonts/SourceSansPro-Bold.ttf',
        italic: 'fonts/SourceSansPro-Italic.ttf',
        'bold-italic': 'fonts/SourceSansPro-BoldItalic.ttf',
    },
    monospace: {
        normal: 'fonts/SourceSansPro-Regular.ttf',
        bold: 'fonts/SourceSansPro-Bold.ttf',
        italic: 'fonts/SourceSansPro-Italic.ttf',
        'bold-italic': 'fonts/SourceSansPro-BoldItalic.ttf',
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

    export async function load() {
        if (loaded)
            return;

        for (const _family in Sources) {
            const family = _family as keyof typeof Sources;
            const Family = Sources[family]
            for (const _style in Family) {
                const style = _style as keyof typeof Family;
                const req = await fetch(`${GlobalConfig.data().pathPrefix}/${Family[style]}`);
                if (!req.ok)
                    throw new Error(`Cannot get font ${Family[style]} that is required for report generation`);

                const buf = await req.arrayBuffer();
                fonts[family][style] = new Uint8Array(buf);
            }
        }

        loaded = true;
    }
}
