import * as React from 'react';
import { BasePushButton, IconButton } from './common/push-button';
import { GlobalConfig }  from '../global-config';
import { Net } from '../util/net';
import '../../assets/imgs/elixir.png';
import '../../assets/imgs/media-play.svg';
import '../../assets/imgs/ibt.png';
import '../../assets/imgs/info.svg';
import '../../assets/imgs/question-mark.svg';
import '../../assets/imgs/list.svg';
import '../../assets/imgs/task.svg';
import '../../assets/imgs/loop.svg';

const Tabs = {
    'start': {
        icon: 'imgs/media-play.svg',
        caption: 'Start'
    },
    'browse': {
        icon: 'imos/question-mark.svg',
        caption: 'Browse',
    },
    'annotation': {
        icon: 'imgs/list.svg',
        caption: 'Annotation',
    },
    'validation': {
        icon: 'imgs/task.svg',
        caption: 'Validation',
    },
    'refinement': {
        icon: 'imgs/loop.svg',
        caption: 'Refinement',
    },
    'about': {
        icon: 'imgs/info.svg',
        caption: 'About'
    }
};

interface TabButtonProps {
    onClick: () => void;
    caption: string;
    icon: string;
    selected: boolean;
}
class TabButton extends React.Component<TabButtonProps> {
    render() {
        return (
            <BasePushButton
                className={`rdo-tab-button ${this.props.selected ? 'rdo-tab-button-selected' : ''}`}
                classNameDisabled='rdo-tab-button-disabled'
                onClick={this.props.onClick}
            >
                <img
                    className='rdo-tab-button-icon'
                    src={`${GlobalConfig.data().pathPrefix}${this.props.icon}`}
                />
                <div className='rdo-tab-button-text'>{this.props.caption}</div>
            </BasePushButton>
        );
    }
}

export class NavigationBar extends React.Component<NavigationBar.Props> {
    private makeTabs(tabs: NavigationBar.Tabs[]) {
        const list = new Array<JSX.Element>();

        for (const tab of tabs) {
            list.push(
                <TabButton
                    key={tab}
                    icon={Tabs[tab].icon}
                    caption={Tabs[tab].caption}
                    onClick={() => this.props.onTabSwitched(tab)}
                    selected={this.props.selected === tab}
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
                {this.makeTabs(this.props.shown)}
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
    export type Tabs = keyof typeof Tabs;

    export interface Props {
        onTabSwitched: (tab: Tabs) => void;
        shown: Tabs[];
        selected: Tabs;
    }
}
