import * as React from 'react';
import * as RDC from 'react-dom/client';
import { EquiBox } from './common/equibox';
import { BasePushButton } from './common/push-button';
import { GlobalConfig }  from '../global-config';
import '../../../assets/imgs/grid-three-up.svg';

const MinimumWidthForStandardBar = 1000;

function makeMenu(
    tabs: NavigationBar.Tabs,
    selectedTab: keyof NavigationBar.Tabs,
    onTabSwitched: (tk: string) => void,
    x: number,
    y: number,
    onDismissed: () => void,
) {
    const tainer = document.createElement('div');
    document.body.appendChild(tainer);

    const reactRoot = RDC.createRoot(tainer!);
    reactRoot.render(
        <Menu
            tabs={tabs}
            selectedTab={selectedTab}
            onTabSwitched={onTabSwitched}
            onDismissed={onDismissed}
            x={x} y={y}
            parentElement={tainer}
        />
    );
}

function makeTabs(tabs: NavigationBar.Tabs, selectedTab: keyof NavigationBar.Tabs, onTabSwitched: (tk: string) => void) {
    const list = new Array<JSX.Element>();

    for (const tk in tabs) {
        const tab = tabs[tk];
        list.push(
            <TabButton
                key={tk}
                icon={tab.icon}
                caption={tab.caption}
                onClick={() => onTabSwitched(tk)}
                selected={selectedTab === tk}
                enabled={tab.enabled}
                noCaps={tab.noCaps ?? false}
            />
        );
    }

    return list;
}

function tabButtonCls(enabled: boolean, selected: boolean) {
    if (enabled)
        return `rdo-tab-button rdo-tab-button-enabled ${selected ? 'rdo-tab-button-selected' : ''}`;
    return 'rdo-tab-button rdo-tab-button-disabled';
}

function TabButton(props: {
    onClick: () => void;
    caption: string;
    icon: string;
    selected: boolean;
    enabled: boolean;
    noCaps: boolean;
}) {
    return (
        <BasePushButton
            className={tabButtonCls(props.enabled, props.selected)}
            classNameDisabled='rdo-tab-button rdo-tab-button-disabled'
            onClick={props.onClick}
        >
            <img
                className='rdo-tab-button-icon'
                src={`${GlobalConfig.data().pathPrefix}/${props.icon}`}
            />
            <div className={props.noCaps ? 'rdo-tab-button-text-no-caps' : 'rdo-tab-button-text'}>{props.caption}</div>
        </BasePushButton>
    );
}

export function Menu(props: {
    tabs: NavigationBar.Tabs,
    selectedTab: keyof NavigationBar.Tabs,
    onTabSwitched: (tk: string) => void,
    x: number,
    y: number,
    onDismissed: () => void,
    parentElement: HTMLElement,
}) {
    const dismisser = () => {
        document.body.removeChild(props.parentElement);
        document.body.removeEventListener('click', dismisser);
        props.onDismissed();
    };

    React.useEffect(() => {
        document.body.addEventListener('click', dismisser);
        return () => document.body.removeEventListener('click', dismisser);
    });

    return (
        <div
            className='rdo-navigation-menu'
            style={{
                left: `${props.x}px`,
                top: `${props.y}px`,
            }}
        >
            {makeTabs(props.tabs, props.selectedTab, props.onTabSwitched)}
        </div>
    );
}

function NavigationBarCompact(props: {
    tabs: NavigationBar.Tabs;
    selectedTab: keyof NavigationBar.Tabs;
    onTabSwitched: (tk: string) => void;
}) {
    const [hamburgerOpen, setHamburberOpen] = React.useState(false);
    const [hamburgerHovered, setHamburberHovered] = React.useState(false);
    const selected = props.tabs[props.selectedTab]

    return (
        <div className='rdo-navigation-bar'>
            <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'row', gap: 'var(--h-gap)' }}>
                <div style={{ flex: 1 }} />
                <img
                    onMouseEnter={() => setHamburberHovered(true)}
                    onMouseLeave={() => setHamburberHovered(false)}
                    className={`rdo-navigation-bar-hamburger-icon ${hamburgerHovered ? 'rdo-navigation-bar-hamburger-icon-active' : ''}`}
                    src={`${GlobalConfig.data().pathPrefix}/imgs/grid-three-up.svg`}
                    onClick={(ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();

                        if (hamburgerOpen)
                            return;

                        makeMenu(
                            props.tabs,
                            props.selectedTab,
                            props.onTabSwitched,
                            ev.clientX,
                            ev.clientY,
                            () => setHamburberOpen(false),
                        );
                        setHamburberOpen(true);
                    }}
                />
                <div style={{ width: 'min-content' }}>
                    <TabButton
                        key={props.selectedTab}
                        icon={selected.icon}
                        caption={selected.caption}
                        onClick={() => {}}
                        selected={true}
                        enabled={true}
                        noCaps={selected.noCaps ?? false}
                    />
                </div>
                <div style={{ flex: 1 }} />
            </div>
        </div>
    );
}

function NavigationBarStandard(props: {
    onTabSwitched: (tk: string) => void;
    tabs: NavigationBar.Tabs;
    selectedTab: keyof NavigationBar.Tabs;
}) {
    return (
        <div className='rdo-navigation-bar'>
            <EquiBox
                items={makeTabs(props.tabs, props.selectedTab, props.onTabSwitched)}
                padding={33}
                orientation='row'
            />
        </div>
    );
}

export function NavigationBar(props: {
    onTabSwitched: (tk: string) => void;
    tabs: NavigationBar.Tabs;
    selectedTab: keyof NavigationBar.Tabs;
}) {
    const [compact, setCompact] = React.useState(false);

    React.useEffect(() => {
        const compactToggler = () => {
            setCompact(window.innerWidth < MinimumWidthForStandardBar);
        };

        addEventListener('resize', compactToggler);

        return () => {
            removeEventListener('resize', compactToggler);
        };
    });

    React.useLayoutEffect(() => {
        setCompact(window.innerWidth < MinimumWidthForStandardBar);
    });

    return (
        <div>
            {compact
                ? <NavigationBarCompact { ...props } />
                : <NavigationBarStandard { ...props } />
            }
        </div>
    );
}

export namespace NavigationBar {
    export type Tab = {
        icon: string,
        caption: string,
        enabled: boolean,
        noCaps?: boolean
    };

    export type Tabs = Record<string, Tab>;
}
