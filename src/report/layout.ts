import { Report } from './index';
import { Colors } from './colors';
import { Fonts } from './styling'
import { NTUnit, NTXYWH } from './nottex/space';

export namespace Layout {
    export function insetPadding<Output>(xywh: NTXYWH, ctx: Report.Context<Output>) {
        const height = xywh.height
            ? NTUnit.subtract(xywh.height, NTUnit.multiply(6, ctx.tDims.characterHeight))
            : void 0;

        return NTXYWH.create(
            NTUnit.multiply(3, ctx.tDims.characterWidth),
            NTUnit.multiply(3, ctx.tDims.characterHeight),
            NTUnit.subtract(NTUnit.from(ctx.cDims.width), NTUnit.multiply(6, ctx.tDims.characterWidth)),
            height
        );
    }

    export function sectionHeader<Output>(title: string, ctx: Report.Context<Output>) {
        ctx.ntDoc.framedLineText(
            title,
            {
                backgroundColor: Colors.SectionHeaderBg,
                font: Fonts.SectionCaption,
                hAlign: 'center',
                hMargin: 'fill',
                vMargin: ctx.tDims.lineHeight
            }
        );
        ctx.ntDoc.breakLine();
    }
}
