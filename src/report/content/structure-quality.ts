import { Report } from '../';
import { Layout } from '../layout';
import { Tables } from '../styling';
import { NTTable } from '../nottex/primitives';
import { NTCm, NTUnit, NTXYWH } from '../nottex/space';
import { NdbStructNtcOverall } from '../../cif/categories/ndb-struct-ntc';
import { Dnatcofication, StepRmsdStats } from '../../dnatco/dnatcofication';
import { nrgb } from '../../ui/util';
import { confalPercentile, Common } from '../../ui/dnatco/common';
import { getCifValue, GappedSemaphore } from '../../ui/dnatco/util';
import {NTRgba} from '../nottex/util';

async function averageConfalsRow(avg: number, percentile: number, tbl: NTTable, charWidth: NTUnit, charHeight: NTUnit) {
    const row = [
        NTTable.Cell.lineText('Confal score:', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
        NTTable.Cell.lineText(`Average value: ${avg.toFixed(0)}`, tbl, { font: Tables.EnumTableValue.font }, Tables.EnumTableValue.cell),
        NTTable.Cell.lineText(`Percentile: ${percentile.toFixed(0)}`, tbl, { font: Tables.EnumTableValue.font }, Tables.EnumTableValue.cell),
    ];

    for (let idx = row.length; idx < tbl.numColumns; idx++)
        row.push(NTTable.Cell.lineText('', tbl));

    tbl.addRow(row);

    // --- PERCENTIEL BAR ---
    const W = NTUnit.multiply(30, charWidth);
    const H = NTUnit.multiply(1, charHeight);
    const NW = NTUnit.num(W);
    const NH = NTUnit.num(H);
    const canvas = new OffscreenCanvas(NW, NH);
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;
    if (!ctx)
        throw new Error('Cannot create offscreen canvas for confal percentile bar rendering');

    const grad = ctx.createLinearGradient(0, 0, NW, NH);
    grad.addColorStop(0.0, 'red');
    grad.addColorStop(0.5, 'rgb(255, 255, 255)');
    grad.addColorStop(1.0, 'rgb(  0,  0, 255)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, NW, NH);
    ctx.stroke();

    const MW = NW / 55;
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(NW * percentile / 100 - MW, 0, MW, NH);

    ctx.stroke();

    // @ts-ignore
    const blob = await canvas.convertToBlob();
    const imgBuf = await (blob as Blob).arrayBuffer();

    tbl.addRow([
        NTTable.Cell.lineText('', tbl),
        NTTable.Cell.image('png', imgBuf, tbl, { scale: 0.375 }, { colSpan: 3 })
    ]);
}

const GSMapping = GappedSemaphore.makeMapping([
    { from: 0, to: 0.3 }, { from: 0.6, to: 1.0 },
]);
function rmsdStatsRow(stats: StepRmsdStats[], tbl: NTTable, mIdx: number, charWidth: NTUnit, charHeight: NTUnit) {
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
        NTTable.Cell.lineText('RMSD [A]', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell), // TODO: Fix the encoding
        ...dataRows
    ]);

    // --- RELATIVE COUNTS LINE ---
    const rmsdCounts = stats.map(x => x.count);
    const rmsdTotal = rmsdCounts.reduce((p, c) => p + c, 0);

    const W = NTUnit.multiply(30, charWidth);
    const H = NTUnit.multiply(1, charHeight);
    const box = tbl.getBox(NTXYWH.create(NTUnit.zero(), NTUnit.zero(), W, H));
    let x = 0;
    const xywh = NTXYWH.create(NTUnit.zero(), NTUnit.zero(), NTUnit.zero(), H);
    for (let idx = 0; idx < rmsdCounts.length; idx++) {
        const w = rmsdCounts[idx] / rmsdTotal;
        xywh.x = NTUnit.multiply(x, NTUnit.from(NTCm(10)));
        xywh.width = NTUnit.multiply(w, NTUnit.from(NTCm(10)));
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
                root.lineText(`Model ${mNum}`, { hAlign: 'center', font: { style: 'bold' } });

            const tbl = root.table(1 + rmsdStats[0].length, { hAlign: 'center' });
            tbl.addRow([
                NTTable.Cell.lineText('NtC:', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
                NTTable.Cell.lineText(`Assigned: ${getCifValue(ctx.dnatcofication, NdbStructNtcOverall, 'num_classified') ?? Common.NA}`, tbl, { font: Tables.EnumTableValue.font }, Tables.EnumTableValue.cell),
                NTTable.Cell.lineText(`Close: ${getCifValue(ctx.dnatcofication, NdbStructNtcOverall, 'num_unclassified_rmsd_close') ?? Common.NA}`, tbl, { font: Tables.EnumTableValue.font }, Tables.EnumTableValue.cell),
                NTTable.Cell.lineText(`Unassigned: ${getCifValue(ctx.dnatcofication, NdbStructNtcOverall, 'num_unclassified') ?? Common.NA}`, tbl, { font: Tables.EnumTableValue.font }, Tables.EnumTableValue.cell),
            ]);

            rmsdStatsRow(rmsdStats[mIdx], tbl, mIdx, ctx.tDims.characterWidth, ctx.tDims.characterHeight);
            await averageConfalsRow(avg, confalPercentile(avg), tbl, ctx.tDims.characterWidth, ctx.tDims.characterHeight);

            // Why do we need two?
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
