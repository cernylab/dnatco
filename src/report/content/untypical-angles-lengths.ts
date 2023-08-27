import { Report } from '../';
import { Layout } from '../layout';
import { Colors, Fonts, Tables } from '../styling';
import { NTDocument } from '../nottex/document';
import { NTTable } from '../nottex/primitives';
import { NTUnit, NTXYWH } from '../nottex/space';
import { NTRgba } from '../nottex/util';
import { AnglesLengths } from '../../dnatco/angles-lengths';
import { Triplet } from '../../dnatco/angles-lengths/angles';
import { isShiftedName, unshiftName } from '../../dnatco/angles-lengths/atoms';
import { ByResidueHelpers } from '../../dnatco/angles-lengths/helpers';
import { Pair } from '../../dnatco/angles-lengths/lengths';
import { Measurements } from '../../dnatco/angles-lengths/measurements';
import { Dnatcofication } from '../../dnatco/dnatcofication';
import { ALM } from '../../dnatco/alm';
import { AngstromSignChar } from '../../util';
import { colorToRgb, nrgb } from '../../util/colors';
import { M } from '../../util/math';
import { InvalidChain } from '../../util/structure-selection';

function drawAngle(angle: Measurements.BondAngle) {
    return `${M.r2d(angle.angle).toFixed(2)}\u00B0`;
}

function drawLength(length: Measurements.BondLength) {
    return `${length.length.toFixed(3)} ${AngstromSignChar}`;
}

function drawProsco(bin: ALM.MaybeBin) {
    if (bin === 'no-data')
        return 'No data';
    else if (bin === 'below')
        return 'N/A (<)';
    else if (bin === 'above')
        return 'N/A (>)';
    else
        return `${fmtDecimal(bin.prosco * 100, 1)} %`;
}


// Yucky copy-pasta from AnglesLengthsCommon
function fmtDecimal(n: number, decimals: number) {
    const fvdd = M.firstValidDecimalDigit(n);
    return fvdd > decimals ? n.toExponential(decimals - 1) : n.toFixed(decimals);
}

function drawWorst<Output, G extends keyof ByResidueHelpers.GatherWorst>(gather: G, residues: Measurements.Residue[], stats: ALM.ResidueStats[], threshold: number|'outlier', root: NTDocument<Output>, ctx: Report.Context<Output>) {
    const worst = ByResidueHelpers.gatherWorst(gather, residues, stats, threshold, 'all');

    const rectClr = colorToRgb(AnglesLengths.outlierColor());
    const rectNClr = nrgb(rectClr);
    const ntrgba = NTRgba(rectNClr.r, rectNClr.g, rectNClr.b);
    const tbl = root.table(5, { ...Tables.EnumTable(ctx.tDims.characterWidth, ctx.tDims.characterHeight, ctx.mode), hAlign: ctx.mode === 'textual' ? 'left' : 'center' });

    tbl.addRow([
        NTTable.Cell.lineText('Residue', tbl, { font: Tables.HeaderFont }),
        NTTable.Cell.lineText('', tbl, { font: Tables.HeaderFont }),
        NTTable.Cell.lineText('Atoms', tbl, { font: Tables.HeaderFont }),
        NTTable.Cell.lineText(gather === 'lengths' ? `Length [${AngstromSignChar}]` : 'Angle [\u00B0]', tbl, { font: Tables.HeaderFont }),
        NTTable.Cell.lineText('Probability', tbl, { font: Tables.HeaderFont }),
    ]);

    const xywh = NTXYWH.create(NTUnit.zero(), NTUnit.zero(), NTUnit.multiply(1, ctx.tDims.characterWidth), ctx.tDims.characterHeight);
    for (const w of worst) {
        const clrCell = ctx.mode === 'textual'
            ? NTTable.Cell.lineText(Colors.colorToGlyph(rectClr), tbl)
            : NTTable.Cell.rect(xywh, { color: ntrgba });
        tbl.addRow([
            NTTable.Cell.lineText(residueName(w.residue), tbl),
            clrCell,
            NTTable.Cell.lineText(makeBondName(gather === 'lengths' ? (w.bond as Measurements.BondLength).pair : (w.bond as Measurements.BondAngle).triplet), tbl),
            NTTable.Cell.lineText(gather === 'lengths' ? drawLength(w.bond as Measurements.BondLength) : drawAngle(w.bond as Measurements.BondAngle), tbl, { font: Fonts.Monospace, hAlign: 'right' }),
            NTTable.Cell.lineText(drawProsco(w.maybeBin), tbl, { font: Fonts.Monospace, hAlign: 'right' }),
        ]);
    }

    root.breakLine();
}

function makeBondName(bond: Pair | Triplet) {
    const toks = bond.map(x => isShiftedName(x) ? `${unshiftName(x)}(-1)` : x);
    return toks.join('-');
}

function residueName(r: Measurements.Residue) {
    return `${r.authChain} ${r.compound}${r.authSeqId}${r.insCode ? r.insCode : ''}${r.altId ? `alt. ${r.altId}` : ''}`;
}

export namespace UntypicalAnglesLengths {
    export function add<Output>(ctx: Report.Context<Output>) {
        const root = ctx.ntDoc;

        Layout.sectionHeader('Most untypical bond Lengths & Angles', ctx);
        root.paragraphText('List of bond lengths and angles within the outlier probability category', { hAlign: ctx.mode === 'textual' ? 'left' : 'center' });

        const numModels = Dnatcofication.Structure.numberOfModels(ctx.dnatcofication);
        const alm = ctx.dnatcofication.data.almByResidue;

        for (let mIdx = 0; mIdx < numModels; mIdx++) {
            const indices = ByResidueHelpers.selectionToIndices(ctx.dnatcofication, mIdx, InvalidChain);
            const residues = indices.map((x) => alm.residues[x]);
            const residueStats = indices.map((x) => alm.stats[x]);

            if (numModels > 1)
                root.lineText(`Model ${ctx.dnatcofication.data.structures[0].models[mIdx].num}`, { font: Fonts.SubsectionCaption, hAlign: ctx.mode === 'textual' ? 'left' : 'center' });

            // --- LENGTHS ---
            root.lineText('Lengths', { font: { style: 'bold' }, hAlign: ctx.mode === 'textual' ? 'left' : 'center' });
            drawWorst('lengths', residues, residueStats, 'outlier', ctx.ntDoc, ctx);

            // --- ANGLES ---
            root.lineText('Angles', { font: { style: 'bold' }, hAlign: ctx.mode === 'textual' ? 'left' : 'center' });
            drawWorst('angles', residues, residueStats, 'outlier', ctx.ntDoc, ctx);
        }

        root.paragraphText('Detailed validation of valence geometry (bond lengths and angles) is available at:', { dontSeparate: true });
        const url = `${ctx.href}/app/dnatco/validation/angles-lengths?cifcode=${ctx.dnatcofication.pdbId.toLowerCase()}`;
        root.hyperlink(url, url);

        root.breakPage();
    }
}
