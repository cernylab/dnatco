import React from 'react';
import { DynamicTable } from '../common/dynamic-table';
import { IconTextButton } from '../common/push-button';
import { GlobalConfig } from '../../global-config';
import { Net } from '../../util/net';
import { Serialization } from '../../util/serialization';
import { Step } from '../../dnatco/step';
import 'assets/imgs/data-transfer-download.svg';

export namespace Common {
    export const NA = 'N/A';
}

export function niceStepName(step: Step) {
    return (
        <span>
            <span className='rdo-nice-step-base'>{step.base1}</span>
            <span className='rdo-nice-step-brsep'>{'\u00A0'}</span>
            <span className='rdo-nice-step-residue'>{step.resNo1}{step.insCode1}</span>
            {step.altPos1 !== '' ? <span className='rdo-nice-step-altpos'>(alt {step.altPos1})</span> : void 0}

            <div className='rdo-nice-step-fssep'>{'\u00A0'}</div>

            <span className='rdo-nice-step-base'>{step.base2}</span>
            <span className='rdo-nice-step-brsep'>{'\u00A0'}</span>
            <span className='rdo-nice-step-residue'>{step.resNo2}{step.insCode2}</span>
            {step.altPos2 !== '' ? <span className='rdo-nice-step-altpos'>(alt {step.altPos2})</span> : void 0}
        </span>
    );
}

export class DownloadButton extends React.Component<DownloadButton.Props> {
    render() {
        const prefix = GlobalConfig.data().pathPrefix;

        return (
            <IconTextButton
                caption={this.props.caption}
                src={`${prefix}/imgs/data-transfer-download.svg`}
                onClick={this.props.onClick}
            />
        );
    }
}
export namespace DownloadButton {
    export interface Props {
        caption: string;
        onClick: (e: React.MouseEvent) => void;
    }
}

export class DynamicTableDownloadBar extends React.Component<DynamicTableDownloadBar.Props> {
    render() {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: '5em 5em 1fr', columnGap: 'var(--h2-gap)', marginBottom: 'var(--v-gap)' }}>
                <DownloadButton
                    caption='CSV'
                    onClick={() => {
                        const text = Serialization.dynamicTable(this.props.model, 'csv');
                        Net.serveFile('text/csv', text, this.props.filenameCsv);
                    }}
                />
                <DownloadButton
                    caption='JSON'
                    onClick={() => {
                        const text = Serialization.dynamicTable(this.props.model, 'json');
                        Net.serveFile('application/json', text, this.props.filenameJson);
                    }}
                />
                <div style={{ flex: 1 }}>{'\u00A0'}</div>
            </div>
        );
    }
}
export namespace DynamicTableDownloadBar {
    export interface Props {
        filenameCsv: string;
        filenameJson: string;
        model: DynamicTable.Model;
    }
}
