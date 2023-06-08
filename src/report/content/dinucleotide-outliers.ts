import { StepTable } from './util/step-table';
import { Report } from '../';
import { Layout } from '../layout';
import { Tables } from '../styling';
import { NTTable } from '../nottex/primitives';
import { Dnatcofication } from '../../dnatco/dnatcofication';

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

        const hasMultipleModels = Dnatcofication.Structure.numberOfModels(ctx.dnatcofication) > 1;
        const tblStyle = StepTable.style(ctx);

        // --- TABLE OF ALL UNASSIGNED STEPS ---
        let tbl = root.table(5, tblStyle);
        tbl.addRow([
            NTTable.Cell.lineText('Chain', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
            NTTable.Cell.lineText('Step', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
            NTTable.Cell.lineText('NtC', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
            NTTable.Cell.lineText('CANA', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
            NTTable.Cell.lineText('RMSD', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
        ]);
        if (!StepTable.fill(tbl, hasMultipleModels, ctx, { filter: 'only-unassigned' }))
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
        if (!StepTable.fill(tbl, hasMultipleModels, ctx, { rmsdCutoff: ctx.dnatcofication.closeEnoughRmsd, filter: 'only-unassigned' }))
            root.lineText('(Table is empty)', { hAlign: 'center', font: { style: 'italic' } });

        root.breakPage();
    }
}
