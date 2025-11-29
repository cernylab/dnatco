import { Report } from '../';
import { Layout } from '../layout';
import { Colors, Fonts, Tables } from '../styling';
import { NTDocument } from '../nottex/document';
import { NTFont, NTHAlignment, NTInset, NTTable } from '../nottex/primitives';
import { NTMm, NTUnit, NTXYWH } from '../nottex/space';
import { Dnatcofication } from '../../dnatco/dnatcofication';
import { AnglesLengths, NavalRankingClasses, ProScoGroup, ProScoGroups } from '../../dnatco/angles-lengths';
import { SummarizeNaval, SummarizeProSco } from '../../dnatco/angles-lengths/summarize';
import { GlobalConfig } from '../../global-config';
import { colorToRgb, nrgb, nrgba, NRgba } from '../../util/colors';

const Monospace = { ...Fonts.Default, family: 'monospace' } as NTFont;
const CountCellText = { hAlign: 'right' as NTHAlignment, font: Monospace };

function drawBarSegment(inset: NTInset, x: number, w: number, totalWidth: NTUnit, H: NTUnit, clr: number, ref: string) {
    const ntX = NTUnit.multiply(x, totalWidth);
    const ntW = NTUnit.multiply(w, totalWidth);

    const color = nrgba(colorToRgb(clr));
    const xywh = NTXYWH.create(ntX, NTUnit.zero(), ntW, H);
    inset.rect(xywh, { color }, ref);
}

