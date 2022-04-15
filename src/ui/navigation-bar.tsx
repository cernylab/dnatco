import * as React from 'react';
import { BasePushButton, IconButton } from './common/push-button';
import { GlobalConfig }  from '../global-config';
import { Net } from '../util/net';
import '../../assets/imgs/elixir.png';
import '../../assets/imgs/home.svg';
import '../../assets/imgs/ibt.png';
import '../../assets/imgs/info.svg';
import '../../assets/imgs/question-mark.svg';

interface TabButtonProps {
    onClick: () => void;
    caption: string;
    disabled: boolean;
    icon: string;
    selected: boolean;
}
class TabButton extends React.Component<TabButtonProps> {
    static defaultProps = {
        disabled: false,
    };

    render() {
        return (
            <BasePushButton
                className={`rdo-tab-button ${this.props.selected ? 'rdo-tab-button-selected' : ''}`}
                classNameDisabled='rdo-tab-button-disabled'
                enabled={!this.props.disabled}
                onClick={this.props.onClick}
            >
                <img
                    className='rdo-tab-button-icon'
                    src={`${GlobalConfig.get('pathPrefix')}${this.props.icon}`}
                />
                <div className='rdo-tab-button-text'>{this.props.caption}</div>
            </BasePushButton>
        );
    }
}

export class NavigationBar extends React.Component<NavigationBar.Props> {
    render() {
        return (
            <div className='rdo-navigation-bar'>
                <div className='rdo-navigation-bar-padder' />
                <IconButton
                    className='rdo-navigation-icon-button'
                    src='imgs/ibt.png'
                    onClick={() => Net.openLink('https://www.ibt.cas.cz/', true)}
                />
                <TabButton
                    icon='imgs/home.svg'
                    caption='Start'
                    onClick={() => this.props.onTabSwitched('start')}
                    selected={this.props.selected === 'start'}
                />
                <TabButton
                    disabled={this.props.disabled.includes('annotation')}
                    icon='imgs/question-mark.svg'
                    caption='Annotation'
                    onClick={() => this.props.onTabSwitched('annotation')}
                    selected={this.props.selected === 'annotation'}
                />
                <TabButton
                    disabled={this.props.disabled.includes('validation')}
                    icon='imgs/question-mark.svg'
                    caption='Validation'
                    onClick={() => this.props.onTabSwitched('validation')}
                    selected={this.props.selected === 'validation'}
                />
                <TabButton
                    disabled={this.props.disabled.includes('refinement')}
                    icon='imgs/question-mark.svg'
                    caption='Refinement'
                    onClick={() => this.props.onTabSwitched('refinement')}
                    selected={this.props.selected === 'refinement'}
                />
                <TabButton
                    icon='imgs/info.svg'
                    caption='About'
                    onClick={() => this.props.onTabSwitched('about')}
                    selected={this.props.selected === 'about'}
                />
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
    export type Tabs = 'start' | 'annotation' | 'validation' | 'refinement' | 'about';

    export interface Props {
        onTabSwitched: (tab: Tabs) => void;
        disabled: Tabs[];
        selected: Tabs;
    }
}
