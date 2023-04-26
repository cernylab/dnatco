import React from 'react';
import { AnglesLengthsByCompound } from './angles-lengths-by-compound';
import { AnglesLengthsByResidue } from './angles-lengths-by-residue';
import { AnglesLengthsCommon } from './angles-lengths-common';
import { View } from '../view';
import { Common } from '../../common';
import { ComboBox } from '../../../common/combo-box';
import { NamedList, NamedListItem } from '../../../common/named-list';

export function AnglesLengthsUpper(props: View.Props) {
    const [groupBy, setGroupBy] = React.useState('residue');

    return (
        <div style={ Common.VScrollJail }>
            <NamedList sizing='min-content' rowSpacing='half'>
                <NamedListItem name='Group by'>
                    <ComboBox
                        options={[
                            { caption: 'Residue', value: 'residue' },
                            { caption: 'Compound', value: 'compound' }
                        ]}
                        value={groupBy}
                        onChange={(v) => setGroupBy(v)}
                    />
                </NamedListItem>
            </NamedList>

            <div className='rdo-line-spacer' />

            {groupBy === 'residue' ? <AnglesLengthsByResidue {...props } /> : <AnglesLengthsByCompound {...props }/>}
        </div>
    );
}

export namespace AnglesLengthsUpper {
    export const SelectionDisplayer = AnglesLengthsCommon.SelectionDisplayer;
    export const SelectionMaker = AnglesLengthsCommon.SelectionMaker;
    export const unscrollableContainer = true;
}
