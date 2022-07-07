import * as React from 'react';

interface State {
    collapsed: boolean;
}

export class CollapsibleVertical extends React.Component<CollapsibleVertical.Props, State> {
    constructor(props: CollapsibleVertical.Props) {
        super(props);

        this.state = {
            collapsed: true,
        };
    }

    render() {
        return (
            <div className='rdo-collapsible-vertical'>
                <div
                    className='rdo-collapsible-vertical-caption'
                    onClick={() => this.setState({ ...this.state, collapsed: !this.state.collapsed })}
                >
                    {this.props.caption}
                </div>
                {this.state.collapsed ? undefined : this.props.children}
            </div>
        );
    }
}

export namespace CollapsibleVertical {
    export interface Props {
        caption: string;
        children?: React.ReactNode;
    }
}
