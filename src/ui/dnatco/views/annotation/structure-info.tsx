import * as React from 'react';
import { View } from '../view';
import { getCifValue, niceCifDate } from '../../util';
import { CollapsibleVertical } from '../../../common/collapsible-vertical';
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
import { doiLink, pubmedLink } from '../../../../util/resources';

const NA = 'N/A';

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
    if (method === 'x-ray diffraction') {
        return `Low: ${getCifValue(d, Refine, 'ls_d_res_low')?.toFixed(3) ?? NA}, High: ${getCifValue(d, Refine, 'ls_d_res_high')?.toFixed(3) ?? NA}`;
    } else if (method === 'electron microscopy') {
        return `${getCifValue(d, Em3dReconstruction, 'resolution')?.toFixed(3) ?? NA} (${getCifValue(d, Em3dReconstruction, 'resolution_method')})`;
    } else
        return NA;
}

export class StructureInfo extends View {
    render() {
        const priPub = primaryPublication(this.props.dnatcofication);
        const pubmedHref = priPub?.pdbx_database_id_PubMed ? <a href={pubmedLink(priPub.pdbx_database_id_PubMed)}>{priPub.pdbx_database_id_PubMed}</a> : NA;
        const doiHref = priPub?.pdbx_database_id_DOI ? <a href={doiLink(priPub.pdbx_database_id_DOI)}>{priPub.pdbx_database_id_DOI}</a> : NA;

        return (
            <div>
                <NamedList>
                    <NamedListItem name='Structure ID'>{getCifValue(this.props.dnatcofication, Struct, 'entry_id') ?? NA }</NamedListItem>
                    <NamedListItem name='Structure title'>{getCifValue(this.props.dnatcofication, Struct, 'title') ?? NA }</NamedListItem>
                    <NamedListItem name='Deposited to PDB'>{niceCifDate(getCifValue(this.props.dnatcofication, PdbxDatabaseStatus, 'recvd_initial_deposition_date'))}</NamedListItem>
                </NamedList>
                <div className='rdo-line-spacer' />
                <CollapsibleVertical
                    header='Literature'
                >
                    <div className='rdo-offset'>
                        <NamedList>
                            <NamedListItem name='Publication title'>{priPub?.title ?? NA }</NamedListItem>
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
                            <NamedListItem name='Method'>{getCifValue(this.props.dnatcofication, Exptl, 'method') ?? NA }</NamedListItem>
                            <NamedListItem name='Resolution'>{resolution(this.props.dnatcofication)}</NamedListItem>
                            <NamedListItem name='R-free'>{getCifValue(this.props.dnatcofication, Refine, 'ls_R_factor_R_free')?.toFixed(3) ?? NA }</NamedListItem>
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
