import * as React from 'react';
import { Register } from './views/register';
import { SideSwitchingPanel } from '../common/side-switching-panel';

export class ViewsList extends React.Component<ViewsList.Props> {
    constructor(props: ViewsList.Props) {
        super(props);
    }

    render() {
        return (
            <SideSwitchingPanel
                items={this.props.views}
                selectedItemId={this.props.selected}
                onSwitched={id => this.props.onSwitchView(id)}
            />
        );
    }
}

export namespace ViewsList {
    export interface Props {
        views: readonly (readonly [id: keyof typeof Register.Views, item: { caption: string }])[];
        onSwitchView: (id: keyof typeof Register.Views) => void;
        selected: keyof typeof Register.Views;
    }
}
