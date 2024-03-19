import type { StandardLonghandProperties } from 'csstype';
import * as React from 'react';

interface State {
    collapsed: boolean;
}

export class CollapsibleVertical extends React.Component<CollapsibleVertical.Props, State> {
    constructor(props: CollapsibleVertical.Props) {
        super(props);

        this.state = {
            collapsed: this.props.initiallyExpanded ? false : true,
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
                    {this.state.collapsed ? this.props.header.collapsed : this.props.header.expanded}
                </div>
            );
        }
    }

    collapseExpand = (change: 'collapse' | 'expand') => {
        const collapsed = change === 'collapse';

        if (this.state.collapsed !== collapsed)
            this.setState({ ...this.state, collapsed });
    }

    componentDidUpdate(prevProps: CollapsibleVertical.Props, prevState: State) {
        if (this.props.onCollapsedExpanded && prevState.collapsed !== this.state.collapsed)
            this.props.onCollapsedExpanded(this.state.collapsed ? 'collapsed' : 'expanded');
    }

    render() {
        return (
            <div className='rdo-collapsible-vertical my-2 p-2 text-primary-first transition-all overflow-hidden flex flex-col border-b-primary-first border-b-[1px]'
            style={this.props.style}>
                {this.renderHeader()}
                {this.state.collapsed ? undefined : this.props.children}
            </div>
        );
    }
}

export namespace CollapsibleVertical {
    export interface Props {
        header: string | { expanded: React.ReactNode, collapsed: React.ReactNode },
        children?: React.ReactNode,
        style?: StandardLonghandProperties,
        onCollapsedExpanded?: (change: 'collapsed' | 'expanded') => void,
        initiallyExpanded?: boolean,
    }
}
