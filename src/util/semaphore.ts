import { clamp } from './';
import { Rgb } from './colors';

const Half = 0.5;
function semaphoreColor(v: number): Rgb {
    const r = Math.round(255 * (2 * v < 1 ? 2 * v : 1));
    const g = Math.round(255 * (1 - 2 * (v - Half > 0 ? v - Half : 0)));

    return Rgb(r, g, 0);
}

export function valueToSemaphore(v: number, greenValue: number, redValue: number) {
    const reverse = redValue < greenValue;
    const Inv = reverse ? 1.0 : 0.0;
    const Min = reverse ? redValue : greenValue;
    const Span = redValue - greenValue;

    const normalized = clamp(Inv + (v - Min) / Span, 0.0, 1.0);

    return semaphoreColor(normalized);
}

export namespace GappedSemaphore {
    export type Segment = { from: number, to: number };
    export type Mapping = { mappedFrom: number, mappedTo: number, segment: Segment }[];

    export function makeMapping(segments: Segment[]) {
        const range = segments.map((seg) => seg.to - seg.from).reduce((p, c) => p + c, 0);

        const mapping: Mapping = [];
        let lastMappedFrom = 0.0;
        for (const seg of segments) {
            const relWidth = (seg.to - seg.from) / range;
            const to = lastMappedFrom + relWidth;

            mapping.push({ mappedFrom: lastMappedFrom, mappedTo: to, segment: seg });
            lastMappedFrom = to;
        }

        return mapping;
    }

    export function toSemaphore(v: number, greenValue: number, redValue: number, mapping: Mapping) {
        // Clamp the value to the given range as if we had normal "non-gapped" semaphore
        const reverse = redValue < greenValue;
        const Inv = reverse ? 1.0 : 0.0;
        const Min = reverse ? redValue : greenValue;
        const Span = redValue - greenValue;
        const normalized = clamp(Inv + (v - Min) / Span, 0.0, 1.0);

        // Find the mapped segment
        const ms = normalized === 1.0
            ? mapping[mapping.length - 1]
            : mapping.find((ms) => normalized >= ms.mappedFrom && normalized < ms.mappedTo);
        if (!ms)
            throw new Error('No mapping for value ' + normalized);

        // Remap back to the segment range
        const sv = (normalized - ms.mappedFrom) * (ms.segment.to - ms.segment.from) / (ms.mappedTo - ms.mappedFrom) + ms.segment.from;

        return semaphoreColor(sv);
    }
}
