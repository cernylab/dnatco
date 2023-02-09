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

    private renderHeader() {
        if (typeof this.props.header === 'string') {
            return (
                <div
                    className='rdo-collapsible-vertical-caption'
                    onClick={() => this.setState({ ...this.state, collapsed: !this.state.collapsed })}
                >
                    {this.props.header}
                </div>
            );
        } else {
            return (
                <div
                    onClick={() => this.setState({ ...this.state, collapsed: !this.state.collapsed })}
                >
                    {this.props.header}
                </div>
            );
        }
    }

    render() {
        return (
            <div className='rdo-collapsible-vertical'>
                {this.renderHeader()}
                {this.state.collapsed ? undefined : this.props.children}
            </div>
        );
    }
}

export namespace CollapsibleVertical {
    export interface Props {
        header: string | React.ReactNode;
        children?: React.ReactNode;
    }
}
