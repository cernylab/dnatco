import React from 'react';

export function StatsBar(props: { counts: number[], colors: string[] }) {
    const sum = props.counts.reduce((p, c) => p + c, 0);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [widths, setWidths] = React.useState<number[]>([]);

    React.useEffect(() => {
        if (!containerRef.current) return;

        const containerWidth = containerRef.current.offsetWidth;
        const MIN_VISIBLE_PX = 2; // Minimum width in pixels for non-zero counts

        const calculatedWidths = new Array<number>(props.counts.length);
        let totalWidth = 0;

        // First pass: calculate widths with minimum
        for (let idx = 0; idx < props.counts.length; idx++) {
            const n = props.counts[idx];
            if (n === 0) {
                calculatedWidths[idx] = 0;
            } else {
                const proportionalWidth = Math.floor((n / sum) * containerWidth);
                calculatedWidths[idx] = proportionalWidth >= MIN_VISIBLE_PX ? proportionalWidth : MIN_VISIBLE_PX;
                totalWidth += calculatedWidths[idx];
            }
        }

        // Second pass: distribute remaining pixels to maintain exact container width
        const remaining = containerWidth - totalWidth;
        if (remaining > 0) {
            // Add remaining pixels to the largest segments
            const nonZeroIndices = calculatedWidths
                .map((w, idx) => ({ width: w, index: idx }))
                .filter(item => item.width > 0)
                .sort((a, b) => b.width - a.width);

            for (let i = 0; i < remaining && i < nonZeroIndices.length; i++) {
                calculatedWidths[nonZeroIndices[i].index]++;
            }
        } else if (remaining < 0) {
            // Remove excess pixels from the largest segments
            const nonZeroIndices = calculatedWidths
                .map((w, idx) => ({ width: w, index: idx }))
                .filter(item => item.width > MIN_VISIBLE_PX)
                .sort((a, b) => b.width - a.width);

            for (let i = 0; i < -remaining && i < nonZeroIndices.length; i++) {
                calculatedWidths[nonZeroIndices[i].index]--;
            }
        }

        setWidths(calculatedWidths);
    }, [props.counts, props.colors, sum]);

    const blocks = new Array<JSX.Element>();
    for (let idx = 0; idx < widths.length; idx++) {
        if (widths[idx] > 0) {
            blocks.push(
                <div
                    style={{ width: `${widths[idx]}px`, backgroundColor: props.colors[idx] }}
                    key={idx}
                />
            );
        }
    }

    return <div ref={containerRef} className='flex flex-row w-full h-full'>{blocks}</div>;
}
