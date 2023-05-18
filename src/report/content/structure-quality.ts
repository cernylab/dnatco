import { Report } from '../';
import { Layout } from '../layout';
import { Tables } from '../styling';
import { PDFUnit } from '../nottex/pdf';
import { NTTable } from '../nottex/primitives';
import { NTRgba } from '../nottex/util';
import { NTUnit, NTXYWH } from '../nottex/space';
import { NdbStructNtcOverall } from '../../cif/categories/ndb-struct-ntc';
import { Dnatcofication, StepRmsdStats } from '../../dnatco/dnatcofication';
import { nrgb } from '../../ui/util';
import { confalPercentile, Common } from '../../ui/dnatco/common';
import { getCifValue, GappedSemaphore } from '../../ui/dnatco/util';
import { AngstromSignChar } from '../../util';

async function averageConfalsRow<Output>(avg: number, percentile: number, tbl: NTTable, mIdx: number, ctx: Report.Context<Output>) {
    const row = [
        NTTable.Cell.lineText('Confal score:', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
        NTTable.Cell.lineText(`Average value: ${avg.toFixed(0)}`, tbl, { font: Tables.EnumTableValue.font }, Tables.EnumTableValue.cell),
        NTTable.Cell.lineText(`Percentile: ${percentile.toFixed(0)}`, tbl, { font: Tables.EnumTableValue.font }, { ...Tables.EnumTableValue.cell, colSpan: tbl.numColumns - 2 }),
    ];

    tbl.addRow(row);

    // --- PERCENTILE BAR ---
    if (ctx.mode === 'textual') {
        // We cannot draw gradients in a textual output, settle for a rectangle with a dividing line
        // at the percentile marker position

        const W = NTUnit.multiply(40, ctx.tDims.characterWidth);
        const H = NTUnit.multiply(2, ctx.tDims.characterHeight);
        const BH = NTUnit.multiply(3, ctx.tDims.characterHeight);
        const box = tbl.getBox(NTXYWH.create(NTUnit.zero(), NTUnit.zero(), W, BH));

        const w = NTUnit.multiply(percentile / 100, W);
        const xywh = NTXYWH.create(NTUnit.zero(), NTUnit.zero(), w, H);
        box.rect(xywh, {}, `perc-bar-${mIdx}`);

        xywh.x = w;
        xywh.width = NTUnit.subtract(W, w);
        box.rect(xywh, {}, `perc-bar-${mIdx}`);

        tbl.addRow([
            NTTable.Cell.lineText('', tbl),
            NTTable.Cell.box(box, { colSpan: tbl.numColumns - 1 }),
        ]);
    } else {
        const W = NTUnit.multiply(40, ctx.tDims.characterWidth);
        const H = NTUnit.multiply(1, ctx.tDims.characterHeight);
        const NW = NTUnit.num(W);
        const NH = NTUnit.num(H);
        const canvas = new OffscreenCanvas(NW, NH);
        const ctx2d = canvas.getContext('2d') as CanvasRenderingContext2D | null;
        if (!ctx2d)
            throw new Error('Cannot create offscreen canvas for confal percentile bar rendering');

        const grad = ctx2d.createLinearGradient(0, 0, NW, NH);
        grad.addColorStop(0.0, 'red');
        grad.addColorStop(0.5, 'rgb(255, 255, 255)');
        grad.addColorStop(1.0, 'rgb(  0,  0, 255)');
        ctx2d.fillStyle = grad;
        ctx2d.fillRect(0, 0, NW, NH);
        ctx2d.stroke();

        const MW = NW / 55;
        ctx2d.fillStyle = 'rgb(0, 0, 0)';
        ctx2d.fillRect(NW * percentile / 100 - MW, 0, MW, NH);

        ctx2d.stroke();

        // @ts-ignore
        const blob = await canvas.convertToBlob();
        const imgBuf = await (blob as Blob).arrayBuffer();

        tbl.addRow([
            NTTable.Cell.lineText('', tbl),
            NTTable.Cell.image('png', imgBuf, tbl, { scale: 0.1 * PDFUnit}, { colSpan: tbl.numColumns - 1 })
        ]);
    }
}

const GSMapping = GappedSemaphore.makeMapping([
    { from: 0, to: 0.3 }, { from: 0.6, to: 1.0 },
]);
function rmsdStatsRow<Output>(stats: StepRmsdStats[], tbl: NTTable, mIdx: number, ctx: Report.Context<Output>) {
    const rmsdGreen = stats[0].rmsdThreshold;
    const rmsdRed = stats[stats.length - 2]?.rmsdThreshold ?? (rmsdGreen * 2);
    const rmsdColors = stats.map((x, idx) => {
        const thrPrev = stats[idx - 1]?.rmsdThreshold ?? 0;
        const v = x.rmsdThreshold === -1 ? rmsdRed + 0.1 : thrPrev + (x.rmsdThreshold - thrPrev) / 2.0;
        const rgb = nrgb(GappedSemaphore.toSemaphore(v, rmsdGreen, rmsdRed, GSMapping));

        return NTRgba(rgb.r, rgb.g, rgb.b);
    });

    const dataRows = [];
    for (let idx = 0; idx < stats.length - 1; idx++) {
        const s = stats[idx];
        dataRows.push(
            NTTable.Cell.lineText(`< ${s.rmsdThreshold}: ${s.count}`, tbl, { color: rmsdColors[idx], font: Tables.EnumTableValue.font }, Tables.EnumTableValue.cell)
        );
    }
    const s = stats[stats.length - 1];
    const thr = stats[stats.length - 2].rmsdThreshold;
    dataRows.push(
        NTTable.Cell.lineText(`> ${thr}: ${s.count}`, tbl, { color: rmsdColors[rmsdColors.length - 1], font: Tables.EnumTableValue.font }, Tables.EnumTableValue.cell)
    );

    tbl.addRow([
        NTTable.Cell.lineText(`RMSD [${AngstromSignChar}]`, tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
        ...dataRows
    ]);

    // --- RELATIVE COUNTS LINE ---
    const rmsdCounts = stats.map(x => x.count);
    const rmsdTotal = rmsdCounts.reduce((p, c) => p + c, 0);

    const W = NTUnit.multiply(40, ctx.tDims.characterWidth);
    const H = NTUnit.multiply(ctx.mode === 'textual' ? 2 : 1, ctx.tDims.characterHeight);
    const BH = NTUnit.multiply(ctx.mode === 'textual' ? 3 : 1, ctx.tDims.characterHeight);
    const box = tbl.getBox(NTXYWH.create(NTUnit.zero(), NTUnit.zero(), W, BH));
    let x = 0;
    const xywh = NTXYWH.create(NTUnit.zero(), NTUnit.zero(), NTUnit.zero(), H);
    for (let idx = 0; idx < rmsdCounts.length; idx++) {
        const w = rmsdCounts[idx] / rmsdTotal;
        xywh.x = NTUnit.multiply(x, W)
        xywh.width = NTUnit.multiply(w, W);
        box.rect(xywh, { color: rmsdColors[idx] }, `rmsd-rel-counts-bar-${mIdx}`);

        x += w;
    }

    tbl.addRow([
        NTTable.Cell.lineText('', tbl),
        NTTable.Cell.box(box, { colSpan: 3 }),
    ]);
}

export namespace StructureQuality {
    export async function add<Output>(ctx: Report.Context<Output>) {
        const root = ctx.ntDoc;

        // --- HEADER ---
        Layout.sectionHeader('Overall structure quality', ctx);
        root.paragraphText('Assignment conformer category (NtC) to dinucleotide category and the quality of fit', { hAlign: 'center' });
        root.breakLine();

        const numModels = Dnatcofication.Structure.numberOfModels(ctx.dnatcofication);
        const confalAverage = ctx.dnatcofication.data.averageConfals;
        const rmsdStats = ctx.dnatcofication.data.stepRmsdStats;

        for (let mIdx = 0; mIdx < numModels; mIdx++) {
            const mNum = ctx.dnatcofication.data.structures[0].models[mIdx].num
            const avg = confalAverage[mIdx];

            if (numModels > 1)
                root.lineText(`Model ${mNum}`, { hAlign: ctx.mode === 'textual' ? 'left' : 'center', font: { style: 'bold' } });

            const tbl = root.table(1 + rmsdStats[0].length, { ...Tables.EnumTable(ctx.tDims.characterWidth, ctx.tDims.characterHeight, ctx.mode), hAlign: ctx.mode === 'textual' ? 'left' : 'center' });
            tbl.addRow([
                NTTable.Cell.lineText('NtC:', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
                NTTable.Cell.lineText(`Assigned: ${getCifValue(ctx.dnatcofication, NdbStructNtcOverall, 'num_classified') ?? Common.NA}`, tbl, { font: Tables.EnumTableValue.font }, Tables.EnumTableValue.cell),
                NTTable.Cell.lineText(`Close: ${getCifValue(ctx.dnatcofication, NdbStructNtcOverall, 'num_unclassified_rmsd_close') ?? Common.NA}`, tbl, { font: Tables.EnumTableValue.font }, Tables.EnumTableValue.cell),
                NTTable.Cell.lineText(`Unassigned: ${getCifValue(ctx.dnatcofication, NdbStructNtcOverall, 'num_unclassified') ?? Common.NA}`, tbl, { font: Tables.EnumTableValue.font }, Tables.EnumTableValue.cell),
            ]);

            rmsdStatsRow(rmsdStats[mIdx], tbl, mIdx, ctx);
            await averageConfalsRow(avg, confalPercentile(avg), tbl, mIdx, ctx);

            root.breakLine();
        }

        root.breakLine();

        const url = `${ctx.href}/app/dnatco/validation/confals-rmsds?cifcode=${ctx.dnatcofication.pdbId.toLowerCase()}`;
        root.paragraphText(
            'Detailed table assigned NtC classes of each dinucleotide step and their individual of RMSD and Confal scores can be found at:',
            { dontSeparate: true }
        );
        root.hyperlink(url, url);

        root.breakPage();
    }
}
