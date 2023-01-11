import React from 'react';
import Plot from 'react-plotly.js';
import { Validation } from './common';
import { ModelSelect } from '../structure-selectors';
import { View } from '../view';
import { Constants } from '../../constants';
import { niceStepNameText } from '../../common';
import { InvalidModelIndex, InvalidStepId } from '../../structure-selection';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { OkResult, isOk } from '../../../../dnatco';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { Rscc } from '../../../../dnatco/rscc';
import { StepsMapper } from '../../../../dnatco/steps-mapper';

const Colorscale = [
    [0, 'rgb(210, 210, 210)'],
    [0.17, 'rgb(183, 183, 183)'],
    [0.33, 'rgb(156, 156, 156)'],
    [0.50, 'rgb(129, 129, 129)'],
    [0.67, 'rgb(102, 102, 102)'],
    [0.83, 'rgb(75, 75, 75)'],
    [1, 'rgb(48, 48, 48)']
] as Plotly.ColorScale;
const CrossColorHappySalmon = 'rgb(111, 227, 0)';
const CrossColorSadSalmon = 'rgb(253, 66, 0)';

const RsccContourData = {
    x: [] as number[],
    y: [] as number[],
    z: [[]] as number[][],
    distribution: [0, 0, 0, 0] as Rscc.BackdropRscc['distribution'],
};
type RsccContourData = typeof RsccContourData;

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
type RsccXYData = typeof RsccXYData;

type RsccPlotData = {
    xy: RsccXYData;
    contour: RsccContourData,
}

function annotateDistribution(v: number) {
    return `${v.toFixed(1)} %`;
}

function headAndTail<T>(x: T[]): [ head: T, tail: T ] {
    return [ x[0], x[x.length - 1] ];
}

function isPlotEmpty(data: RsccPlotData) {
    return data.xy.x.length === 0;
}

