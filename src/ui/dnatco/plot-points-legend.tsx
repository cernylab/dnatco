import React from 'react';

const DefaultProps = {
    normal: true,
    current: true,
    computed: false,
};

const SymbolStyle = {
    fontSize: 'var(--font-large)',
    fontWeight: 'bold',
};

export function PlotPointsLegend(props: Partial<{
    normal: boolean,
    current: boolean,
    computed: boolean
}>) {
    const show = { ...DefaultProps, ...props };
    return (
        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'row', gap: 'var(--h-gap)', justifyContent: 'center' }}>
            {show.normal ? <div><span style={SymbolStyle}>{'\u23FA'}</span> - NtC</div> : void 0}
            {show.current ? <div><span style={SymbolStyle}>{'\u2715'}</span> - Currently shown NtC</div> : void 0}
            {show.computed ? <div><span style={SymbolStyle}>{'\u23F9'}</span> - Computed NtC</div> : void 0}
        </div>
    );
}
