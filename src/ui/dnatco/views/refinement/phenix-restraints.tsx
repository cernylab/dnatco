import React from 'react';
import { Refinement } from './common';
import { View } from '../view';
import { ComboBox } from '../../../common/combo-box';
import { PushButton } from '../../../common/push-button';
import { SpinBox } from '../../../common/spin-box';
import { Phenix } from '../../../../refine/phenix';
import { Net } from '../../../../util/net';
import { GlobalConfig } from '../../../../global-config';

const LeadingWS = new RegExp(/^[ ]./);

function renderLines(lines: Phenix.Line[]) {
    if (lines.length > 10000)
        return <div className='rdo-emphasize' style={{ textAlign: 'center' }}>Configuration is too long to be displayed. You can download it as a text file by clicking on the &ldquo;Download&rdquo; button</div>;
    return lines.map((line, idx) => {
        const text = replaceAll(line.text, LeadingWS, '\u00A0');
        if (line.isOk)
            return <div className='rdo-monospace' key={idx}>{text}</div>;
        else
            return <div className='rdo-monospace rdo-error-text' key={idx}>{text}</div>;
    });
}

function replaceAll(where: string, what: string|RegExp, _with: string) {
    let ret = where;
    while (ret.search(what) >= 0) {
        ret = where.replace(what, _with);
    }

    return ret;
}

interface State {
    maxRmsd: number;
}
export class PhenixRestraints extends View<Refinement.Props, State> {
    constructor(props: Refinement.Props) {
        super(props);

        this.state = {
            maxRmsd: 0.5,
        };
    }

    render() {
        const restraints = Phenix.restraints(this.props.dnatcofication, this.props.selectedCustomNtCSet, this.state.maxRmsd);
        const lines = Phenix.restraintsAsLines(restraints);

        return (
            <div style={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div>
                    <div className='rdo-secondary-caption'>Restraints for NtC-aware Phenix</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--h-gap)' }}>
                        NtC set:
                        <ComboBox
                            options={Refinement.ntcSetsOptions(this.props.dnatcofication.customNtCs)}
                            value={this.props.selectedCustomNtCSet}
                            onChange={(v) => this.props.onCustomNtCSetChanged(v)}
                        />
                        Maximum allowed RMSD:
                        <SpinBox
                            value={this.state.maxRmsd}
                            min={0.1}
                            max={5.0}
                            onChange={v => this.setState({ ...this.state, maxRmsd: v })}
                            step={0.01}
                            formatter={v => v?.toFixed(2) ?? '0'}
                        />
                        <PushButton
                            caption='Download'
                            onClick={() => {
                                Net.serveFile('text/plain', lines.map(l => l.text).join('\n'), `${this.props.dnatcofication.identifyingName}_Phenix_geometry_restraints.txt`);
                            }}
                        />
                    </div>
                </div>
                <div className='rdo-offset' style={{ overflow: 'scroll', flex: 1 }}>
                    {renderLines(lines)}
                </div>
                <div>
                    Note that this restraints file requires a modified &ldquo;NtC-aware&rdquo; version of Phenix. Contact the authors of the {GlobalConfig.data().displayedProductName} website for further information.
                </div>
            </div>
        );
    }
}

export namespace PhenixRestraints {
    export const StepSwitcher = () => {};
}
