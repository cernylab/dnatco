import { NTFont, NTTable } from './nottex/primitives';
import { NTUnit } from './nottex/space';

export namespace Fonts {
    export const Default = { family: 'sans', size: 12 } as NTFont;
    export const Monospace = { ...Default, family: 'monospace' } as NTFont;
    export const ReportTitle = { family: Default.family, size: 18, style: 'bold' } as NTFont;
    export const SectionCaption = { family: Default.family, size: 16, style: 'bold' } as NTFont;
    export const SubsectionCaption = { ...Default, size: 14, style: 'bold' } as NTFont;
}

export namespace Tables {
    export function EnumTable(charWidth: NTUnit, charHeight: NTUnit): NTTable.Options {
        return {
            padding: {
                top: NTUnit.zero(),
                left: NTUnit.zero(),
                right: charWidth,
                bottom: NTUnit.multiply(0.5, charHeight),
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
