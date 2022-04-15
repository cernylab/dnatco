import React from 'react';
import Plot from 'react-plotly.js';
import { View } from './view';

export class SimilarityPlots extends View {
    render() {
        return (
            <div className='rdo-offset'>
                <div className='rdo-plot-container'>
                    <Plot
                        data={[
                            {
                                x: [1, 2, 3],
                                y: [4, 5, 6],
                                marker: { size: 10 },
                                mode: 'text+markers',
                                textposition: 'top center',
                                type: 'scattergl',
                            },
                        ]}
                        layout={{
                            dragmode: 'pan',
                            hovermode: 'closest',
                            xaxis: { title: 'Cartesian RMSD [Å]' },
                            yaxis: { title: 'Euclidean distance [degrees]' },
                        }}
                        config={{
                            responsive: true,
                            scrollZoom: true,
                        }}
                    />
                </div>

                <div className='rdo-plot-container'>
                    <Plot
                        data={[
                            {
                                x: [1, 2, 3],
                                y: [6, 5, 4],
                                marker: { size: 10 },
                                mode: 'text+markers',
                                textposition: 'top center',
                                type: 'scattergl',
                            },
                        ]}
                        layout={{
                            dragmode: 'pan',
                            hovermode: 'closest',
                            xaxis: { title: 'C5 distance [Å]' },
                            yaxis: { title: 'O3 distance [Å]' },
                        }}
                        config={{
                            responsive: true,
                            scrollZoom: true,
                        }}
                    />
                </div>
            </div>
        );
    }
}
