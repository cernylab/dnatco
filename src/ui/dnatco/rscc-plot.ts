// @ts-ignore DefinitelyTyped does not have definitions for this flavor of plotly.js. Sadge...
import { Data as PlotlyData } from 'plotly.js-cartesian-dist';
import { Dnatcofication } from '../../dnatco/dnatcofication';
import { Rscc } from '../../dnatco/rscc';
import { StepsMapper } from '../../dnatco/steps-mapper';
import { niceStepNameText } from '../../util/dnatco';

/*const Colorscale = [
    [0, 'rgb(210, 210, 210)'],
    [0.17, 'rgb(183, 183, 183)'],
    [0.33, 'rgb(156, 156, 156)'],
    [0.50, 'rgb(129, 129, 129)'],
    [0.67, 'rgb(102, 102, 102)'],
    [0.83, 'rgb(75, 75, 75)'],
    [1, 'rgb(48, 48, 48)']
] as Plotly.ColorScale;*/
const CrossColorHappySalmon = 'rgb(111, 227, 0)';
const CrossColorSadSalmon = 'rgb(253, 66, 0)';

const RsccContourData = {
    x: [] as number[],
    y: [] as number[],
    z: [[]] as number[][],
    levels: [] as number[],
    distribution: [0, 0, 0, 0] as Rscc.BackdropRscc['distribution'],
};

const RsccXYData = {
    x: new Array<number>(),
    y: new Array<number>(),
    tags: new Array<string>(),
    stepIds: new Array<number>(),
    colors: new Array<string>(),

    xSel: new Array<number>(),
    ySel: new Array<number>(),
    tagsSel: new Array<string>(),
    stepIdsSel: new Array<number>(),
    colorsSel: new Array<string>(),
};

export namespace RsccPlot {
    function annotateDistribution(v: number) {
        return `${v.toFixed(1)} %`;
    }

    function headAndTail<T>(x: T[]): [ head: T, tail: T ] {
        return [ x[0], x[x.length - 1] ];
    }

    function makeRsccContourData(backdrop: Rscc.BackdropRscc): RsccContourData {
        // This now just copies the content of what we got from
        return {
            x: [...backdrop.x],
            y: [...backdrop.y],
            z: [...backdrop.z.map(zr => [...zr])],
            levels: [...backdrop.levels],
            distribution: { ...backdrop.distribution }
        };
    }

    function minAndMax(arr: number[][]): { min: number, max: number } {
        let min = Number.MAX_VALUE;
        let max = Number.MIN_VALUE;
        for (const v of arr.flat()) {
            if (v < min)
                min = v;
            if (v > max)
                max = v;
        }

        return { min, max };
    }

    export type RsccContourData = typeof RsccContourData;

    export type RsccPlotData = {
        xy: RsccXYData;
        contour: RsccContourData,
    }

    export type RsccXYData = typeof RsccXYData;

    export function isPlotEmpty(data: RsccPlotData) {
        return data.xy.x.length === 0;
    }

    export function makeData(stru: Rscc.StepRscc[], backdrop: Rscc.BackdropRscc, selectedStepId: number|undefined, d: Dnatcofication): RsccPlotData {
        if (stru.length < 1)
            return { xy: RsccXYData, contour: RsccContourData };

        const SL = selectedStepId === undefined ? 0 : 1;
        const L = stru.length - SL;

        const x = new Array<number>(L);
        const y = new Array<number>(L);
        const tags = new Array<string>(L);
        const stepIds = new Array<number>(L);
        const colors = new Array<string>(L);

        const xSel = new Array<number>(SL);
        const ySel = new Array<number>(SL);
        const tagsSel = new Array<string>(SL);
        const stepIdsSel = new Array<number>(SL);
        const colorsSel = new Array<string>(SL);

        for (let idx = 0; idx < stru.length; idx++) {
            const v = stru[idx];
            const step = StepsMapper.byId(d, v.stepId);

            if (selectedStepId === v.stepId) {
                xSel[idx] = v.hRscc;
                ySel[idx] = v.rmsd;
                tagsSel[idx] = niceStepNameText(step);
                stepIdsSel[idx] = v.stepId;
                colorsSel[idx] = CrossColorHappySalmon;
            } else {
                x[idx] = v.hRscc;
                y[idx] = v.rmsd;
                tags[idx] = niceStepNameText(step);
                stepIds[idx] = v.stepId;
                colors[idx] = CrossColorSadSalmon;
            }
        }

        return {
            xy: { x, y, tags, stepIds, colors, xSel, ySel, tagsSel, stepIdsSel, colorsSel },
            contour: !Rscc.isBackdropRsccEmpty(backdrop) ? makeRsccContourData(backdrop) : RsccContourData
        };
    }

