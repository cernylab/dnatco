import React from 'react';

export function StatsBar(props: { counts: number[], colors: string[] }) {
    const sum = props.counts.reduce((p, c) => p + c, 0);

    const blocks = new Array<JSX.Element>();
    for (let idx = 0; idx < props.counts.length; idx++) {
        const n = props.counts[idx];
        if (n > 0) {
            // Use flex-grow based on the count to make it responsive
            const flexGrow = n / sum;
            blocks.push(
                <div
                    className="h-full"
                    style={{
                        flexGrow: flexGrow,
                        flexShrink: flexGrow,
                        flexBasis: 0,
                        minWidth: n > 0 ? '2px' : '0',
                        backgroundColor: props.colors[idx]
                    }}
                    key={idx}
                />
            );
        }
    }

    return <div className='flex flex-row w-full h-full'>{blocks}</div>;
}
