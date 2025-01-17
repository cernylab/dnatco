import { Report } from '../';
import { Layout } from '../layout';
import { Colors, Fonts, Tables } from '../styling';
import { NTDocument } from '../nottex/document';
import { NTFont, NTHAlignment, NTInset, NTTable } from '../nottex/primitives';
import { NTRgba } from '../nottex/util';
import { NTMm, NTUnit, NTXYWH } from '../nottex/space';
import { Dnatcofication } from '../../dnatco/dnatcofication';
import { AnglesLengths } from '../../dnatco/angles-lengths';
import { ByResidueHelpers } from '../../dnatco/angles-lengths/helpers';
import { Summarize } from '../../dnatco/angles-lengths/summarize';
import { colorToRgb, nrgb } from '../../util/colors';
import { InvalidChain } from '../../util/structure-selection';

const Monospace = { ...Fonts.Default, family: 'monospace' } as NTFont;
const CountCellText = { hAlign: 'right' as NTHAlignment, font: Monospace };

function drawBarSegment(inset: NTInset, x: number, w: number, totalWidth: NTUnit, H: NTUnit, clr: number, ref: string) {
    const ntX = NTUnit.multiply(x, totalWidth);
    const ntW = NTUnit.multiply(w, totalWidth);

    const nc = nrgb(colorToRgb(clr));
    const color = NTRgba(nc.r, nc.g, nc.b);
    const xywh = NTXYWH.create(ntX, NTUnit.zero(), ntW, H);
    inset.rect(xywh, { color }, ref);
}

function drawCountsBar<Output>(inset: NTInset, counts: Summarize.CountsInGroup[], mIdx: number, tag: string, ctx: Report.Context<Output>) {
    const H = NTUnit.multiply(2, ctx.tDims.characterHeight);
    const totalWidth = inset.xywh.width;
    const totalCount = counts.reduce((p, c) => p + c.exclusive, 0);

    let x = 0;
    for (let idx = 0; idx < AnglesLengths.pGroupCount(); idx++) {
        const w = counts[idx].exclusive / totalCount;

        drawBarSegment(
            inset,
            x,
            w,
            totalWidth,
            H,
            AnglesLengths.pGroupColor(idx),
            `${tag}-${mIdx}`
        );

        x += w;
    }
    // Outliers
    drawBarSegment(
        inset,
        x,
        1.0 - x,
        totalWidth,
        H,
        AnglesLengths.outlierColor(),
        `${tag}-${mIdx}`
    );

    let _inset = inset.inset(
        NTXYWH.create(
            ctx.tDims.characterWidth,
            ctx.mode === 'textual' ? ctx.tDims.characterHeight : NTUnit.multiply(0, ctx.tDims.characterHeight), // Keep the zero there, might need adjustment if the font changes
            inset.xywh.width
        ),
        {},
        `${tag}-${mIdx}`
    );
    _inset.lineText(tag, { color: NTRgba(1, 1, 1), font: { size: 14, style: 'bold' } });
}

