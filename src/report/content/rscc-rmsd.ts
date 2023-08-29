// @ts-ignore DefinitelyTyped does not have definitions for this flavor of plotly.js. Sadge...
import Plotly, { type PlotData, type PlotLayout } from 'plotly.js-cartesian-dist';
import { Report } from '../';
import { Layout } from '../layout';
import { NTDocument } from '../nottex/document';
import { isOk } from '../../dnatco';
import { Dnatcofication } from '../../dnatco/dnatcofication';
import { Rscc } from '../../dnatco/rscc';
import { svgToImg } from '../../node-util/svg-to-img';
import { RsccPlot } from '../../ui/dnatco/rscc-plot';
import { EnvDetect } from '../../util/env-detect';
import { ImageSerialization } from '../../util/image-serialization';

const PW = 1500;
const PH = 1500;

async function imageToPngBrowser(layout: PlotLayout, data: PlotData[] ) {
    return await ImageSerialization.toImage(data, layout, PW, PH, 'png');
}

const SvgXmlPrefix = 'data:image/svg+xml,';
async function imageToPngNode(layout: PlotLayout, data: PlotData[]) {
    // All right, what the heck is up with this and why does just looking at this
    // give me a sour taste of stale beer in my mouth?
    //
    // We are using Plotly to draw the charts. To make the charts look the same in
    // the interactive UI and the report, we need to use Plotly everywhere. This is
    // not a problem when we generate the report in the browser because Plotly has
    // access to all of the required browser-only APIs. When we do this in NodeJS,
    // things fall apart very quicky.
    //
    // Thie first hurdle is to get past the module resolution stage. Standard Plotly
    // package comes with a Scheißeton (= metric analog of a Shitton) of dependencies that
    // just will not initialize correctly inside NodeJS environment regardless of how much
    // we stuff it with "browser-env" etc. The solution is to use a reduced Plotly package,
    // the "plotly.js-cartesian-dist".
    //
    // That gets us past the module resolution stage but we will still fail during conversion
    // of the plot to an image. Plotly does this weird thing when it apparently renders the chart
    // to a SVG file and then converts the SVG into the target format. In the "SVG -> something else"
    // phase Plotly uses createObjectURL() to store the intermediate SVG (why...?). Plotly will try to call
    // "window.createObjectURL()" but that is not available in NodeJS. If we manually wire up
    // "URL.createObjectURL()" to "window.createObjectURL()" we can get a little further but Plotly
    // will eventually fail anyway because it does not recognize the "blob:nodedata" URL scheme prefix
    // that NodeJS puts on all its object URLs. Now what...?
    //
    // If we make Plotly render the chart just to SVG, we can avoid the createObjectURL shinanegans
    // but we then have to handle to conversion to PNG ourselves. "node-canvas" comes to our rescue,
    // but we have to nudge it a little bit.

    // Stage 1) Get the chart as SVG
    const imgEncoded = await Plotly.toImage({ data, layout }, { format: 'svg', width: PW, height: PH});
    // Stage 1b) Make sure that the output is a Data URL and that it has the expected shape
    if (!imgEncoded.startsWith(SvgXmlPrefix))
        throw new Error('Plotly.toImage() returned something that does not look like a Data URL encoding a SVG image');

    // Stage 2) Extract the data from the Data URL and convert it to bytes. While "node-canvas" should be
    //          able to read SVG files from Data URLs, it did not work when this code was written.
    const imgDecoded = Buffer.from(decodeURIComponent(imgEncoded.substring(SvgXmlPrefix.length)));
    // Stage 3) Convert SVG to PNG
    return await svgToImg(imgDecoded, PW, PH, 'png');
}

async function drawImage<Output>(data: RsccPlot.RsccPlotData, title: string, root: NTDocument<Output>) {
    const layout = {
        xaxis: { title: 'RSCC', automargin: true, tickfont: { size: 32 }, titlefont: { size: 32 } },
        yaxis: { title: 'RMSD [Å]', tickfont: { size: 32 }, titlefont: { size: 32 } },
        plot_bgcolor: 'white',
        paper_bgcolor: 'white',
        margin: { l: 150 },
    };

    const plotlyData = RsccPlot.makePlotlyData(data.xy, data.contour, true, false) as PlotData[];

    let png;
    if (EnvDetect.isNode()) {
        png = await imageToPngNode(layout, plotlyData);
    } else {
        png = await imageToPngBrowser(layout, plotlyData);
    }

    root.image(
        'png',
        png,
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