function makeData(stru: Rscc.StepRscc[], backdrop: Rscc.BackdropRscc, selectedStepId: number, d: Dnatcofication): RsccPlotData {
    if (stru.length < 1)
        return { xy: RsccXYData, contour: RsccContourData };

    const SL = selectedStepId === InvalidStepId ? 0 : 1;
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

function makeRsccContourData(backdrop: Rscc.BackdropRscc): RsccContourData {
    const MinRscc = backdrop.rsccMinPlotted;
    const MaxRscc = backdrop.rsccMaxPlotted;
    const SpanRscc = MaxRscc - MinRscc;

    const MinRmsd = backdrop.rmsdMinPlotted;
    const MaxRmsd = backdrop.rmsdMaxPlotted;
    const SpanRmsd = MaxRmsd - MinRmsd;

    const x = new Array<number>(backdrop.rsccCells);
    for (let idx = 0; idx < backdrop.rsccCells; idx++)
        x[idx] = MinRscc + idx * SpanRscc / (backdrop.rsccCells - 1); // -1 to inclusively cover the entire range

    const y = new Array<number>(backdrop.rmsdCells);
    for (let idx = 0; idx < backdrop.rmsdCells; idx++)
        y[idx] = MinRmsd + idx * SpanRmsd / (backdrop.rmsdCells - 1); // -1 to inclusively cover the entire range

    return { x, y, z: backdrop.z, distribution: backdrop.distribution };
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

function requestedKinds(kind: 'DNA' | 'RNA' | 'hybrid' | 'unknown'): { assigned: Rscc.BackdropRsccKind, unassigned: Rscc.BackdropRsccKind } {
    if (kind === 'RNA')
        return { assigned: 'rna-assigned', unassigned: 'rna-unassigned' };
    else
        return { assigned: 'dna-assigned', unassigned: 'dna-unassigned' };
}

interface State {
    stru: Rscc.StructureRscc;
    backdropAssigned: Rscc.BackdropRscc;
    backdropUnassigned: Rscc.BackdropRscc;
    fetchFailed: boolean;
}
export class RsccPlot extends View<View.Props, State> {
    constructor(props: View.Props) {
        super(props);

        this.state = {
            stru: {
                assigned: [],
                unassigned: [],
            },
            backdropAssigned: Rscc.emptyBackdropRscc(),
            backdropUnassigned: Rscc.emptyBackdropRscc(),
            fetchFailed: false,
        };
    }

    private async fetchRsccData() {
        const mIdx = this.props.structureSelection.modelIndex !== InvalidModelIndex ? 0 : this.props.structureSelection.modelIndex;

        // WARN: This may trigger an error if the component unmounts before the request completes!!!
        // We will rewrite this code anyway so we can ignore this for the time being...

        const kinds = requestedKinds(this.props.dnatcofication.nucleicAcidKind(mIdx));

        const struRsccReq = Rscc.structureRscc(this.props.dnatcofication, mIdx);
        const backdropAssignedReq = Rscc.backdropRscc(kinds.assigned);
        const backdropUnassignedReq = Rscc.backdropRscc(kinds.unassigned);

        const struRsccRes = await struRsccReq;
        const backdropAssignedRes = await backdropAssignedReq;
        const backdropUnassignedRes = await backdropUnassignedReq;

        let fetchFailed = false;
        if (!isOk(struRsccRes)) {
            console.log(`Structure RSCC data error: ${struRsccRes.message}`);
            fetchFailed = true;
        }
        if (!isOk(backdropAssignedRes)) {
            console.log(`Backdrop-assigned RSCC data error: ${backdropAssignedRes.message}`);
            fetchFailed = true;
        }
        if (!isOk(backdropUnassignedRes)) {
            console.log(`Backdrop-unassigned RSCC data error: ${backdropUnassignedRes.message}`);
            fetchFailed = true;
        }

        if (fetchFailed) {
            this.setState({
                ...this.state,
                stru: { assigned: [], unassigned: [] },
                backdropAssigned: Rscc.emptyBackdropRscc(),
                backdropUnassigned: Rscc.emptyBackdropRscc(),
                fetchFailed,
            });
        } else {
            this.setState({
                ...this.state,
                stru: (struRsccRes as OkResult<Rscc.StructureRscc>).data,
                backdropAssigned: (backdropAssignedRes as OkResult<Rscc.BackdropRscc>).data,
                backdropUnassigned: (backdropUnassignedRes as OkResult<Rscc.BackdropRscc>).data,
            });
        }
    }

    private makePlotData(): { assigned: RsccPlotData, unassigned: RsccPlotData } {
        const { stru, backdropAssigned, backdropUnassigned } = this.state;

        const assigned = makeData(
            stru.assigned,
            backdropAssigned,
            this.props.structureSelection.stepId,
            this.props.dnatcofication
        );
        const unassigned = makeData(
            stru.unassigned,
            backdropUnassigned,
            this.props.structureSelection.stepId,
            this.props.dnatcofication
        );

        return { assigned, unassigned };
    }

    private renderPlot(xy: RsccXYData, contour: RsccContourData) {
        const zRng = minAndMax(contour.z);
        const ContourStep = (zRng.max - zRng.min) / 6;

        return (
            <Plot
                data={[
                    {
                        ...contour,
                        type: 'contour',
                        contours: {
                            coloring: 'lines',
                            size: ContourStep,
                            start: zRng.min,
                            end: zRng.max,
                        },
                        autocontour: false,
                        colorscale: Colorscale,
                        hoverinfo: 'none',
                        line: {
                            width: 2,
                        },
                        showscale: false,
                    },
                    {
                        x: xy.x,
                        y: xy.y,
                        text: xy.tags,
                        customdata: xy.stepIds,
                        type: 'scattergl',
                        mode: 'markers',
                        marker: { size: 7, color: xy.colors, symbol: 'x' },
                        hoverinfo: 'text',
                        showlegend: false,
                    },
                    {
                        x: xy.xSel,
                        y: xy.ySel,
                        text: xy.tagsSel,
                        customdata: xy.stepIdsSel,
                        type: 'scattergl',
                        mode: 'markers',
                        marker: { size: 7, color: xy.colorsSel, symbol: 'x' },
                        hoverinfo: 'text',
                        showlegend: false,
                    },
                    {
                        x: headAndTail(contour.x),
                        y: [1, 1],
                        type: 'scattergl',
                        mode: 'lines',
                        line: {
                            color: 'black',
                            width: 2,
                        },
                        hoverinfo: 'none',
                        showlegend: false,
                    },
                    {
                        x: [0.8, 0.8],
                        y: headAndTail(contour.y),
                        type: 'scattergl',
                        mode: 'lines',
                        line: {
                            color: 'black',
                            width: 2,
                        },
                        hoverinfo: 'none',
                        showlegend: false,
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
                        type: 'scattergl',
                        mode: 'text',
                        textfont: {
                            color: 'black',
                            family: 'helvetica',
                            size: 22,
                        },
                        textposition: 'middle right',
                        hoverinfo: 'none',
                        showlegend: false,
                    }
                ]}
                layout={{
                    autosize: true,
                    dragmode: 'pan',
                    hovermode: 'closest',
                    xaxis: { title: 'RSCC', automargin: true },
                    yaxis: { title: 'RMSD [Å]', automargin: true },
                    plot_bgcolor: 'white',
                    paper_bgcolor: 'white',
                    uirevision: 'true',
                    margin: {
                        t: 0,
                        r: 25,
                    },
                    modebar: {
                        orientation: 'v',
                    }
                }}
                config={{
                    scrollZoom: true,
                }}
                useResizeHandler={true}
                style={{ width: "100%", height: "100%" }}
                onClick={ev => {
                    const pt = ev.points[0];
                    if (pt) {
                        const datum = pt.customdata;
                        if (typeof datum === 'number')
                            this.props.switching.switchStepId(datum);
                    }
                }}
            />
        );
    }

    componentDidMount() {
        this.fetchRsccData();
    }

    componentDidUpdate(prevProps: View.Props) {
        if (prevProps.structureSelection.modelIndex !== this.props.structureSelection.modelIndex)
            this.fetchRsccData();
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        const numModels = Dnatcofication.Structure.numberOfModels(this.props.dnatcofication);
        const rsccPlotData = this.makePlotData();

        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                { numModels > 1
                    ? <NamedList sizing='min-content' rowSpacing='half'>
                        <NamedListItem name='Model'>
                            <ModelSelect
                                dnatcofication={this.props.dnatcofication}
                                structureSelection={this.props.structureSelection}
                                onChange={this.props.switching.switchModel}
                                hideAllModelsOption={true}
                            />
                        </NamedListItem>
                    </NamedList>
                    : undefined
                }

                <div className='rdo-secondary-caption'>RSCC(*) vs RMSD plot of assigned steps</div>
                <div className='rdo-plot-container' style={{ flex: 1, minHeight: Constants.MinimumFlexiblePlotHeight }}>
                    { isPlotEmpty(rsccPlotData.assigned)
                        ? this.state.fetchFailed
                            ? <div>Unable to get RSCC data</div>
                            : <div>There are no assigned steps in this structure</div>
                        : this.renderPlot(rsccPlotData.assigned.xy, rsccPlotData.assigned.contour)
                    }
                </div>

                <div className='rdo-secondary-caption'>RSCC(*) vs RMSD plot of unassigned steps</div>
                <div className='rdo-plot-container' style={{ flex: 1, minHeight: Constants.MinimumFlexiblePlotHeight }}>
                    { isPlotEmpty(rsccPlotData.unassigned)
                        ? this.state.fetchFailed
                            ? <div>Unable to get RSCC data</div>
                            : <div>There are no unassigned steps in this structure</div>
                        : this.renderPlot(rsccPlotData.unassigned.xy, rsccPlotData.unassigned.contour)
                    }
                </div>
            </div>
        );
    }
}

export namespace RsccPlot {
    export const StepSwitcher = Validation.switchStep;
}
