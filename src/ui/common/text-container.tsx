import React from 'react';
import DOMPurify from 'dompurify';
import { Logger } from '../../log/logger';

interface State {
    content: string;
}
export class TextContainer extends React.Component<TextContainer.Props, State> {
    constructor(props: TextContainer.Props) {
        super(props);

        this.state = {
            content: '',
        };
    }

    private async loadAsset() {
        const resp = await fetch(this.props.assetUrl);
        if (resp.ok) {
            try {
                const content = await resp.text();
                this.setState({ ...this.state, content: DOMPurify.sanitize(content) });
            } catch (e) {
                Logger.log(Logger.Severity.Warning, (e as Error).toString());
                this.setState({
                    ...this.state,
                    content: '<div class="text-secondary-third">Failed to download content</div>',
                });
            }
        } else {
            Logger.log(Logger.Severity.Warning, `${resp.status}, resp.statusText`);
            this.setState({
                ...this.state,
                content: '<div class="text-secondary-third">Failed to download content</div>',
            });
        }
    }

    componentDidMount() {
        this.loadAsset();
    }

    render() {
        return (
            <div
                className='rdo-offset rdo-scroll-vertically'
                dangerouslySetInnerHTML={{ __html: this.state.content }}
            ></div>
        );
    }
}

export namespace TextContainer {
    export interface Props {
        assetUrl: string;
    }
}
