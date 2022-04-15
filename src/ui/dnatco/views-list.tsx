import * as React from 'react';
import { Register } from './views/register';

export class ViewsList extends React.Component<ViewsList.Props> {
    constructor(props: ViewsList.Props) {
        super(props);
    }

    private listViews() {
        const list = new Array<JSX.Element>();

        for (let idx = 0; idx < this.props.views.length; idx++) {
            const view = this.props.views[idx];
            const id = view.id;
            const last = idx === this.props.views.length - 1;
            list.push(
                <div key={id}
                    className={`rdo-views-list-item ${this.props.selected === id ? 'rdo-views-list-item-selected' : 'rdo-views-list-item-deselected'} ${!last ? 'rdo-views-list-item-not-last' : ''}`}
                    onClick={() => this.props.onSwitchView(id)}
                >
                    <div className='rdo-views-list-item-text'>{view.caption}</div>
                </div>
            );
        }
        list.push(<div key='padder' className='rdo-views-list-padder' />);

        return list;
    }

    render() {
        return (
            <div className='rdo-views-list'>
                {this.listViews()}
            </div>
        );
    }
}

export namespace ViewsList {
    export interface Props {
        views: { id: keyof typeof Register.Views, caption: string }[];
        onSwitchView: (id: keyof typeof Register.Views) => void;
        selected: keyof typeof Register.Views | 'empty' // HAKZ;
    }
}