    export function makePlotlyData(xy: RsccXYData, contour: RsccContourData, automargin = false): PlotlyData[] {
        const plotType = 'scatter';
        const zMinMax = minAndMax(contour.z);
        const zRng = zMinMax.max - zMinMax.min;

        const allContours = contour.levels.map(v => {
            const clr = 128 - Math.round(128 * (v - zMinMax.min) / zRng);
            const clrstr = `rgb(${clr}, ${clr}, ${clr})`;

            return {
                ...contour,
                type: 'contour',
                contours: {
                    coloring: 'lines',
                    type: 'levels',
                    start: v,
                    end: v,
                },
                autocontour: false,
                colorscale: [[0, clrstr], [1, clrstr]],
                hoverinfo: 'none',
                line: {
                    width: 2,
                },
                showscale: false,
                showlegend: false,
                automargin,
            } as PlotlyData;
        });

        return [
            ...allContours,
            {
                x: xy.x,
                y: xy.y,
                text: xy.tags,
                customdata: xy.stepIds,
                type: plotType,
                mode: 'markers',
                marker: { size: 7, color: xy.colors, symbol: 'x' },
                hoverinfo: 'text',
                showlegend: false,
                automargin,
            },
            {
                x: xy.xSel,
                y: xy.ySel,
                text: xy.tagsSel,
                customdata: xy.stepIdsSel,
                type: plotType,
                mode: 'markers',
                marker: { size: 7, color: xy.colorsSel, symbol: 'x' },
                hoverinfo: 'text',
                showlegend: false,
                automargin,
            },
            {
                x: headAndTail(contour.x),
                y: [1, 1],
                type: plotType,
                mode: 'lines',
                line: {
                    color: 'black',
                    width: 2,
                },
                hoverinfo: 'none',
                showlegend: false,
                automargin,
            },
            {
                x: [0.8, 0.8],
                y: headAndTail(contour.y),
                type: plotType,
                mode: 'lines',
                line: {
                    color: 'black',
                    width: 2,
                },
                hoverinfo: 'none',
                showlegend: false,
                automargin,
            },
            {
                x: [ 0.85, 0.65, 0.65, 0.85 ],
                y: [ 1.25, 1.25, 0.75, 0.75 ],
                text: [
                    annotateDistribution(contour.distribution[0]),
                    annotateDistribution(contour.distribution[1]),
                    annotateDistribution(contour.distribution[2]),
                    annotateDistribution(contour.distribution[3])
                ],
                type: plotType,
                mode: 'text',
                textfont: {
                    color: 'black',
                    family: 'helvetica',
                    size: 22,
                },
                textposition: 'middle right',
                hoverinfo: 'none',
                showlegend: false,
                automargin,
            }
        ] as PlotlyData[];
    }

    export function requestedKinds(modelIndex: number, d: Dnatcofication): { assigned: Rscc.BackdropRsccKind, unassigned: Rscc.BackdropRsccKind } {
        const kind = d.nucleicAcidKind(modelIndex);

        if (kind === 'RNA')
            return { assigned: 'rna-assigned', unassigned: 'rna-unassigned' };
        else
            return { assigned: 'dna-assigned', unassigned: 'dna-unassigned' };
    }
}
