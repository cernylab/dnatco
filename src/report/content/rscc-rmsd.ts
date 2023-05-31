import { type PlotData } from 'plotly.js';
import { Report } from '../';
import { Layout } from '../layout';
import { NTDocument } from '../nottex/document';
import { isOk } from '../../dnatco';
import { Dnatcofication } from '../../dnatco/dnatcofication';
import { Rscc } from '../../dnatco/rscc';
import { RsccPlot } from '../../ui/dnatco/rscc-plot';
import { ImageSerialization } from '../../util/image-serialization';

async function drawImage<Output>(data: RsccPlot.RsccPlotData, title: string, root: NTDocument<Output>) {
    const layout = {
        xaxis: { title: 'RSCC', automargin: true, tickfont: { size: 32 }, titlefont: { size: 32 } },
        yaxis: { title: 'RMSD [Å]', automargin: true,  tickfont: { size: 32 }, titlefont: { size: 32 } },
        plot_bgcolor: 'white',
        paper_bgcolor: 'white',
    };

    const plotlyData = RsccPlot.makePlotlyData(data.xy, data.contour, true, false) as PlotData[];
    const img = await ImageSerialization.toImage(plotlyData, layout, 1500, 1500, 'png');

    root.image(
        'png',
        img.buffer,
        {
            caption: title,
            captionPosition: 'above',
            captionHAlign: 'center',
            hAlign: 'center',
            scale: 0.33
        }
    );
}

export namespace RsccRmsd {
    export async function add<Output>(ctx: Report.Context<Output>) {
        const root = ctx.ntDoc;

        // --- HEADER ---
        Layout.sectionHeader('RSCC vs. RMSD scatterplots', ctx);

        const numModels = Dnatcofication.Structure.numberOfModels(ctx.dnatcofication);
        for (let mIdx = 0; mIdx < numModels; mIdx++) {
            const mNum = ctx.dnatcofication.data.structures[0].models[mIdx].num;

            const struRsccReq = await Rscc.structureRscc(ctx.dnatcofication, mIdx);
            if (!isOk(struRsccReq)) {
                root.lineText(`No RSCC data are available for model ${mNum} of structure ${ctx.dnatcofication.pdbId}.`);
                continue;
            }

            const { assigned, unassigned } = struRsccReq.data;
            const rqKinds = RsccPlot.requestedKinds(mIdx, ctx.dnatcofication);
            const backdropAssiRes = await Rscc.backdropRscc(rqKinds.assigned);
            const backdropUnasRes = await Rscc.backdropRscc(rqKinds.unassigned);

            if (!isOk(backdropAssiRes) || !isOk(backdropUnasRes))
                throw new Error('Could not get RSCC data');

            if (assigned.length > 0) {
                const plotData = RsccPlot.makeData(assigned, backdropAssiRes.data, void 0, ctx.dnatcofication);
                await drawImage(plotData, `Assigned dinucleotides for model ${mNum} of structure ${ctx.dnatcofication.pdbId}`, root);
            } else {
                root.lineText(`No assigned dinucleotides are available for model ${mNum} of structure ${ctx.dnatcofication.pdbId}.`);
            }

            if (unassigned.length > 0) {
                const plotData = RsccPlot.makeData(unassigned, backdropUnasRes.data, void 0, ctx.dnatcofication);
                await drawImage(plotData, `Unassigned dinucleotides for model ${mNum} of structure ${ctx.dnatcofication.pdbId}`, root);
            } else {
                root.lineText(`No unassigned dinucleotides are available for model ${mNum} of structure ${ctx.dnatcofication.pdbId}.`);
            }
        }

        root.breakPage();
    }
}

