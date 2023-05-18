import { Report } from './index';
import { Colors, Fonts } from './styling'
import { NTUnit, NTXYWH } from './nottex/space';

export namespace Layout {
    export function insetPadding<Output>(xywh: NTXYWH, hPad: NTUnit, vPad: NTUnit, ctx: Report.Context<Output>) {
        const height = xywh.height
            ? NTUnit.subtract(xywh.height, NTUnit.multiply(2, vPad))
            : void 0;

        return NTXYWH.create(
            hPad,
            vPad,
            NTUnit.subtract(NTUnit.from(ctx.cDims.width), NTUnit.multiply(2, hPad)),
            height
        );
    }

    export function sectionHeader<Output>(title: string, ctx: Report.Context<Output>) {
        ctx.ntDoc.framedLineText(
            title,
            {
                backgroundColor: Colors.SectionHeaderBg,
                font: Fonts.SectionCaption,
                textHAlign: 'center',
                hMargin: 'fill',
                vMargin: ctx.tDims.lineHeight
            }
        );
        ctx.ntDoc.breakLine();
    }
}
