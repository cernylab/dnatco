import React from 'react';
import Plot from 'react-plotly.js';
import { Validation } from './common';
import { View } from '../view';
import { isOk } from '../../../../dnatco';
import { Rscc } from '../../../../dnatco/rscc';

interface State {
    z: number[][];
}

export class RsccPlot extends View<View.Props, State> {
    constructor(props: View.Props) {
        super(props);

        this.state = {
            z: [[]],
        }
    }

    private plotData(rscc: number[]) {
        const Sparsity = 10;
        const Steps = Math.floor(rscc.length / Sparsity);
        const HSteps = Steps / 2;

        if (Steps < 1)
            return [[]];

        const z: number[][] = [];
        for (let ydx = 0; ydx < Steps; ydx++) {
            const _z = new Array<number>(Steps);

            const yd = HSteps - Math.abs(ydx - HSteps);
            for (let xdx = 0; xdx < Steps; xdx++) {
                const zdx = xdx * Sparsity >= rscc.length ? rscc.length - 1 : xdx * Sparsity;
                const xd = HSteps - Math.abs(xdx - HSteps);
                _z[xdx] = (xd + yd) * rscc[zdx];
            }
            z.push(_z);
        }

        return z;
    }

    componentDidMount() {
        const pdbId = this.props.dnatcofication.pdbId;

        // WARN: This may trigger an error of the component unmounts before the request completes!!!
        // We will rewrite this code anyway so we can ignore for the time being...
        Rscc.structureRscc(pdbId).then(res => {
            if (isOk(res)) {
                this.setState({ ...this.state, z: this.plotData(res.data) });
            } else {
                console.log(`RSCC data error: ${res.message}`);
            }
        });
    }

    render() {
        return (
            <div>
                <div className='rdo-offset'>
                    <Plot
                        data={[
                            {
                                z: this.state.z,
                                type: 'contour',
                                contours: {
                                    coloring: 'heatmap',
                                    labelfont: {
                                        color: 'black',
                                        family: 'monospace'
                                    },
                                    showlabels: true,
                                }
                            }
                        ]}
                        layout={{
                            autosize: true,
                            dragmode: 'pan',
                            hovermode: 'closest'
                        }}
                        config={{
                            scrollZoom: true,
                        }}
                    />
                </div>
            </div>
        );
    }
}

export namespace RsccPlot {
    export const StepSwitcher = Validation.switchStep;
}
