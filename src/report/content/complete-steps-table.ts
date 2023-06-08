import { StepTable } from './util/step-table';
import { Report } from '../';
import { Layout } from '../layout';
import { Tables } from '../styling';
import { NTTable } from '../nottex/primitives';
import { Dnatcofication } from '../../dnatco/dnatcofication';

export namespace CompleteStepsTable {
    export function add<Output>(ctx: Report.Context<Output>) {
        const root = ctx.ntDoc;


        // --- HEADER ---
        Layout.sectionHeader('All dinucleotides', ctx);

        const hasMultipleModels = Dnatcofication.Structure.numberOfModels(ctx.dnatcofication) > 1;
        const tblStyle = StepTable.style(ctx);
        let tbl = root.table(5, tblStyle);
        tbl.addRow([
            NTTable.Cell.lineText('Chain', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
            NTTable.Cell.lineText('Step', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
            NTTable.Cell.lineText('NtC', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
            NTTable.Cell.lineText('CANA', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
            NTTable.Cell.lineText('RMSD', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
        ]);
        if (!StepTable.fill(tbl, hasMultipleModels, ctx))
            root.lineText('(Table is empty)', { hAlign: 'center', font: { style: 'italic' } });

        root.breakPage();

    }
}