function drawCountsBar<Output>(
    inset: NTInset,
    counts: {
        kind: 'prosco',
        counts: Record<ProScoGroup | 'outlier', SummarizeProSco.CountsInGroup>,
    } | {
        kind: 'naval',
        counts: SummarizeNaval.CountsInGroup[],
    },
    mIdx: number,
    tag: string,
    ctx: Report.Context<Output>
) {
    const H = NTUnit.multiply(2, ctx.tDims.characterHeight);
    const totalWidth = inset.xywh.width;

    if (counts.kind === 'prosco') {
        const grps = [...ProScoGroups, 'outlier'] as const;
        const totalCount = grps.map((g) => counts.counts[g]).reduce((p, c) => p + c.exclusive, 0)

        let x = 0;
        for (const grp of grps) {
            const w = counts.counts[grp].exclusive / totalCount;

            drawBarSegment(
                inset,
                x,
                w,
                totalWidth,
                H,
                AnglesLengths.pGroupColor(grp),
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
    } else if (counts.kind === 'naval') {
        const totalCount = counts.counts.reduce((p, c) => p + c.exclusive, 0);

        let x = 0;
        for (let gdx = 0; gdx < NavalRankingClasses.length; gdx++) {
            const cls = NavalRankingClasses[gdx];
            const w = counts.counts[gdx].exclusive / totalCount;

            drawBarSegment(
                inset,
                x,
                w,
                totalWidth,
                H,
                AnglesLengths.navalRankingClassColor(cls),
                `${tag}-${mIdx}`
            );

            x += w;
        }
    }

    let _inset = inset.inset(
        NTXYWH.create(
            ctx.tDims.characterWidth,
            ctx.mode === 'textual' ? ctx.tDims.characterHeight : NTUnit.multiply(0, ctx.tDims.characterHeight), // Keep the zero there, might need adjustment if the font changes
            inset.xywh.width
        ),
        {},
        `${tag}-${mIdx}`
    );
    _inset.lineText(tag, { color: NRgba(1, 1, 1), font: { size: 14, style: 'bold' } });
}

function drawCountsTable<Output>(
    inset: NTInset | NTDocument<Output>,
    counts: {
        kind: 'prosco',
        counts: Record<ProScoGroup | 'outlier', SummarizeProSco.CountsInGroup>,
    } | {
        kind: 'naval',
        counts: SummarizeNaval.CountsInGroup[],
    },
    tag: string,
    ctx: Report.Context<Output>
) {
    const tbl = inset.table(
        3,
        {
            ...Tables.EnumTable(ctx.tDims.characterWidth, ctx.tDims.characterHeight, ctx.mode),
            hAlign: ctx.mode === 'textual' ? 'left' : 'center',
            useDescenderHeightCorrection: false,
        }
    );

    tbl.addRow([
        NTTable.Cell.lineText('Category', tbl, { font: Tables.HeaderFont }),
        NTTable.Cell.lineText('Exclusive', tbl, { font: Tables.HeaderFont }),
        NTTable.Cell.lineText('Cumulative', tbl, { font: Tables.HeaderFont }),
    ]);

    let clrBoxOffset;
    if (counts.kind === 'naval') {
        clrBoxOffset = Math.max(...NavalRankingClasses.map(x => x.length));
    } else {
        clrBoxOffset = Math.max(...ProScoGroups.map(x => x.length));
    }

    const boxXywh = NTXYWH.create(NTUnit.zero(), NTUnit.zero(), NTUnit.multiply(clrBoxOffset, ctx.tDims.characterWidth), ctx.tDims.characterHeight);
    const clrXywh = NTXYWH.create(NTUnit.zero(), NTUnit.zero(), NTUnit.multiply(1, ctx.tDims.characterWidth), ctx.tDims.characterHeight);

    if (counts.kind === 'prosco') {
        const outlierC = counts.counts.outlier;
        for (const grp of ProScoGroups) {
            const c = counts.counts[grp];
            const rectClr = colorToRgb(AnglesLengths.pGroupColor(grp));
            const rectNClr = nrgb(rectClr);
            const box = tbl.getBox(boxXywh);
            const ref = `${tag}-${grp}`;
            if (ctx.mode === 'textual')
                box.lineText(Colors.colorToGlyph(rectClr), {}, ref);
            else
                box.rect(clrXywh, { color: NRgba(rectNClr.r, rectNClr.g, rectNClr.b) }, ref);
            box.lineText(grp, CountCellText, ref);

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
        const rectNClr = nrgba(rectClr);
        const box = tbl.getBox(boxXywh);
        const ref = `${tag}-outlier`;
        if (ctx.mode === 'textual')
            box.lineText(Colors.colorToGlyph(rectClr), {}, ref);
        else
            box.rect(clrXywh, { color: rectNClr }, ref);
        box.lineText(outlierC.pGroup, CountCellText, ref);

        tbl.addRow([
            NTTable.Cell.box(box),
            NTTable.Cell.lineText(outlierC.exclusive.toString(), tbl, CountCellText),
            NTTable.Cell.lineText(
                `${outlierC.cumulative} (100.00 %)`,
                tbl,
                CountCellText
            ),
        ]);
    } else if (counts.kind === 'naval') {
        for (let gdx = 0; gdx < NavalRankingClasses.length; gdx++) {
            const cls = NavalRankingClasses[gdx];
            const c = counts.counts[gdx];
            const rectClr = colorToRgb(AnglesLengths.navalRankingClassColor(cls));
            const rectNClr = nrgb(rectClr);
            const box = tbl.getBox(boxXywh);
            const ref = `${tag}-${gdx}`;
            if (ctx.mode === 'textual')
                box.lineText(Colors.colorToGlyph(rectClr), {}, ref);
            else
                box.rect(clrXywh, { color: NRgba(rectNClr.r, rectNClr.g, rectNClr.b) }, ref);
            box.lineText(NavalRankingClasses[gdx], CountCellText, ref);

            tbl.addRow([
                NTTable.Cell.box(box),
                NTTable.Cell.lineText(c.exclusive.toString(), tbl, CountCellText),
                NTTable.Cell.lineText(
                    `${c.cumulative} (${(100 * c.cumulative / counts.counts[NavalRankingClasses.length - 1].cumulative).toFixed(2).padStart(6, ' ')} %)`,
                    tbl,
                    CountCellText
                ),
            ]);
        }
    }
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
        const alm = ctx.dnatcofication.data.almByCompound;
        const metrics =  GlobalConfig.data().anglesLengths.summaryMetrics;

        for (let mIdx = 0; mIdx < numModels; mIdx++) {
            const modelNum = ctx.dnatcofication.data.structures[0].models[mIdx].num;
            const selected = alm.models.get(modelNum)!;

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

            const countsLengths = metrics === 'prosco'
                ? {
                    kind: 'prosco' as const,
                    counts: SummarizeProSco.countsInGroups(selected.overallLengthsProSco),
                }
                : {
                    kind: 'naval' as const,
                    counts: SummarizeNaval.countsInGroups(selected.overallLengthsNaval),
                };

            console.log(countsLengths);

            drawCountsBar(inset, countsLengths, mIdx, 'Lengths', ctx);
            root.breakLine();
            drawCountsTable(root, countsLengths, `lengths-tbl-${mIdx}`, ctx);

            root.breakLine();

            const countsAngles = metrics === 'prosco'
                ? {
                    kind: 'prosco' as const,
                    counts: SummarizeProSco.countsInGroups(selected.overallAnglesProSco),
                }
                : {
                    kind: 'naval' as const,
                    counts: SummarizeNaval.countsInGroups(selected.overallAnglesNaval),
                };

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
