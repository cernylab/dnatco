import React from 'react';
import { ChainSelect, ModelSelect } from '../structure-selectors';
import { View } from '../view';
import { InvalidChain, InvalidModelIndex } from '../../structure-selection';
import { CollapsibleVertical } from '../../../common/collapsible-vertical';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { Dnatcofication  } from '../../../../dnatco/dnatcofication';
import { Measure } from '../../../../dnatco/angles-lengths/measure';
import { M } from '../../../../util/math';

const DetailsTableStyle = { display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '1em' };

export class AnglesLengths extends View {
    private renderResidue(residue: Measure.Residue, multipleModels: boolean) {
        const residueName = multipleModels
            ? `${residue.modelNum} ${residue.authChain}${residue.authSeqId}`
            : `${residue.authChain}${residue.authSeqId}`;

        return (
            <CollapsibleVertical
                caption={residueName}
            >
                <div style={DetailsTableStyle}>
                    <div style={{ gridColumnStart: 'span 2' }}>Bond lengths</div>
                    {residue.bondLengths.map(x => {
                        return (
                            <>
                                <div className='rdo-monospace'>{x.a} - {x.b}</div>
                                <div>{x.length.toFixed(2)}{'\u00A0'}{'\u212B'}</div>
                            </>
                        );
                    })}
                </div>

                <div style={DetailsTableStyle}>
                    <div style={{ gridColumnStart: 'span 2' }}>Bond angles</div>
                    {residue.bondAngles.map(x => {
                        return (
                            <>
                                <div className='rdo-monospace'>{x.a} - {x.b} - {x.c}</div>
                                <div>{M.r2d(x.angle).toFixed(1)}{'\u00B0'}</div>
                            </>
                        );
                    })}
                </div>
            </CollapsibleVertical>
        );
    }

    private renderModel(modelIdx: number, multipleModels: boolean, chain: string) {
        const alm = this.props.dnatcofication.data.alm;
        if (modelIdx === InvalidModelIndex) {
            const elems = [];
            for (const mm of alm.models.values())
                elems.push(...mm.map(x => this.renderResidue(alm.residues[x], multipleModels)));

            return elems;
        } else {
            const modelNum = this.props.dnatcofication.data.structures[0].models[modelIdx].num;

            if (chain) {
                const cm = alm.chains.get(modelNum)?.get(chain);
                return cm
                    ? cm.map(x => this.renderResidue(alm.residues[x], multipleModels))
                    : [];
            } else {
                const mm = alm.models.get(modelNum);
                return mm
                    ? mm.map(x => this.renderResidue(alm.residues[x], multipleModels))
                    : [];
            }
        }
    }

    render() {
        const multipleModels = Dnatcofication.Structure.numberOfModels(this.props.dnatcofication) > 1;
        const modelIdx = this.props.structureSelection.modelIndex;
        const chain = this.props.structureSelection.chain === InvalidChain ? '' : this.props.structureSelection.chain;

        return (
            <div>
                <NamedList sizing='min-content' rowSpacing='half'>
                {
                    multipleModels
                        ? <NamedListItem name='Model'>
                                <ModelSelect
                                    dnatcofication={this.props.dnatcofication}
                                    structureSelection={this.props.structureSelection}
                                    onChange={this.props.switching.switchModel}
                                />
                            </NamedListItem>
                        : undefined
                }
                    <NamedListItem name='Chain'>
                        <ChainSelect
                            dnatcofication={this.props.dnatcofication}
                            structureSelection={this.props.structureSelection}
                            onChange={this.props.switching.switchChain}
                        />
                    </NamedListItem>
                </NamedList>

                <div className='rdo-vertical-spacer' />

                {this.renderModel(modelIdx, multipleModels, chain)}
            </div>
        );
    }
}
