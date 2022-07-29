import * as React from 'react';

export class NamedList extends React.Component<NamedList.Props> {
    private renderCentered() {
        return (
            <div className='rdo-named-list-centered'>
                {this.props.items.map((item, index) =>
                    <React.Fragment key={index}>
                        <div />
                        <div className='rdo-named-list-name'>{item.name}</div><div className='rdo-named-list-value'>{item.value}</div>
                        <div />
                    </React.Fragment>
                )}
            </div>
        )
    }

    private renderLeft() {
        return (
            <div className='rdo-named-list'>
                {this.props.items.map((item, index) =>
                    <React.Fragment key={index}>
                        <div className='rdo-named-list-name'>{item.name}</div><div className='rdo-named-list-value'>{item.value}</div>
                    </React.Fragment>
                )}
            </div>
        )
    }

    render() {
        return this.props.style === 'centered' ? this.renderCentered() : this.renderLeft();
    }
}

export namespace NamedList {
    export interface Props {
        items: { name: string; value: JSX.Element|JSX.Element[]|string }[];
        style?: 'centered' | 'left';
    }
}
