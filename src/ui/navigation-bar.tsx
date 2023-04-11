import * as React from 'react';
import { EquiBox } from './common/equibox';
import { BasePushButton } from './common/push-button';
import { GlobalConfig }  from '../global-config';

interface TabButtonProps {
    onClick: () => void;
    caption: string;
    icon: string;
    selected: boolean;
    enabled: boolean;
    noCaps: boolean;
}
class TabButton extends React.Component<TabButtonProps> {
    private getCls() {
        if (this.props.enabled)
            return `rdo-tab-button rdo-tab-button-enabled ${this.props.selected ? 'rdo-tab-button-selected' : ''}`;
        return 'rdo-tab-button rdo-tab-button-disabled';
    }

    render() {
        return (
            <BasePushButton
                className={this.getCls()}
                classNameDisabled='rdo-tab-button rdo-tab-button-disabled'
                onClick={this.props.onClick}
            >
                <img
                    className='rdo-tab-button-icon'
                    src={`${GlobalConfig.data().pathPrefix}/${this.props.icon}`}
                />
                <div className={this.props.noCaps ? 'rdo-tab-button-text-no-caps' : 'rdo-tab-button-text'}>{this.props.caption}</div>
            </BasePushButton>
        );
    }
}

export class NavigationBar extends React.Component<NavigationBar.Props> {
    private makeTabs(tabs: NavigationBar.Tabs) {
        const list = new Array<JSX.Element>();

        for (const tk in tabs) {
            const tab = tabs[tk];
            list.push(
                <TabButton
                    key={tk}
                    icon={tab.icon}
                    caption={tab.caption}
                    onClick={() => this.props.onTabSwitched(tk)}
                    selected={this.props.selectedTab === tk}
                    enabled={tab.enabled}
                    noCaps={tab.noCaps ?? false}
                />
            );
        }

        return list;
    }

    render() {
        return (
            <div className='rdo-navigation-bar'>
                <EquiBox
                    items={this.makeTabs(this.props.tabs)}
                    padding={33}
                    orientation='row'
                />
            </div>
        );
    }
}

export namespace NavigationBar {
    export type Tab = {
        icon: string,
        caption: string,
        enabled: boolean,
        noCaps?: boolean
    };

    export type Tabs = Record<string, Tab>;

    export interface Props {
        onTabSwitched: (tk: string) => void;
        tabs: Tabs;
        selectedTab: keyof Tabs;
    }
}
