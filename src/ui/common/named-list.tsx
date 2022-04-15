import * as React from 'react';

export class NamedList extends React.Component<NamedList.Props> {
    render() {
        return (
            <div className='rdo-named-list'>
            {this.props.items.map((item, index) =>
                <React.Fragment key={index}>
                    <div className='rdo-named-list-name'>{item.name}</div><div className='rdo-named-list-value'>{item.value}</div>
                </React.Fragment>
            )}
            </div>
        );
    }
}

export namespace NamedList {
    export interface Props {
        items: { name: string; value: JSX.Element|JSX.Element[]|string }[];
    }
}
