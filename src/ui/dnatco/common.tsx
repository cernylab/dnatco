import React from 'react';
import { DynamicTable } from '../common/dynamic-table';
import { IconTextButton } from '../common/push-button';
import { GlobalConfig } from '../../global-config';
import { Net } from '../../util/net';
import { Serialization } from '../../util/serialization';
import '../../../assets/imgs/data-transfer-download.svg';

export namespace Common {
    export const NA = 'N/A';
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
