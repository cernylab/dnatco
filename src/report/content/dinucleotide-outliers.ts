import { niceStepName } from './util';
import { Report } from '../';
import { Layout } from '../layout';
import { Tables } from '../styling';
import { NTTable } from '../nottex/primitives';
import { NTRgba } from '../nottex/util';
import { NTMm, NTUnit } from '../nottex/space';
import { Cif } from '../../cif';
import { NdbStructNtcStep, NdbStructNtcStepSummary } from '../../cif/categories/ndb-struct-ntc';
import { Dnatcofication } from '../../dnatco/dnatcofication';
import { valueToSemaphore } from '../../ui/dnatco/util';
import { nclr } from '../../ui/util';

const NA = 'N/A';

function fillNtCTable<Output>(tbl: NTTable, hasMultipleModels: boolean, ctx: Report.Context<Output>, rmsdCutoff?: number) {
    const steps = ctx.dnatcofication.table(NdbStructNtcStep);
    const summary = ctx.dnatcofication.table(NdbStructNtcStepSummary);
    const {
        PDB_model_number, label_asym_id_1, auth_asym_id_1,
        auth_seq_id_1, auth_seq_id_2,
        label_comp_id_1, label_comp_id_2,
        label_alt_id_1, label_alt_id_2,
        PDB_ins_code_1, PDB_ins_code_2,
    } = steps;
    const {
        assigned_NtC, closest_NtC, closest_CANA, cartesian_rmsd_closest_NtC_representative
    } = summary;

    for (let row = 0; row < steps._rowCount; row++) {
        const assignedNtC = Cif.Column.value(assigned_NtC, row)!;
        if (assignedNtC !== 'NANT')
            continue;

        const rmsd = Cif.Column.value(cartesian_rmsd_closest_NtC_representative, row)!;
        if (rmsdCutoff && rmsd > rmsdCutoff)
            continue;

        const modelNo = Cif.Column.value(PDB_model_number, row) ?? 1;
        const chain = Cif.Column.value(label_asym_id_1, row) ?? NA;
        const authChain = Cif.Column.value(auth_asym_id_1, row) ?? chain;

        const compOne = Cif.Column.value(label_comp_id_1, row)!;
        const compTwo = Cif.Column.value(label_comp_id_2, row)!;

        const seqIdOne = Cif.Column.value(auth_seq_id_1, row)!;
        const seqIdTwo = Cif.Column.value(auth_seq_id_2, row)!;

        const altIdOne = Cif.Column.value(label_alt_id_1, row) ?? '';
        const altIdTwo = Cif.Column.value(label_alt_id_2, row) ?? '';

        const insCodeOne = Cif.Column.value(PDB_ins_code_1, row) ?? '';
        const insCodeTwo = Cif.Column.value(PDB_ins_code_2, row) ?? '';

        const closestNtC = Cif.Column.value(closest_NtC, row)!;
        const closestCANA = Cif.Column.value(closest_CANA, row)!;

        tbl.addRow([
            NTTable.Cell.lineText(`${authChain} (Cif: ${chain})`, tbl, { font: Tables.EnumTableValue.font }, Tables.EnumTableValue.cell),
            NTTable.Cell.lineText(
                niceStepName(modelNo, hasMultipleModels, compOne, seqIdOne, altIdOne, insCodeOne, compTwo, seqIdTwo, altIdTwo, insCodeTwo),
                tbl,
                { font: Tables.EnumTableValue.font },
                Tables.EnumTableValue.cell
            ),
            NTTable.Cell.lineText(closestNtC, tbl, { font: Tables.EnumTableValue.font }, Tables.EnumTableValue.cell),
            NTTable.Cell.lineText(closestCANA, tbl, { font: Tables.EnumTableValue.font }, Tables.EnumTableValue.cell),
            NTTable.Cell.lineText(
                rmsd.toFixed(3),
                tbl,
                {
                    font: Tables.EnumTableValue.font,
                    hAlign: 'right'
                },
                {
                    ...Tables.EnumTableValue.cell,
                    backgroundColor: ctx.mode === 'textual' ? 'none' : rmsdCellColor(rmsd),
                }
            )
        ]);
    }

    return tbl.rows.length > 1;
}

