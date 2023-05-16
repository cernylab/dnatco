import * as React from 'react';
import { EntitiesAndMolecules } from './entities-and-molecules';
import { View } from '../view';
import { Common } from '../../common';
import { getCifValue, niceCifDate } from '../../util';
import * as SI from '../../../structure-info-util';
import { CollapsibleVertical } from '../../../common/collapsible-vertical';
import { Link } from '../../../common/link';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { Exptl } from '../../../../cif/categories/experimental';
import { PdbxDatabaseStatus } from '../../../../cif/categories/pdbx-database-status';
import { Refine } from '../../../../cif/categories/refine';
import { Struct } from '../../../../cif/categories/struct';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { doiLink, pubmedLink, rcsbLink } from '../../../../util/resources';

export function structureId(d: Dnatcofication) {
    const id = getCifValue(d, Struct, 'entry_id');
    if (!id)
        return Common.NA;

    return (
        <div>
            {id.toUpperCase()}
            {'\u00A0'}
            <Link url={rcsbLink(id)} newTab={true}>(RSCB)</Link>
        </div>
    );
}

export class StructureInfo extends View {
    render() {
        const priPub = SI.primaryPublication(this.props.dnatcofication);
        const pubmedHref = priPub?.pdbx_database_id_PubMed ? <Link url={pubmedLink(priPub.pdbx_database_id_PubMed)} newTab={true}>{priPub.pdbx_database_id_PubMed}</Link> : Common.NA;
        const doiHref = priPub?.pdbx_database_id_DOI ? <Link url={doiLink(priPub.pdbx_database_id_DOI)} newTab={true}>{priPub.pdbx_database_id_DOI}</Link> : Common.NA;

        return (
            <div>
                <NamedList>
                    <NamedListItem name='Structure ID'>{structureId(this.props.dnatcofication)}</NamedListItem>
                    <NamedListItem name='Structure title'>{getCifValue(this.props.dnatcofication, Struct, 'title') ?? Common.NA }</NamedListItem>
                    <NamedListItem name='Deposited to PDB'>{niceCifDate(getCifValue(this.props.dnatcofication, PdbxDatabaseStatus, 'recvd_initial_deposition_date'))}</NamedListItem>
                </NamedList>
                <div className='rdo-line-spacer' />
                <CollapsibleVertical
                    header='Entities and Molecules'
                >
                    <div className='rdo-offset'>
                        <EntitiesAndMolecules d={this.props.dnatcofication} />
                    </div>
                </CollapsibleVertical>
                <CollapsibleVertical
                    header='Literature'
                >
                    <div className='rdo-offset'>
                        <NamedList>
                            <NamedListItem name='Publication title'>{priPub?.title ?? Common.NA}</NamedListItem>
                            <NamedListItem name='Authors'>{SI.listAuthors(this.props.dnatcofication)}</NamedListItem>
                            <NamedListItem name='PubMed'>{pubmedHref}</NamedListItem>
                            <NamedListItem name='DOI'>{doiHref}</NamedListItem>
                        </NamedList>
                    </div>
                </CollapsibleVertical>
                <CollapsibleVertical
                    header='Experimental'
                >
                    <div className='rdo-offset'>
                        <NamedList>
                            <NamedListItem name='Method'>{getCifValue(this.props.dnatcofication, Exptl, 'method') ?? Common.NA}</NamedListItem>
                            <NamedListItem name='Resolution'>{SI.resolution(this.props.dnatcofication)}</NamedListItem>
                            <NamedListItem name='R-free'>{getCifValue(this.props.dnatcofication, Refine, 'ls_R_factor_R_free')?.toFixed(3) ?? Common.NA}</NamedListItem>
                        </NamedList>
                    </div>
                </CollapsibleVertical>
            </div>
        );
    }
}

export namespace StructureInfo {
    export const StepSwitcher = () => {}
}
