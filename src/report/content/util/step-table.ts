import { niceStepName } from './';
import { Report } from '../../';
import { Tables } from '../../styling';
import { NTTable } from '../../nottex/primitives';
import { NTRgba } from '../../nottex/util';
import { NTMm, NTUnit } from '../../nottex/space';
import { Cif } from '../../../cif';
import { NdbStructNtcStep, NdbStructNtcStepSummary } from '../../../cif/categories/ndb-struct-ntc';
import { valueToSemaphore } from '../../../ui/dnatco/util';
import { nclr } from '../../../ui/util';

const NA = 'N/A';

export namespace StepTable {
    export function fill<Output>(tbl: NTTable, hasMultipleModels: boolean, ctx: Report.Context<Output>, options?: Partial<{ rmsdCutoff: number, filter: 'only-unassigned' | 'only-assigned' | 'all' }>) {
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

        const rmsdCutoff = options?.rmsdCutoff ?? 0;
        const filter = options?.filter ?? 'all';

        for (let row = 0; row < steps._rowCount; row++) {
            const assignedNtC = Cif.Column.value(assigned_NtC, row)!;
            if ((filter === 'only-unassigned' && assignedNtC !== 'NANT') || (filter === 'only-assigned' && assignedNtC === 'NANT'))
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

    function rmsdCellColor(rmsd: number) {
        const clr = valueToSemaphore(rmsd, 0.0, 1.0);
        return NTRgba(nclr(clr.r), nclr(clr.g), nclr(clr.b), 0.5);
    }

    export function style<Output>(ctx: Report.Context<Output>): NTTable.Options {
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
}
