import React from 'react';
import { View } from '../view';
import { DownloadButton } from '../../common';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { Cif } from '../../../../cif';
import { NdbStructNtcStep, NdbStructNtcStepSummary } from '../../../../cif/categories/ndb-struct-ntc';
import { Struct } from '../../../../cif/categories/struct';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { Net } from '../../../../util/net';
import { Serialization } from '../../../../util/serialization';

function assignmentTable(d: Dnatcofication) {
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

export class Downloads extends View {
    private mmCifFilename() {
        if (!this.props.dnatcofication.hasTable(Struct))
            return 'dnatco_structure.cif';
        const col = this.props.dnatcofication.table(Struct).entry_id;
        const entryId = Cif.Column.value(col, 0);
        return `${entryId}.cif`;
    }

    private serveMmCif() {
        const filename = this.mmCifFilename();
        Net.serveFile('chemical/x-mmcif', this.props.dnatcofication.rawCif(), filename);
    }

    render() {
        return (
            <div>
                <NamedList>
                    <NamedListItem name='mmCIF file'>
                        <div style={{ width: '10em' }}>
                            <DownloadButton
                                caption='Download'
                                onClick={() => this.serveMmCif()}
                            />
                        </div>
                    </NamedListItem>
                    <NamedListItem name='Table of assigned NtCs'>
                        <div style={{ display: 'flex', gap: 'var(--h2-gap)', width: '10em' }}>
                            <div style={{ flex: 1 }}>
                                <DownloadButton
                                    caption='CSV'
                                    onClick={() => {
                                        const t = assignmentTable(this.props.dnatcofication);
                                        const text = Serialization.table(t, 'csv');
                                        Net.serveFile('text/csv', text, `${this.props.dnatcofication.identifyingName}_assigned_ntcs.csv`);
                                    }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <DownloadButton
                                    caption='JSON'
                                    onClick={() => {
                                        const t = assignmentTable(this.props.dnatcofication);
                                        const text = Serialization.table(t, 'json');
                                        Net.serveFile('application/json', text, `${this.props.dnatcofication.identifyingName}_assigned_ntcs.json`);
                                    }}
                                />
                            </div>
                        </div>
                    </NamedListItem>
                </NamedList>
            </div>
        );
    }
}
