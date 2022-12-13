import React from 'react';
import Plot from 'react-plotly.js';
import { Validation } from './common';
import { ModelSelect } from '../structure-selectors';
import { View } from '../view';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { isOk } from '../../../../dnatco';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { Rscc } from '../../../../dnatco/rscc';
import { StepsMapper } from '../../../../dnatco/steps-mapper';
import {InvalidModelIndex} from '../../structure-selection';

const MinRscc = 0.0;
const MaxRscc = 1.0;
const NGridCells = 25;
const RsccSpan = MaxRscc - MinRscc;
const XArray = (() => {
    const x = new Array<number>(NGridCells);
    for (let idx = 0; idx < NGridCells; idx++)
        x[idx] = MinRscc + idx * RsccSpan / (NGridCells - 1); // -1 to inclusively cover the entire range

    return x;
})();
const Colorscale = [[0, 'rgba(255, 255, 255, 0)'], [0.5, 'yellow'], [1, 'blue']] as Plotly.ColorScale;

function cellIndex(v: number, min: number, span: number, nCells: number) {
    const sv = v - min;
    if (sv === 0.0)
        return 0;
    else if (sv === span)
        return nCells - 1;
    else
        return Math.floor((v - min) / span * nCells);
}

function makeData(rscc: Rscc.StepRscc[], totalStepCount: number) {
    return rscc.length > 0
        ? { xy: { x: rscc.map(v => v.hRscc), y: rscc.map(v => v.rmsd) },
            contour: rscc.length > 0 ? makeRsccContourData(rscc, totalStepCount) : RsccContourData }
        : { xy: RsccXYData, contour: RsccContourData };
}

function makeRsccContourData(rscc: Rscc.StepRscc[], totalStepCount: number): RsccContourData {
    const data = Array.from(rscc.values());
    const MinRmsd = 0;
    const MaxRmsd = Math.max(...data.map(x => x.rmsd));
    const RmsdSpan = MaxRmsd - MinRmsd;

    const y = new Array<number>(NGridCells);
    for (let idx = 0; idx < NGridCells + 0; idx++)
        y[idx] = MinRmsd + idx * RmsdSpan / (NGridCells - 1); // -1 to inclusively cover the entire range

    // Create a grid for Z values
    const z = new Array<Array<number>>(NGridCells);
    for (let ydx = 0; ydx < NGridCells; ydx++) {
        const _y = new Array<number>(NGridCells);
        for (let xdx = 0; xdx < NGridCells; xdx++ ) {
            _y[xdx] = 0;
        }
        z[ydx] = _y;
    }

    for (const item of data) {
        const xdx = cellIndex(item.hRscc, MinRscc, RsccSpan, NGridCells);
        const ydx = cellIndex(item.rmsd, MinRmsd, RmsdSpan, NGridCells);
        if (xdx >= 0 && xdx < NGridCells && ydx >= 0 && ydx < NGridCells)
            z[ydx][xdx]++;
    }

    for (let ydx = 0; ydx < NGridCells; ydx++) {
        const _y = z[ydx];
        for (let xdx = 0; xdx < NGridCells; xdx++)
            _y[xdx] = 100 * _y[xdx] / totalStepCount;
    }

    return { x: XArray, y: y, z };
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

const RsccContourData = {
    x: new Array<number>(),
    y: new Array<number>(),
    z: [[]] as number[][],
};
type RsccContourData = typeof RsccContourData;

const RsccXYData = {
    x: [] as number[],
    y: [] as number[],
};
type RsccXYData = typeof RsccXYData;

interface State {
    assigned: {
        xy: RsccXYData;
        contour: RsccContourData,
    },
    unassigned: {
        xy: RsccXYData;
        contour: RsccContourData,
    },
}
export class RsccPlot extends View<View.Props, State> {
    constructor(props: View.Props) {
        super(props);

        this.state = {
            assigned: {
                xy: RsccXYData,
                contour: RsccContourData,
            },
            unassigned: {
                xy: RsccXYData,
                contour: RsccContourData,
            },
        }
    }

    private fetchRsccData() {
        const mIdx = this.props.structureSelection.modelIndex !== InvalidModelIndex ? 0 : this.props.structureSelection.modelIndex;

        // WARN: This may trigger an error of the component unmounts before the request completes!!!
        // We will rewrite this code anyway so we can ignore for the time being...
        Rscc.structureRscc(this.props.dnatcofication, mIdx).then(res => {
            if (isOk(res)) {
                const data = res.data;
                const totalStepCount = StepsMapper.segment(this.props.dnatcofication, mIdx).length;
                this.setState({
                    ...this.state,
                    assigned: makeData(data.assigned, totalStepCount),
                    unassigned: makeData(data.unassigned, totalStepCount),
                });
            } else {
                console.log(`RSCC data error: ${res.message}`);
            }
        });
    }

    private renderPlot(xy: RsccXYData, contour: RsccContourData) {
        const zRng = minAndMax(contour.z);
        const ContourStep = (zRng.max - zRng.min) / 5;

        return (
            <Plot
                data={[
                    {
                        ...contour,
                        type: 'contour',
                        contours: {
                            coloring: 'fill',
                            size: ContourStep,
                            start: zRng.min,
                            end: zRng.max
                        },
                        autocontour: false,
                        colorscale: Colorscale,
                    },
                    {
                        x: xy.x,
                        y: xy.y,
                        type: 'scattergl',
                        mode: 'markers',
                        marker: { size: 5, color: 'orange', symbol: 'x' },
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
                }}
                config={{
                    scrollZoom: true,
                }}
                useResizeHandler={true}
                style={{ width: "100%", height: "100%" }}
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

        return (
            <div>
                { numModels > 1
                    ? <NamedList>
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
                <div className='rdo-plot-container'>
                    { this.state.assigned.xy.x.length > 0
                        ? this.renderPlot(this.state.assigned.xy, this.state.assigned.contour)
                        : <div>There are no assigned steps in this structure</div>
                    }
                </div>
                <div className='rdo-secondary-caption'>RSCC(*) vs RMSD plot of unassigned steps</div>
                <div className='rdo-plot-container'>
                    { this.state.unassigned.xy.x.length > 0
                        ? this.renderPlot(this.state.unassigned.xy, this.state.unassigned.contour)
                        : <div>There are no unassigned steps in this structure</div>
                    }
                </div>
            </div>
        );
    }
}

export namespace RsccPlot {
    export const StepSwitcher = Validation.switchStep;
}
