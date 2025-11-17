import * as React from 'react';
import * as RDC from 'react-dom/client';
import { EquiBox } from './common/equibox';
import { BasePushButton } from './common/push-button';
import { GridThreeUpImg } from '../assets/images';
import { DnatcoLogoImg } from '../assets/images';
import { Link, useLocation } from 'react-router';

const MinimumWidthForStandardBar = 1000;

type Tabs<TK extends string> = Record<TK, {
    icon: string,
    caption: string,
    enabled: boolean,
    noCaps?: boolean,
}>;

function makeMenu<TK extends string>(
    onTabSwitched: (tk: TK) => void,
    tabs: Tabs<TK>,
    selectedTab: TK,
    x: number,
    y: number,
    onDismissed: () => void
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

function makeTabs<TK extends string>(onTabSwitched: (tk: TK) => void, tabs: Tabs<TK>, selectedTab: TK)  {
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
        return 'rdo-tab-button rdo-tab-button-enabled';
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
            <div className={`${props.noCaps ? '' : 'font-roboto-bold text-24px'} ${props.enabled && !props.selected ? 'hover-animation' : ''} ${props.selected ? 'text-secondary-first stroke' : ''}`}>{props.caption}</div>
        </BasePushButton>
    );
}

export function Menu<TK extends string>(props: {
    onTabSwitched: (tk: TK) => void,
    tabs: Tabs<TK>,
    selectedTab: TK,
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
    }, []);

    return (
        <div className='h-full w-full absolute left-0 top-0 bg-full-white p-8'>
            {makeTabs(props.onTabSwitched, props.tabs, props.selectedTab)}
            <div className='absolute top-4 right-4'>
                &#x2715;
            </div>
        </div>
    );
}


function NavigationBarCompact<TK extends string>(props: {
    onTabSwitched: (tk: TK) => void,
    tabs: Tabs<TK>,
    selectedTab: TK,
}) {
    const [hamburgerOpen, setHamburgerOpen] = React.useState(false);
    const selected = props.tabs[props.selectedTab];
    const location = useLocation();

    // Check if we're in a DNATCO analysis view where we want to preserve Mol* state
    const isInAnalysisView = location.pathname.match(/^\/app\/dnatco\/(annotation|validation|refinement|downloads)/);

    return (
        <div className='navigation-mobile'>
            <div className='flex flex-row justify-between mx-4 items-center'>
                <div>
                    {isInAnalysisView ? (
                        <a href='/' target='_blank' rel='noopener noreferrer'>
                            <img className='w-28' src={DnatcoLogoImg}/>
                        </a>
                    ) : (
                        <Link to='/'>
                            <img className='w-28' src={DnatcoLogoImg}/>
                        </Link>
                    )}
                </div>
                <div className='flex'>
                    <div>
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
                    <div className='items-center flex h-7 justify-center p-2 m-auto'
                        onClick={(ev) => {
                            ev.preventDefault();
                            ev.stopPropagation();
                            setHamburgerOpen(true)
                            console.log('You just clicked on hamburger')

                            if (hamburgerOpen) 
                                return;

                            makeMenu(
                                props.onTabSwitched,
                                props.tabs,
                                props.selectedTab,
                                ev.clientX,
                                ev.clientY,
                                () => setHamburgerOpen(false),
                            );
                        }}
                    >
                        <img
                            className='h-[75%]'
                            src={GridThreeUpImg}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function NavigationBarStandard<TK extends string>(props: {
    onTabSwitched: (tk: TK) => void,
    tabs: Tabs<TK>,
    selectedTab: TK,
}) {
    const location = useLocation();

    // Check if we're in a DNATCO analysis view where we want to preserve Mol* state
    const isInAnalysisView = location.pathname.match(/^\/app\/dnatco\/(annotation|validation|refinement|downloads)/);

    return (
        <div className='w-full navigation-desktop flex justify-around items-center my-2'>
            <div>
                {isInAnalysisView ? (
                    <a href='/' target='_blank' rel='noopener noreferrer'>
                        <img className='w-24' src={DnatcoLogoImg} alt='dnatco logo'/>
                    </a>
                ) : (
                    <Link to='/'>
                        <img className='w-24' src={DnatcoLogoImg} alt='dnatco logo'/>
                    </Link>
                )}
            </div>
            <EquiBox
                padding={33}
                orientation='row'
            >
                {makeTabs(props.onTabSwitched, props.tabs, props.selectedTab)}
            </EquiBox>
        </div>
    );
}

export function NavigationBar<TK extends string>(props: {
    onTabSwitched: (tk: TK) => void,
    tabs: Record<TK, {
        icon: string,
        caption: string,
        enabled: boolean,
        noCaps?: boolean,
    }>,
    selectedTab: TK,
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
