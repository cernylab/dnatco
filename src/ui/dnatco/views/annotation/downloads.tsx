import React from 'react';
import { View } from '../view';
import { DownloadButton } from '../../common';
import { Downloads as _Downloads } from '../../downloads-common';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { Net } from '../../../../util/net';
import { Serialization } from '../../../../util/serialization';

export function Downloads(props: View.Props) {
    return (
        <div>
            <NamedList rowSpacing='half'>
                <NamedListItem name='mmCIF file'>
                    <div style={{ width: '10em', height: '100%' }}>
                        <DownloadButton
                            caption='Download'
                            onClick={() => _Downloads.serveMmCif(props.dnatcofication)}
                        />
                    </div>
                </NamedListItem>
                <NamedListItem name='Table of assigned NtCs'>
                    <div style={{ display: 'flex', gap: 'var(--h2-gap)', width: '10em' }}>
                        <div style={{ flex: 1 }}>
                            <DownloadButton
                                caption='CSV'
                                onClick={() => {
                                    const t = _Downloads.assignmentTable(props.dnatcofication);
                                    const text = Serialization.table(t, 'csv');
                                    Net.serveFile('text/csv', text, `${props.dnatcofication.identifyingName}_assigned_ntcs.csv`);
                                }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <DownloadButton
                                caption='JSON'
                                onClick={() => {
                                    const t = _Downloads.assignmentTable(props.dnatcofication);
                                    const text = Serialization.table(t, 'json');
                                    Net.serveFile('application/json', text, `${props.dnatcofication.identifyingName}_assigned_ntcs.json`);
                                }}
                            />
                        </div>
                    </div>
                </NamedListItem>
            </NamedList>
        </div>
    );
}

export namespace Downloads {
    export const StepSwitcher = () => {}
}
