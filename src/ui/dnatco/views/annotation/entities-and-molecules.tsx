import React from 'react';
import { Common } from '../../common';
import { CollapsibleVertical } from '../../../common/collapsible-vertical';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { Entity, EntityPoly } from '../../../../cif/categories/entity';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';

function moleculesInEntity(entityId: string, entityType: string, nMolecules: number, d: Dnatcofication) {
    if (entityType !== 'polymer')
        return <div>Molecules: {nMolecules > 0 ? nMolecules : Common.NA}</div>;

    const { entity_id, type, pdbx_strand_id } = d.table(EntityPoly);
    const row = entity_id.values?.findIndex((id) => id === entityId) ?? -1;
    if (row < 0)
        return <div>Information about molecules is not available</div>;

    return (
        <div>
            <CollapsibleVertical
                header='Molecules'
            >
                <NamedList>
                    <NamedListItem name='Type'>{type.values?.at(row) ?? Common.NA}</NamedListItem>
                    <NamedListItem name='Strand IDs'>{pdbx_strand_id.values?.at(row) ?? Common.NA}</NamedListItem>
                    <NamedListItem name='Count'>{nMolecules ? nMolecules : Common.NA}</NamedListItem>
                </NamedList>
            </CollapsibleVertical>
            <div className='rdo-line-spacer' />
        </div>
    );
}

function entities(d: Dnatcofication) {
    const entities: JSX.Element[] = [];
    const { id, pdbx_description, pdbx_number_of_molecules, type, _rowCount } = d.table(Entity);

    if (!id.values)
        return entities;

    for (let row = 0; row < _rowCount; row++) {
        const _id = id.values!.at(row)!;
        const desc = pdbx_description.values?.at(row) ?? Common.NA;
        const _type = type.values?.at(row) ?? Common.NA;
        const nMolecules = pdbx_number_of_molecules.values?.at(row) ?? -1;

        entities.push(
            <NamedListItem
                name={_id}
            >
                <div>{desc}</div>
                {moleculesInEntity(_id, _type, nMolecules, d)}
            </NamedListItem>
        );
    }

    return entities;
}

export function EntitiesAndMolecules(props: { d: Dnatcofication }) {
    return (
        <div>
            <NamedList>
                {...entities(props.d)}
            </NamedList>
        </div>
    );
}
