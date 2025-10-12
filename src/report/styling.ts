import { NTFont, NTTable } from './nottex/primitives';
import { NTUnit } from './nottex/space';
import { luminance, nclr, rgbToColor, Rgb, NRgba } from '../util/colors';

const LuminanceToChar = [' ', '░', '▒', '▓', '█' ];

export type OutputMode = 'graphical' | 'textual';

export namespace Colors {
    export const SectionHeaderBg = NRgba(nclr(187), nclr(187), nclr(187));
    export const SectionHeaderFg = NRgba(nclr(67), nclr(67), nclr(67));

    export function colorToGlyph(clr: Rgb) {
        const lum = luminance(rgbToColor(clr.r, clr.g, clr.b));
        const idx = Math.round(lum * (LuminanceToChar.length - 1));
        return LuminanceToChar[idx];
    }
}

export namespace Fonts {
    export const Default = { family: 'sans', size: 12 } as NTFont;
    export const Monospace = { ...Default, family: 'monospace' } as NTFont;
    export const ReportTitle = { family: Default.family, size: 18, style: 'bold' } as NTFont;
    export const SectionCaption = { family: Default.family, size: 16, style: 'bold' } as NTFont;
    export const SubsectionCaption = { ...Default, size: 14, style: 'bold' } as NTFont;
}

export namespace Tables {
    export function EnumTable(charWidth: NTUnit, charHeight: NTUnit, mode: OutputMode): NTTable.Options {
        return {
            padding: {
                top: NTUnit.zero(),
                left: NTUnit.zero(),
                right: charWidth,
                bottom: mode === 'textual' ? NTUnit.zero() : NTUnit.multiply(0.5, charHeight),
            }
        };
    }
    export const EnumTableName = {
        cell: { hAlign: 'left', vAlign: 'top' } as NTTable.Cell.Options,
        font: { ...Fonts.SubsectionCaption, size: 12 },
    }
    export const EnumTableValue = {
        cell: { hAlign: 'left', vAlign: 'top' } as NTTable.Cell.Options,
        font: Fonts.Default,
    }

    export const HeaderFont = { ...Fonts.SubsectionCaption, size: 12 };

    export const TextCell = { hAlign: 'left', vAlign: 'top' } as NTTable.Cell.Options;
    export const NumCell = { hAlign: 'right', vAlign: 'top' } as NTTable.Cell.Options;
}
