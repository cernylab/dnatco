import * as React from 'react';

export class SideSwitchingPanel extends React.Component<SideSwitchingPanel.Props> {
    private listItems() {
        const list = new Array<JSX.Element>();

        for (let idx = 0; idx < this.props.items.length; idx++) {
            const view = this.props.items[idx];
            const id = view.id;
            const last = idx === this.props.items.length - 1;
            list.push(
                <div key={id}
                    className={`rdo-side-switching-panel-item ${this.props.selectedItem === id ? 'rdo-side-switching-panel-item-selected' : 'rdo-side-switching-panel-item-deselected'} ${!last ? 'rdo-side-switching-panel-item-not-last' : ''}`}
                    onClick={() => this.props.onSwitched(id)}
                >
                    <div className='rdo-side-switching-panel-item-text'>{view.caption}</div>
                </div>
            );
        }
        list.push(<div key='padder' className='rdo-side-switching-panel-padder' />);

        return list;
    }

    render() {
        return (
            <div className='rdo-side-switching-panel'>
                {this.listItems()}
            </div>
        );
    }
}

export namespace SideSwitchingPanel {
    export type Item = {
        id: string;
        caption: string;
    }

    export interface Props {
        items: Item[];
        selectedItem: Item['id'];
        onSwitched: (id: string) => void;
    }
}

