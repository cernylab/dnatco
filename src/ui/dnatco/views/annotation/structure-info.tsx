import * as React from 'react';
import { EntitiesAndMolecules } from './entities-and-molecules';
import { View } from '../view';
import { Common } from '../../common';
import { getCifValue, niceCifDate } from '../../util';
import { CollapsibleVertical } from '../../../common/collapsible-vertical';
import { Link } from '../../../common/link';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { Cif } from '../../../../cif';
import { Citation } from '../../../../cif/categories/citation';
import { CitationAuthor } from '../../../../cif/categories/citation-author';
import { Em3dReconstruction } from '../../../../cif/categories/em-3d-reconstruction';
import { Exptl } from '../../../../cif/categories/experimental';
import { PdbxDatabaseStatus } from '../../../../cif/categories/pdbx-database-status';
import { Refine } from '../../../../cif/categories/refine';
import { Struct } from '../../../../cif/categories/struct';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { doiLink, pubmedLink, rcsbLink } from '../../../../util/resources';

function listAuthors(d: Dnatcofication) {
    if (!d.hasTable(CitationAuthor))
        return '';

    const authors = [];
    const { name, _rowCount } = d.table(CitationAuthor);
    for (let idx = 0; idx < _rowCount; idx++) {
        const n = Cif.Column.value(name, idx);
        if (n)
            authors.push(n);
    }
    return authors.join(', ');
}

function primaryPublication(d: Dnatcofication) {
    if (!d.hasTable(Citation))
        return undefined;

    const { id, title, pdbx_database_id_PubMed, pdbx_database_id_DOI } = d.table(Citation);
    if (!id.values)
        return undefined;

    let priIdx = id.values.indexOf('primary');
    if (priIdx === -1)
        priIdx = 0;

    return {
        title: Cif.Column.value(title, priIdx),
        pdbx_database_id_PubMed: Cif.Column.value(pdbx_database_id_PubMed, priIdx),
        pdbx_database_id_DOI: Cif.Column.value(pdbx_database_id_DOI, priIdx),
    }
}

function resolution(d: Dnatcofication) {
    const method = getCifValue(d, Exptl, 'method');
    if (Common.MethodsWithCommonResolution.includes(method)) {
        return `Low: ${getCifValue(d, Refine, 'ls_d_res_low')?.toFixed(3) ?? Common.NA}, High: ${getCifValue(d, Refine, 'ls_d_res_high')?.toFixed(3) ?? Common.NA}`;
    } else if (method === 'electron microscopy') {
        return `${getCifValue(d, Em3dReconstruction, 'resolution')?.toFixed(3) ?? Common.NA} (${getCifValue(d, Em3dReconstruction, 'resolution_method')})`;
    } else
        return Common.NA;
}

function structureId(d: Dnatcofication) {
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
        const priPub = primaryPublication(this.props.dnatcofication);
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
                            <NamedListItem name='Authors'>{listAuthors(this.props.dnatcofication)}</NamedListItem>
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
                            <NamedListItem name='Resolution'>{resolution(this.props.dnatcofication)}</NamedListItem>
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
