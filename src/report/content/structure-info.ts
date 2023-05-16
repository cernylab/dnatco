import { Report } from '../';
import { Layout } from '../layout';
import { Fonts, Tables } from '../styling';
import { NTTable } from '../nottex/primitives';
import { NTUnit } from '../nottex/space';
import { Entity } from '../../cif/categories/entity';
import { Exptl } from '../../cif/categories/experimental';
import { PdbxDatabaseStatus } from '../../cif/categories/pdbx-database-status';
import { Refine } from '../../cif/categories/refine';
import { Common } from '../../ui/dnatco/common';
import { getCifValue, niceCifDate } from '../../ui/dnatco/util';
import * as SI from '../../ui/structure-info-util';

export namespace StructureInfo {
    export function add<Output>(ctx: Report.Context<Output>) {
        const root = ctx.ntDoc;

        // --- HEADER ---
        Layout.sectionHeader('Structure information', ctx);

        // --- SUMMARY ---
        let tbl = root.table(2);
        tbl.addRow([
            NTTable.Cell.lineText('Structure ID:', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
            NTTable.Cell.lineText(ctx.dnatcofication.pdbId, tbl, { font: Tables.EnumTableValue.font }, Tables.EnumTableValue.cell )
        ]);
        tbl.addRow([
            NTTable.Cell.lineText('Structure title:', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
            NTTable.Cell.paragraphText(
                ctx.dnatcofication.identifyingTitle ?? Common.NA,
                tbl,
                { maxWidth: NTUnit.multiply(50, ctx.tDims.characterWidth), font: Tables.EnumTableValue.font },
                Tables.EnumTableValue.cell
            )
        ]);
        tbl.addRow([
            NTTable.Cell.lineText('Deposited to PDB:', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
            NTTable.Cell.lineText(
                niceCifDate(getCifValue(ctx.dnatcofication, PdbxDatabaseStatus, 'recvd_initial_deposition_date')),
                tbl,
                { font: Tables.EnumTableValue.font },
                Tables.EnumTableValue.cell
            )
        ]);
        root.breakLine();

        // --- MOLECULAR CONTENT ---
        root.lineText('Molecular content of the structure', { font: Fonts.SubsectionCaption });
        tbl = root.table(4);
        tbl.addRow([
            NTTable.Cell.lineText('Entity ID', tbl, { font: Tables.HeaderFont }),
            NTTable.Cell.lineText('Entity type', tbl, { font: Tables.HeaderFont }),
            NTTable.Cell.lineText('Molecule name', tbl, { font: Tables.HeaderFont }),
            NTTable.Cell.lineText('Count', tbl, { font: Tables.HeaderFont }),
        ]);
        const { id, pdbx_description, pdbx_number_of_molecules, type, _rowCount } = ctx.dnatcofication.table(Entity);
        for (let row = 0; row < _rowCount; row++) {
            const _id = id.values?.at(row);
            if (_id === undefined)
                continue;

            const desc = pdbx_description.values?.at(row) ?? Common.NA;
            const _type = type.values?.at(row) ?? Common.NA;
            const nMolecules = pdbx_number_of_molecules.values?.at(row) ?? -1;

            tbl.addRow([
                NTTable.Cell.lineText(_id, tbl, {}, Tables.TextCell),
                NTTable.Cell.lineText(_type, tbl, {}, Tables.TextCell),
                NTTable.Cell.paragraphText(desc, tbl, { maxWidth: NTUnit.multiply(40, ctx.tDims.characterWidth), breakWords: true }, Tables.TextCell),
                NTTable.Cell.lineText(nMolecules.toString(), tbl, { hAlign: 'right' }, Tables.NumCell),
            ]);
        }
        root.breakLine();

        // --- LITERATURE ---
        // TODO: Some of the content could/should be hyperlink. NotTeX currently does not support hyperlinks in tables.
        const priPub = SI.primaryPublication(ctx.dnatcofication);
        root.lineText('Literature', { font: Fonts.SubsectionCaption });
        tbl = root.table(2);
        tbl.addRow([
            NTTable.Cell.lineText('Publication title:', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
            NTTable.Cell.paragraphText(priPub?.title ?? Common.NA, tbl, { font: Tables.EnumTableValue.font, maxWidth: NTUnit.multiply(50, ctx.tDims.characterWidth) }, Tables.EnumTableValue.cell),
        ]);
        tbl.addRow([
            NTTable.Cell.lineText('Authors:', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
            NTTable.Cell.paragraphText(SI.listAuthors(ctx.dnatcofication), tbl, { font: Tables.EnumTableValue.font, maxWidth: NTUnit.multiply(50, ctx.tDims.characterWidth) }, Tables.EnumTableValue.cell)
        ]);
        tbl.addRow([
            NTTable.Cell.lineText('PubMed:', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
            NTTable.Cell.lineText(priPub?.pdbx_database_id_PubMed?.toString() ?? Common.NA, tbl, { font: Tables.EnumTableValue.font }, Tables.EnumTableValue.cell)
        ]);
        tbl.addRow([
            NTTable.Cell.lineText('DOI:', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
            NTTable.Cell.lineText(priPub?.pdbx_database_id_DOI ?? Common.NA, tbl, { font: Tables.EnumTableValue.font }, Tables.EnumTableValue.cell)
        ]);
        root.breakLine();

        // --- EXPERIMENTAL ---
        root.lineText('Experimental', { font: Fonts.SubsectionCaption });
        tbl = root.table(2);
        tbl.addRow([
            NTTable.Cell.lineText('Method:', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
            NTTable.Cell.lineText(getCifValue(ctx.dnatcofication, Exptl, 'method') ?? Common.NA, tbl, { font: Tables.EnumTableValue.font }, Tables.EnumTableName.cell)
        ]);
        tbl.addRow([
            NTTable.Cell.lineText('Resolution:', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
            NTTable.Cell.lineText(SI.resolution(ctx.dnatcofication), tbl, { font: Tables.EnumTableValue.font }, Tables.EnumTableValue.cell)
        ]);
        tbl.addRow([
            NTTable.Cell.lineText('R-free:', tbl, { font: Tables.EnumTableName.font }, Tables.EnumTableName.cell),
            NTTable.Cell.lineText(getCifValue(ctx.dnatcofication, Refine, 'ls_R_factor_R_free')?.toFixed(3) ?? Common.NA, tbl, { font: Tables.EnumTableValue.font }, Tables.EnumTableValue.cell)
        ]);

        root.breakPage();
    }
}