function NtCTableStyle<Output>(ctx: Report.Context<Output>): NTTable.Options {
    if (ctx.mode === 'textual') {
        return {
            ...Tables.EnumTable(ctx.tDims.characterWidth, ctx.tDims.characterHeight, 'textual'),
            hAlign: 'left'
        };
    } else {
        return {
            border: NTMm(0.33),
            borderColor: NTRgba(0, 0, 0),
            hAlign: 'center',
            padding: {
                top: NTUnit.multiply(0.5, ctx.tDims.characterHeight),
                left: NTUnit.multiply(0.5, ctx.tDims.characterWidth),
                right: NTUnit.multiply(0.5, ctx.tDims.characterWidth),
                bottom: NTUnit.multiply(0.5, ctx.tDims.characterHeight),
            },
        };
    }
}

function rmsdCellColor(rmsd: number) {
    const clr = valueToSemaphore(rmsd, 0.0, 1.0);
    return NTRgba(nclr(clr.r), nclr(clr.g), nclr(clr.b), 0.5);
}

export namespace DinucleotideOutliers {
    export async function add<Output>(ctx: Report.Context<Output>) {
        const root = ctx.ntDoc;

        // --- HEADER FOR ALL UNASSIGNED ---
        Layout.sectionHeader('Dinucleotide outliers', ctx);
        root.paragraphText(
            `List all unassigned (NANT, NAN) dinucleotide steps in structure ${ctx.dnatcofication.pdbId}. ` +
            'NtC, resp. CANA classes in the table below represent the closest NtC, resp. CANA class ' +
            'that would be assigned to the given dinucleotide if all assignment criteria were met.'
        );

        const numModels = Dnatcofication.Structure.numberOfModels(ctx.dnatcofication);
        const hasMultipleModels = numModels > 1;
        const tblStyle = NtCTableStyle(ctx);

        // --- TABLE OF ALL UNASSIGNED STEPS ---
        let tbl = root.table(5, tblStyle);
        tbl.addRow([
            NTTable.Cell.lineText('Chain', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
            NTTable.Cell.lineText('Step', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
            NTTable.Cell.lineText('NtC', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
            NTTable.Cell.lineText('CANA', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
            NTTable.Cell.lineText('RMSD', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
        ]);
        if (!fillNtCTable(tbl, hasMultipleModels, ctx))
            root.lineText('(Table is empty)', { hAlign: 'center', font: { style: 'italic' } });

        root.breakPage();

        // --- HEADER FOR IMPROVABLE ---
        Layout.sectionHeader('Improvable dinucleotide outliers', ctx);
        root.paragraphText(
            `List of unassigned (NANT, NAN) dinucleotide steps in structure ${ctx.dnatcofication.pdbId} ` +
            'that are considered sufficiently close to a representative from the Golden Set. Closeness criterion ' +
            `is defined as RMSD value less or equal to ${ctx.dnatcofication.closeEnoughRmsd} \u00C5.`
        );

        // --- TABLE OF IMPROVABLE STEPS ---
        tbl = root.table(5, tblStyle);
        tbl.addRow([
            NTTable.Cell.lineText('Chain', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
            NTTable.Cell.lineText('Step', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
            NTTable.Cell.lineText('NtC', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
            NTTable.Cell.lineText('CANA', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
            NTTable.Cell.lineText('RMSD', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
        ]);
        if (!fillNtCTable(tbl, hasMultipleModels, ctx, ctx.dnatcofication.closeEnoughRmsd))
            root.lineText('(Table is empty)', { hAlign: 'center', font: { style: 'italic' } });

        root.breakPage();
    }
}
