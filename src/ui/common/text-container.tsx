import React from 'react';
import DOMPurify from 'dompurify';

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
                console.warn(e);
                this.setState({
                    ...this.state,
                    content: '<div class="rdo-error-text">Failed to download content</div>',
                });
            }
        } else {
            console.warn(resp.status, resp.statusText);
            this.setState({
                ...this.state,
                content: '<div class="rdo-error-text">Failed to download content</div>',
            });
        }
    }

    componentDidMount() {
        this.loadAsset();
    }

    render() {
        return (
            <div
                className='rdo-offset'
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
