import { Fonts as _Fonts } from './fonts';
import { Fonts, OutputMode } from './styling';
import { BondAnglesLengths } from './content/bond-angles-lengths';
import { CompleteStepsTable } from './content/complete-steps-table';
import { DinucleotideOutliers } from './content/dinucleotide-outliers';
import { Title } from './content/title';
import { RsccRmsd } from './content/rscc-rmsd';
import { StructureInfo } from './content/structure-info';
import { StructureQuality } from './content/structure-quality';
import { UntypicalAnglesLengths } from './content/untypical-angles-lengths';
import { NTDocument } from './nottex/document';
import { NTPdfDocument } from './nottex/pdf-document';
import { NTTextDocument } from './nottex/text-document';
import { NTMm, NTUnit } from './nottex/space';
import { Dnatcofication } from '../dnatco/dnatcofication';

const TDims = NTTextDocument.typesettingDimensions();
const Margins = {
    top: NTUnit.toMm(NTUnit.multiply(5, TDims.lineHeight)),
    left: NTUnit.toMm(NTUnit.multiply(5, TDims.characterWidth)),
    right: NTUnit.toMm(NTUnit.multiply(5, TDims.characterWidth)),
    bottom: NTUnit.toMm(NTUnit.multiply(5, TDims.lineHeight)),
}
const PageSize = {
    width: NTMm(210),
    height: NTMm(297),
};

function makeContext<Output>(dnatcofication: Dnatcofication, ntDoc: NTDocument<Output>, href: string, mode: OutputMode): Report.Context<Output> {
    return {
        dnatcofication,
        ntDoc,
        tDims: { ...TDims },
        cDims: {
            width: NTMm(PageSize.width.value - Margins.left.value - Margins.right.value),
        },
        href,
        mode,
    };
}

export namespace Report {
    async function addContent<Output>(ctx: Context<Output>, completeStepsTable: boolean) {
        await Title.add(ctx);
        StructureInfo.add(ctx);
        await StructureQuality.add(ctx);
        if (completeStepsTable)
            CompleteStepsTable.add(ctx);
        DinucleotideOutliers.add(ctx);
        await RsccRmsd.add(ctx);
        BondAnglesLengths.add(ctx);
        UntypicalAnglesLengths.add(ctx);
    }

    export type Context<Output> = {
        dnatcofication: Dnatcofication,
        ntDoc: NTDocument<Output>,
        tDims: typeof TDims,
        cDims: {
            width: NTMm,
        },
        href: string,
        mode: OutputMode,
    }

    export type Options = {
        completeStepsTable: boolean,
    }

    export async function pdf(dnatcofication: Dnatcofication, options: Partial<Options> & { href: string }) {
        await _Fonts.load();

        const ntDoc = await NTPdfDocument.create(Margins, PageSize, _Fonts.get(), Fonts.Default);
        const ctx = makeContext(dnatcofication, ntDoc, options.href, 'graphical');
        await addContent(ctx, !!options?.completeStepsTable);

        return await ntDoc.render();
    }

    export async function text(dnatcofication: Dnatcofication, options: Partial<Options> & { href: string }) {
        await _Fonts.load();

        const ntDoc = await NTTextDocument.create(80, 5, _Fonts.get());
        const ctx = makeContext(dnatcofication, ntDoc, options.href, 'textual');
        await addContent(ctx, !!options?.completeStepsTable);

        return await ntDoc.render();
    }

}
