import * as React from 'react';
import { View } from '../view';
import { NamedList } from '../../../common/named-list';
import { PushButton } from '../../../common/push-button';
import { Cif } from '../../../../cif';
import { Struct } from '../../../../cif/categories/struct';
import { Net } from '../../../../util/net';

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
                <NamedList
                    items={[
                        {
                            name: 'mmCIF file',
                            value:
                                <div style={{ width: '10em' }}>
                                    <PushButton
                                        caption='Download'
                                        onClick={() => this.serveMmCif()}
                                    />
                                </div>
                        }
                    ]}
                    vcentered={true}
                />
            </div>
        );
    }
}
