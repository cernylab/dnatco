import { Report } from '../../';
import { Colors, Fonts, Tables } from '../../styling';
import { NTDocument } from '../../nottex/document';
import { NTTable } from '../../nottex/primitives';
import { NTUnit, NTXYWH } from '../../nottex/space';
import { ALM } from '../../../dnatco/alm';
import { Triplet } from '../../../dnatco/angles-lengths/angles';
import { isShiftedName, unshiftName } from '../../../dnatco/angles-lengths/atoms';
import { AnglesLengths } from '../../../dnatco/angles-lengths';
import { Measurements } from '../../../dnatco/angles-lengths/measurements';
import { ByResidueHelpers } from '../../../dnatco/angles-lengths/helpers';
import { Pair } from '../../../dnatco/angles-lengths/lengths';
import { AngstromSignChar } from '../../../util';
import { colorToRgb, nrgba } from '../../../util/colors';
import { M } from '../../../util/math';
import { AnglesLengthsDisplayOrder } from '../../../ui/dnatco/views/validation/angles-lengths-display-order';
import { Dnatcofication, MappedNaval } from 'src/dnatco/dnatcofication';

type AngleLengthToDraw<BL extends (Measurements.BondAngle | Measurements.BondLength)> = {
    bond: BL,
    residue: Measurements.Residue,
    maybeBin: ALM.MaybeBin,
    pGroup: AnglesLengths.PGroup
};

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

function makeBondName(bond: Pair | Triplet) {
    const toks = bond.map(x => isShiftedName(x) ? `${unshiftName(x)}(-1)` : x);
    return toks.join('-');
}

function residueName(r: Measurements.Residue) {
    return `${r.authChain} ${r.compound}${r.authSeqId}${r.insCode ? r.insCode : ''}${r.altId ? `alt. ${r.altId}` : ''}`;
}

function drawAnglesLengths<Output, BL extends (Measurements.BondAngle | Measurements.BondLength), G extends keyof ByResidueHelpers.GatherWorst>(
    gathered: G,
    naval: MappedNaval,
    metrics: 'naval' | 'prosco',
    angleLengthData: AngleLengthToDraw<BL>[],
    root: NTDocument<Output>,
    ctx: Report.Context<Output>
) {
    const tbl = root.table(5, { ...Tables.EnumTable(ctx.tDims.characterWidth, ctx.tDims.characterHeight, ctx.mode), hAlign: ctx.mode === 'textual' ? 'left' : 'center' });

    tbl.addRow([
        NTTable.Cell.lineText('Residue', tbl, { font: Tables.HeaderFont }),
        NTTable.Cell.lineText('', tbl, { font: Tables.HeaderFont }),
        NTTable.Cell.lineText('Atoms', tbl, { font: Tables.HeaderFont }),
        NTTable.Cell.lineText(gathered === 'lengths' ? `Length [${AngstromSignChar}]` : 'Angle [\u00B0]', tbl, { font: Tables.HeaderFont }),
        NTTable.Cell.lineText('Probability', tbl, { font: Tables.HeaderFont }),
    ]);

    const xywh = NTXYWH.create(NTUnit.zero(), NTUnit.zero(), NTUnit.multiply(1, ctx.tDims.characterWidth), ctx.tDims.characterHeight);
    for (const al of angleLengthData) {
        let rgb;
        if (metrics === 'naval') {
            let nrankCls;
            if (gathered === 'lengths') {
                const bl = al.bond as Measurements.BondLength;
                const ni = AnglesLengths.navalBond(naval, al.residue, bl.pair);
                const nrank = AnglesLengths.lengthNavalRanking(al.residue.compound, bl);
                nrankCls = AnglesLengths.navalRankingClass(bl.length, nrank, ni.csdPreferredLeft, ni.csdPreferredRight, AnglesLengths.lengthAverages(al.residue.compound, bl.pair));
            } else {
                const ba = al.bond as Measurements.BondAngle;
                const ni = AnglesLengths.navalAngle(naval, al.residue, ba.triplet);
                const nrank = AnglesLengths.angleNavalRanking(al.residue.compound, ba);
                nrankCls = AnglesLengths.navalRankingClass(ba.angle, nrank, ni.csdPreferredLeft, ni.csdPreferredRight, AnglesLengths.angleAverages(al.residue.compound, ba.triplet));
            }

            rgb = colorToRgb(AnglesLengths.navalRankingClassColor(nrankCls));
        } else {
            rgb = colorToRgb(al.pGroup ? AnglesLengths.pGroupColor(al.pGroup.pGroup) : AnglesLengths.outlierColor());
        }
        const clr = nrgba(rgb);

        const clrCell = ctx.mode === 'textual'
            ? NTTable.Cell.lineText(Colors.colorToGlyph(rgb), tbl)
            : NTTable.Cell.rect(xywh, { color: clr });
        tbl.addRow([
            NTTable.Cell.lineText(residueName(al.residue), tbl),
            clrCell,
            NTTable.Cell.lineText(makeBondName(gathered === 'lengths' ? (al.bond as Measurements.BondLength).pair : (al.bond as Measurements.BondAngle).triplet), tbl),
            NTTable.Cell.lineText(gathered === 'lengths' ? drawLength(al.bond as Measurements.BondLength) : drawAngle(al.bond as Measurements.BondAngle), tbl, { font: Fonts.Monospace, hAlign: 'right' }),
            NTTable.Cell.lineText(drawProsco(al.maybeBin), tbl, { font: Fonts.Monospace, hAlign: 'right' }),
        ]);
    }

    root.breakLine();
}