function drawCountsTable<Output>(inset: NTInset | NTDocument<Output>, counts: Summarize.CountsInGroup[], tag: string, ctx: Report.Context<Output>) {
    const tbl = inset.table(
        3,
        {
            ...Tables.EnumTable(ctx.tDims.characterWidth, ctx.tDims.characterHeight, ctx.mode),
            hAlign: ctx.mode === 'textual' ? 'left' : 'center',
            useDescenderHeightCorrection: false,
        }
    );

    tbl.addRow([
        NTTable.Cell.lineText('Percentile', tbl, { font: Tables.HeaderFont }),
        NTTable.Cell.lineText('Exclusive', tbl, { font: Tables.HeaderFont }),
        NTTable.Cell.lineText('Cumulative', tbl, { font: Tables.HeaderFont }),
    ]);

    const boxXywh = NTXYWH.create(NTUnit.zero(), NTUnit.zero(), NTUnit.multiply(6, ctx.tDims.characterWidth), ctx.tDims.characterHeight);
    const clrXywh = NTXYWH.create(NTUnit.zero(), NTUnit.zero(), NTUnit.multiply(1, ctx.tDims.characterWidth), ctx.tDims.characterHeight);
    const outlierC = counts[counts.length - 1];
    for (let idx = 0; idx < AnglesLengths.pGroupCount(); idx++) {
        const c = counts[idx];
        const rectClr = colorToRgb(AnglesLengths.pGroupColor(idx));
        const rectNClr = nrgb(rectClr);
        const box = tbl.getBox(boxXywh);
        const ref = `${tag}-${idx}`;
        if (ctx.mode === 'textual')
            box.lineText(Colors.colorToGlyph(rectClr), {}, ref);
        else
            box.rect(clrXywh, { color: NTRgba(rectNClr.r, rectNClr.g, rectNClr.b) }, ref);
        box.lineText(c.threshold.toFixed(1), CountCellText, ref);

        tbl.addRow([
            NTTable.Cell.box(box),
            NTTable.Cell.lineText(c.exclusive.toString(), tbl, CountCellText),
            NTTable.Cell.lineText(
                `${c.cumulative} (${(100 * c.cumulative / outlierC.cumulative).toFixed(2).padStart(6, ' ')} %)`,
                tbl,
                CountCellText
            ),
        ]);
    }
    const rectClr = colorToRgb(AnglesLengths.outlierColor());
    const rectNClr = nrgb(rectClr);
    const box = tbl.getBox(boxXywh);
    const ref = `${tag}-outlier`;
    if (ctx.mode === 'textual')
        box.lineText(Colors.colorToGlyph(rectClr), {}, ref);
    else
        box.rect(clrXywh, { color: NTRgba(rectNClr.r, rectClr.g, rectClr.b) }, ref);
    box.lineText(outlierC.threshold.toFixed(1), CountCellText, ref);

    tbl.addRow([
        NTTable.Cell.box(box),
        NTTable.Cell.lineText(outlierC.exclusive.toString(), tbl, CountCellText),
        NTTable.Cell.lineText(
            `${outlierC.cumulative} (100.00 %)`,
            tbl,
            CountCellText
        ),
    ]);
}

export namespace BondAnglesLengths {
    export function add<Output>(ctx: Report.Context<Output>) {
        const root = ctx.ntDoc;

        Layout.sectionHeader('Bond Lengths & Angles', ctx);

        root.paragraphText(
            'Occurrence of bond lengths and angles within probability distribution bins',
            { hAlign: 'center' }
        );

        const numModels = Dnatcofication.Structure.numberOfModels(ctx.dnatcofication);
        const alm = ctx.dnatcofication.data.almByResidue;

        for (let mIdx = 0; mIdx < numModels; mIdx++) {
            const selectedIndices = ByResidueHelpers.selectionToIndices(ctx.dnatcofication, mIdx, InvalidChain);
            const selectedResidues = selectedIndices.map((x) => alm.residues[x]);
            const summary = Summarize.substructure(selectedResidues);

            const countsLenghts = Summarize.countsInGroups(summary.lengths);

            if (numModels > 1) {
                root.lineText(
                    `Model ${ctx.dnatcofication.data.structures[0].models[mIdx].num}`,
                    { font: Fonts.SubsectionCaption, hAlign: ctx.mode === 'textual' ? 'left' : 'center' }
                );
                root.breakLine();
            }

            // --- LENGTHS ---
            let inset = root.inset(
                NTXYWH.create(NTMm(0), NTMm(0), ctx.cDims.width),
                {},
                'lengths-bar',
            );
            drawCountsBar(inset, countsLenghts, mIdx, 'Lengths', ctx);
            root.breakLine();
            drawCountsTable(root, countsLenghts, `lengths-tbl-${mIdx}`, ctx);

            root.breakLine();

            const countsAngles = Summarize.countsInGroups(summary.angles);

            // --- ANGLES ---
            inset = root.inset(
                NTXYWH.create(NTMm(0), NTMm(0), ctx.cDims.width),
                {},
                'angles-bar',
            );
            drawCountsBar(inset, countsAngles, mIdx, 'Angles', ctx);
            root.breakLine();
            drawCountsTable(root, countsAngles, `angles-tbl-${mIdx}`, ctx);

            root.breakLine();
        }

        root.breakLine();

        if (ctx.generator === 'web') {
            root.paragraphText('Detailed validation of valence geometry (bond lengths and angles) is available at:', { dontSeparate: true });
            const url = `${ctx.href}/app/dnatco/validation/angles-lengths?cifcode=${ctx.dnatcofication.pdbId.toLowerCase()}`;
            root.hyperlink(url, url);
        }

        root.breakPage();
    }
}
