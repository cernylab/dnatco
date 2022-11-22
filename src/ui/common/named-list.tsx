import * as React from 'react';
import { Tooltip } from './tooltip';

export class NamedList extends React.Component<NamedList.Props> {
    static defaultProps = {
        horizontalPosition: 'left',
        verticalPosition: 'top',
    }

    private renderCentered() {
        const children = this.props.children;
        return (
            <div className='rdo-named-list-centered'>
                {Array.isArray(children)
                    ? children.map(e => <><div />{e}<div /></>)
                    : <><div />children<div /></>
                }
            </div>
        )
    }

    private renderLeft() {
        return (
            <div className={`rdo-named-list ${this.props.verticalPosition === 'center' ? 'rdo-named-list-vcentered' : ''}`}>
                {this.props.children}
            </div>
        )
    }

    render() {
        return this.props.horizontalPosition === 'center' ? this.renderCentered() : this.renderLeft();
    }
}

export class NamedListItem extends React.Component<{ name: string, children?: React.ReactNode|React.ReactNode[], tooltip?: React.ReactNode }> {
    render() {
        return (
            <>
                <div className='rdo-named-list-name'>
                    {this.props.name}
                    {this.props.tooltip
                        ? <Tooltip tag='[?]'>{this.props.tooltip}</Tooltip>
                        : undefined
                    }
                </div>
                <div className='rdo-named-list-value'>{this.props.children}</div>
            </>
        );
    }
}

export namespace NamedList {
    export interface Props {
        horizontalPosition: 'center' | 'left';
        verticalPosition: 'center' | 'top';
        children?: React.ReactNode|React.ReactNode[];
    }
}
