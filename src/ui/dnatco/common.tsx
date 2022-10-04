import React from 'react';
import { IconTextButton } from '../common/push-button';
import { GlobalConfig } from '../../global-config';
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
