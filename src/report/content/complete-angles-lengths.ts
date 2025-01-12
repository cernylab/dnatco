import { drawAllAnglesLengths } from './util/angles-lengths';
import { Report } from '../';
import { Layout } from '../layout';
import { Fonts } from '../styling';
import { ByResidueHelpers } from '../../dnatco/angles-lengths/helpers';
import { Dnatcofication } from '../../dnatco/dnatcofication';
import { InvalidChain } from '../../util/structure-selection';

export namespace CompleteAnglesLengths {
    export function add<Output>(ctx: Report.Context<Output>) {
        const root = ctx.ntDoc;

        Layout.sectionHeader('Lengths & Angles', ctx);

        const numModels = Dnatcofication.Structure.numberOfModels(ctx.dnatcofication);
        const alm = ctx.dnatcofication.data.almByResidue;

        for (let mIdx = 0; mIdx < numModels; mIdx++) {
            const indices = ByResidueHelpers.selectionToIndices(ctx.dnatcofication, mIdx, InvalidChain);
            const residues = indices.map((x) => alm.residues[x]);
            const residueStats = indices.map((x) => alm.stats[x]);

            if (numModels > 1)
                root.lineText(`Model ${ctx.dnatcofication.data.structures[0].models[mIdx].num}`, { font: Fonts.SubsectionCaption, hAlign: ctx.mode === 'textual' ? 'left' : 'center' });

            // --- LENGTHS ---
            root.lineText('Lengths', { font: { style: 'bold' }, hAlign: ctx.mode === 'textual' ? 'left' : 'center' });
            drawAllAnglesLengths('lengths', residues, residueStats, ctx.ntDoc, ctx);

            // --- ANGLES ---
            root.lineText('Angles', { font: { style: 'bold' }, hAlign: ctx.mode === 'textual' ? 'left' : 'center' });
            drawAllAnglesLengths('angles', residues, residueStats, ctx.ntDoc, ctx);
        }

        if (ctx.generator === 'web') {
            root.paragraphText('Detailed validation of valence geometry (bond lengths and angles) is available at:', { dontSeparate: true });
            const url = `${ctx.href}/app/dnatco/validation/angles-lengths?cifcode=${ctx.dnatcofication.pdbId.toLowerCase()}`;
            root.hyperlink(url, url);
        }

        root.breakPage();
    }
}
