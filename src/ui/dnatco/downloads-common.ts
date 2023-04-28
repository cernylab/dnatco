import { Cif } from '../../cif';
import { Struct } from '../../cif/categories/struct';
import { NdbStructNtcStep, NdbStructNtcStepSummary } from '../../cif/categories/ndb-struct-ntc';
import { Dnatcofication } from "../../dnatco/dnatcofication";
import { Net } from '../../util/net';

export namespace Downloads {
    function mmCifName(d: Dnatcofication) {
        if (!d.hasTable(Struct))
            return 'dnatco_structure.cif';
        const col = d.table(Struct).entry_id;
        const entryId = Cif.Column.value(col, 0);
        return `${entryId}.cif`;
    }

    export function assignmentTable(d: Dnatcofication) {
        const steps = d.table(NdbStructNtcStep);
        const summary = d.table(NdbStructNtcStepSummary);
        const { label_asym_id_1, name } = steps;
        const { assigned_NtC, closest_NtC, assigned_CANA, closest_CANA } = summary;

        const chainColumn = {
            name: 'Chain',
            values: label_asym_id_1.values!.map(x => x),
        };
        const stepColumn = {
            name: 'Step',
            values: name.values!.map(x => x),
        };
        const assignedNtCColumn = {
            name: 'Assigned NtC',
            values: assigned_NtC.values!.map(x => x),
        };
        const closestNtCColumn = {
            name: 'Closest NtC',
            values: closest_NtC.values!.map(x => x),
        }
        const assignedCanaColumn = {
            name: 'Assigned CANA',
            values: assigned_CANA.values!.map(x => x),
        };
        const closestCanaColumn = {
            name: 'Closest CANA',
            values: closest_CANA.values!.map(x => x),
        };

        return [
            chainColumn, stepColumn, assignedNtCColumn, closestNtCColumn, assignedCanaColumn, closestCanaColumn
        ];
    }

    export function serveMmCif(d: Dnatcofication) {
        const filename = mmCifName(d);
        Net.serveFile('chemical/x-mmcif', d.rawCif(), filename);
    }
}
