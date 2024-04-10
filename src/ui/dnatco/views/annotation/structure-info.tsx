import * as React from 'react';
import { EntitiesAndMolecules } from './entities-and-molecules';
import { View } from '../view';
import { CollapsibleVertical } from '../../../common/collapsible-vertical';
import { Link } from '../../../common/link';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { TriangleDownImg } from '../../../../assets/images';
import { Exptl } from '../../../../cif/categories/experimental';
import { PdbxDatabaseStatus } from '../../../../cif/categories/pdbx-database-status';
import { Refine } from '../../../../cif/categories/refine';
import { Struct } from '../../../../cif/categories/struct';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { doiLink, pubmedLink, rcsbLink } from '../../../../util/resources';
import { getCifValue, niceCifDate, Common } from '../../../../util/dnatco';
import * as SI from '../../../../util/structure-info';

function mkHeader(text: string) {
    return {
        collapsed: (
            <div className='flex flex-row rdo-h2gap rdo-taller cursor-pointer'>
                <img
                    src={TriangleDownImg}
                    style={{ transition: 'rotate var(--anim-speed)', rotate: '0deg' }}
                />
                <div className='font-700' style={{ flex: 1 }}>{text}</div>
            </div>
        ),
        expanded: (
            <div className='flex flex-row rdo-h2gap rdo-taller cursor-pointer'>
                <img
                    src={TriangleDownImg}
                    style={{ transition: 'rotate var(--anim-speed)', rotate: '180deg' }}
                />
                <div className='font-700' style={{ flex: 1 }}>{text}</div>
            </div>
        )
    };
}

export function structureId(d: Dnatcofication) {
    const id = getCifValue(d, Struct, 'entry_id');
    if (!id)
        return Common.NA;

    return (
        <div>
            {id.toUpperCase()}
            {'\u00A0'}
            <Link className='text-primary-first' url={rcsbLink(id)} newTab={true}>(Link to PDB)</Link>
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
                <div className='h-4' />
                <CollapsibleVertical
                    header={mkHeader('Entities')}
                >
                    <div className='rdo-offset'>
                        <EntitiesAndMolecules d={this.props.dnatcofication} />
                    </div>
                </CollapsibleVertical>
                <CollapsibleVertical
                    header={mkHeader('Literature')}
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
                    header={mkHeader('Experimental')}
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
