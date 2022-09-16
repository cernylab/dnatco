import * as React from 'react';
import { BasePushButton, IconButton } from './common/push-button';
import { GlobalConfig }  from '../global-config';
import { Net } from '../util/net';

interface TabButtonProps {
    onClick: () => void;
    caption: string;
    icon: string;
    selected: boolean;
    enabled: boolean;
    noCaps: boolean;
}
class TabButton extends React.Component<TabButtonProps> {
    render() {
        return (
            <BasePushButton
                className={`rdo-tab-button rdo-tab-button-enabled ${this.props.selected ? 'rdo-tab-button-selected' : ''}`}
                classNameDisabled='rdo-tab-button rdo-tab-button-disabled'
                onClick={this.props.onClick}
                enabled={this.props.enabled}
            >
                <img
                    className='rdo-tab-button-icon'
                    src={`${GlobalConfig.data().pathPrefix}${this.props.icon}`}
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
            const enabled = tab.enabled;
            list.push(
                <TabButton
                    key={tk}
                    icon={tab.icon}
                    caption={tab.caption}
                    onClick={() => {
                        if (enabled)
                            this.props.onTabSwitched(tk);
                    }}
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
                <div className='rdo-navigation-bar-padder' />
                <IconButton
                    className='rdo-navigation-icon-button'
                    src='imgs/ibt.png'
                    onClick={() => Net.openLink('https://www.ibt.cas.cz/', true)}
                />
                {this.makeTabs(this.props.tabs)}
                <IconButton
                    className='rdo-navigation-icon-button'
                    src='imgs/elixir.png'
                    onClick={() => Net.openLink('https://www.elixir-czech.cz/', true)}
                />
                <div className='rdo-navigation-bar-padder' />
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
