import React from 'react';

export function StatsBar(props: { counts: number[], colors: string[] }) {
    const sum = props.counts.reduce((p, c) => p + c, 0);

    const blocks = new Array<JSX.Element>();
    let accum = 0;
    for (let idx = 0; idx < props.counts.length - 1; idx++) {
        const n = props.counts[idx];
        if (n === 0)
            continue;

        const w = Math.round(100 * n / sum);
        if (w > 0) {
            blocks.push(<div style={{ flex: w, backgroundColor: props.colors[idx] }} key={idx} />);
            accum += w;
        }
    }

    blocks.push(<div style={{ flex: (100 - accum), backgroundColor: props.colors[props.colors.length - 1] }} key={props.counts.length - 1} />);

    return <div className='flex flex-row w-full h-full'>{blocks}</div>;
}