function gatherAllAngles(residues: Measurements.Residue[], stats: ALM.ResidueStats[]) {
    const anglesToDraw = new Array<AngleLengthToDraw<Measurements.BondAngle>>();

    for (let idx = 0; idx < residues.length; idx++) {
        const r = residues[idx];
        const s = stats[idx];

        const displayOrder = AnglesLengthsDisplayOrder.Angles[r.compound];
        for (const pairTag of displayOrder) {
            for (let bdx = 0; bdx < r.bondAngles.length; bdx++) {
                const b = r.bondAngles[bdx];
                if (b.tag === pairTag) {
                    anglesToDraw.push({
                        bond: b,
                        residue: r,
                        maybeBin: s.angles[bdx].bin,
                        pGroup: s.angles[bdx].pGroup
                    });

                    break;
                }
            }
        }
    }

    return anglesToDraw;
}

function gatherAllLengths(residues: Measurements.Residue[], stats: ALM.ResidueStats[]) {
    const lengthsToDraw = new Array<AngleLengthToDraw<Measurements.BondLength>>();

    for (let idx = 0; idx < residues.length; idx++) {
        const r = residues[idx];
        const s = stats[idx];

        const displayOrder = AnglesLengthsDisplayOrder.Lengths[r.compound];
        for (const pairTag of displayOrder) {
            for (let bdx = 0; bdx < r.bondLengths.length; bdx++) {
                const b = r.bondLengths[bdx];
                if (b.tag === pairTag) {
                    lengthsToDraw.push({
                        bond: b,
                        residue: r,
                        maybeBin: s.lengths[bdx].bin,
                        pGroup: s.lengths[bdx].pGroup
                    });

                    break;
                }
            }
        }
    }

    return lengthsToDraw;
}

export function drawAllAnglesLengths<Output, G extends keyof ByResidueHelpers.GatherWorst>(
    gather: G,
    residues: Measurements.Residue[],
    d: Dnatcofication,
    metrics: 'naval' | 'prosco',
    stats: ALM.ResidueStats[],
    root: NTDocument<Output>,
    ctx: Report.Context<Output>
) {
    if (gather === 'angles') {
        const anglesToDraw = gatherAllAngles(residues, stats);
        drawAnglesLengths(gather, d.data.naval, metrics, anglesToDraw, root, ctx);
    } else {
        const lengthsToDraw = gatherAllLengths(residues, stats);
        drawAnglesLengths(gather, d.data.naval, metrics, lengthsToDraw, root, ctx);
    }
}

export function drawWorstAnglesLengths<Output, G extends keyof ByResidueHelpers.GatherWorst>(
    gather: G,
    d: Dnatcofication,
    residues: Measurements.Residue[],
    stats: ALM.ResidueStats[],
    metrics: 'naval' | 'prosco',
    threshold: string,
    root: NTDocument<Output>,
    ctx: Report.Context<Output>
) {
    const worst = ByResidueHelpers.gatherWorst(d.data.naval, metrics, gather, residues, stats, threshold, 'all');

    drawAnglesLengths(gather, d.data.naval, metrics, worst, root, ctx);
}
