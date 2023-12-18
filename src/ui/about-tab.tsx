import * as React from 'react';
import { Help as _Help } from './help';
import { Link } from './common/link';
import { SideSwitchingPanel } from './common/side-switching-panel';
import { CasLogoImg, DefinitionNewTrans2Img, IbtLogoImg } from '../assets/images';
import { ConformersFile } from '../assets/misc';
import { about, annotation, browse, home, refinement, validation } from '../help-tags';
import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Tabs = [
    ['how-to-cite', { caption: 'How to cite' }],
    ['help', { caption: 'Help' }],
    ['version-history', { caption: 'Version history' }],
    ['downloads', { caption: 'Downloads' }],
    ['contact', { caption: 'Contact' }],
] as const;

function Contact() {
    return (
        <_Help.Container>
            <div className='rdo-page'>
                <div className='mb-2'>
                    ©
                    Michal Malý <span className='rdo-sup'>1</span> &amp;
                    Lada Biedermannová <span className='rdo-sup'>2</span> &amp;
                    <a className='rdo-link' href='mailto:jiri.cerny-at-ibt.cas.cz?Subject=DNATCO'>Jiří Černý</a><span className='rdo-sup'>1</span> &amp;
                    <a className='rdo-link' href='mailto:bohdan.schneider-at-gmail.com?Subject=DNATCO'>Bohdan Schneider</a> <span className='rdo-sup'>2</span>
                </div>

                <div className='mb-2'>
                    <div>
                        <span className='rdo-sup'>1</span> <a className='rdo-link' href='https://www.ibt.cas.cz/en/research/laboratory-of-structural-bioinformatics-of-proteins/' target='_blank'>Laboratory of Structural Bioinformatics of Proteins</a>, Institute of Biotechnology, Czech Academy of Sciences
                    </div>
                    <div>
                        <span className='rdo-sup'>2</span> <a className='rdo-link' href='https://www.ibt.cas.cz/en/research/laboratory-of-biomolecular-recognition' target='_blank'>Laboratory of Biomolecular Recognition</a>, Institute of Biotechnology, Czech Academy of Sciences
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '5em 5em 1fr', alignItems: 'center', justifyContent: 'center', columnGap: 'var(--h-gap)', marginTop: 'var(--v-gap)' }}>
                    <Link url='https://www.ibt.cas.cz/en/' newTab={true} className='rdo-imglink'>
                        <img src={IbtLogoImg} alt='Institute of Biotechnology logo' style={{ width: '100%' }} />
                    </Link>
                    <Link url='https://www.avcr.cz/en/' newTab={true} className='rdo-imglink'>
                        <img src={CasLogoImg} alt='Czech Academy of Sciences logo' style={{ width: '100%' }} />
                    </Link>
                    <div />
                </div>
            </div>
        </_Help.Container>
    );
}

function Downloads() {
    return (
        <_Help.Container>
            <div>
                <div className='flex border-t-secondary-second border-t mt-4 pt-3 mb-8'>
                    <div className='w-[25%]'>
                        <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                            NtC data
                        </h3>
                    </div>
                    <div className='w-[75%] mb-2'>
                        <div className='font-din-2014 text-16px text-justify'>
                            Table of NtC conformers - annotation and frequency of occurrence (<a className='underline cursor-pointer' href={ConformersFile} download='conformers.csv' target='_blank'>csv file</a>)
                        </div>
                        <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                            Definition of the NtC conformers (<Link className='underline cursor-pointer' url='https://dnatco.datmos.org/next/coords/NtC_averages.csv'>torsion averages</Link> and <Link className='underline cursor-pointer' url='https://dnatco.datmos.org/next/coords/NtC_esd.csv'>esd values</Link>)
                        </div>
                        <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                            <a className='underline cursor-pointer' href='https://dnatco.datmos.org/next/coords/NtC_representative.zip'>Representative structures</a> of the NtC conformers (cartesian coords)
                        </div>
                    </div>
                </div>
                <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                    <div className='w-[25%]'>
                        <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                            Example scripts
                        </h3>
                    </div>
                    <div className='w-[75%] mb-2'>
                        <div className='font-din-2014 text-16px text-justify'>
                            Uploading PDB or mmCIF formatted file using <a className='underline cursor-pointer' href='https://dnatco.datmos.org/next/scripts/POST_coords2dnatco.py'>python script</a>
                        </div>
                        <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                            Assign a single step from <Link className='underline cursor-pointer' url='https://dnatco.datmos.org/next/scripts/POST_json_coords.py'>atomic coordinates</Link> or <Link className='underline cursor-pointer' url='https://dnatco.datmos.org/next/scripts/POST_json_torsions.py'>from torsions</Link>
                        </div>
                    </div>
                </div>
                <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                    <div className='w-[25%]'>
                        <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                            Research articles
                        </h3>
                    </div>
                    <div className='w-[75%] mb-2'>
                        <div className='font-din-2014 text-16px text-justify'>
                            Definition of the unified DNA/RNA conformers: <a className='underline cursor-pointer' href='https://dnatco.datmos.org/next/papers/gkaa383.pdf'>Černý et al., NAR 48, 6367 (2020)</a>
                        </div>
                        <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                            Description of DNATCO server version 3.2: <a className='underline cursor-pointer' href='https://dnatco.datmos.org/next/papers/ir5007.pdf'>Černý et al., Acta Cryst D 76, 805 (2020)</a>
                        </div>
                        <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                            Definition of DNA conformers: <a className='underline cursor-pointer' href='https://dnatco.datmos.org/next/papers/rr5151.pdf'>Schneider et al., Acta Cryst D 74, 52 (2018)</a>
                        </div>
                        <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                            Example of application: <a className='underline cursor-pointer' href='https://dnatco.datmos.org/next/papers/genes-08-00278-v3.pdf'>Schneider et al., Genes 8, 278, (2017)</a>
                        </div>
                        <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                            Description of DNATCO server version 2: <a className='underline cursor-pointer' href='https://dnatco.datmos.org/next/papers/gkw381.pdf'>Černý et al., NAR 44, W284 (2016)</a>
                        </div>
                    </div>
                </div>
            </div>
        </_Help.Container>
    );
}

function Help() {
    return (
        <div>
            <div className='flex border-t-secondary-second border-t mt-4 pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                        {about[0].headline}
                    </h3>
                </div>
                <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                    {about[0].subHeadlineText}
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                        {about[0].sections.ntcStructuralAlphabet.headline}
                    </h3>
                </div>
                <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                    {about[0].sections.ntcStructuralAlphabet.paragraph1}
                    <img className='w-[150px] my-2' src={DefinitionNewTrans2Img} />
                    {about[0].sections.ntcStructuralAlphabet.paragraph2}
                    <div className='h-3'></div>
                    {about[0].sections.ntcStructuralAlphabet.paragraph3}
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                        {about[0].sections.ntcNamingRules.headline}
                    </h3>
                </div>
                <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                    {about[0].sections.ntcNamingRules.paragraph1}
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                        {about[0].sections.glossaryOfAcronyms.headline}
                    </h3>
                </div>
                <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                    {about[0].sections.glossaryOfAcronyms.paragraph1}
                    <div className='h-3'></div>
                    {about[0].sections.glossaryOfAcronyms.paragraph2}
                    <div className='h-3'></div>
                    {about[0].sections.glossaryOfAcronyms.paragraph3}
                    <div className='h-3'></div>
                    {about[0].sections.glossaryOfAcronyms.paragraph4}
                    <div className='h-3'></div>
                    {about[0].sections.glossaryOfAcronyms.paragraph5}
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                        {home[0].headline}
                    </h3>
                </div>
                <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                    {home[0].subHeadlineText}
                    <div className='h-3'></div>
                    {home[0].paragraph1}
                    <div className='h-3'></div>
                    {home[0].paragraph2}
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                        {annotation[0].headline}
                    </h3>
                </div>
                <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                    {annotation[0].subHeadlineText}
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                        {annotation[0].sections.assignedNtCs.headline}
                    </h3>
                </div>
                <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                    {annotation[0].sections.assignedNtCs.paragraph1}
                    <div className='h-3'></div>
                    {annotation[0].sections.assignedNtCs.paragraph2}
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                        {annotation[0].sections.structureInfo.headline}
                    </h3>
                </div>
                <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                    {annotation[0].sections.structureInfo.paragraph1}
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                        {annotation[0].sections.downloads.headline}
                    </h3>
                </div>
                <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                    {annotation[0].sections.downloads.paragraph1}
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                        {validation[0].headline}
                    </h3>
                </div>
                <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                    {validation[0].subHeadlineText}
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                        {validation[0].sections.confalsRMSD.headline}
                    </h3>
                </div>
                <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                    {validation[0].sections.confalsRMSD.paragraph1}
                    <div className='h-3'></div>
                    {validation[0].sections.confalsRMSD.paragraph2}
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                        {validation[0].sections.stepTorsions.headline}
                    </h3>
                </div>
                <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                    {validation[0].sections.stepTorsions.paragraph1}
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                        {validation[0].sections.similarityPlot.headline}
                    </h3>
                </div>
                <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                    {validation[0].sections.similarityPlot.paragraph1}
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                        {validation[0].sections.rsccRmsdPlot.headline}
                    </h3>
                </div>
                <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                    {validation[0].sections.rsccRmsdPlot.paragraph1}
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                        {validation[0].sections.bondLengthsAngles.headline}
                    </h3>
                </div>
                <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                    {validation[0].sections.bondLengthsAngles.paragraph1}
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h2 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                        {refinement[0].headline}
                    </h2>
                </div>
                <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                    {refinement[0].subHeadlineText}
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                        {refinement[0].sections.connectivityPlot.headline}
                    </h3>
                </div>
                <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                    {refinement[0].sections.connectivityPlot.paragraph1}
                    <div className='h-3'></div>
                    {refinement[0].sections.connectivityPlot.paragraph2}
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                        {refinement[0].sections.restraints.headline}
                    </h3>
                </div>
                <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                    {refinement[0].sections.restraints.paragraph1}
                    <div className='h-3'></div>
                    {refinement[0].sections.restraints.paragraph2}
                    <div className='h-3'></div>
                    {refinement[0].sections.restraints.paragraph3}
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                        {refinement[0].sections.changeNtCs.headline}
                    </h3>
                </div>
                <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                    {refinement[0].sections.changeNtCs.paragraph1}
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h2 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                        {browse[0].headline}
                    </h2>
                </div>
                <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                    {browse[0].subHeadlineText}
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                        {browse[0].sections.browse.headline}
                    </h3>
                </div>
                <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                    {browse[0].sections.browse.paragraph1}
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                <h3 className='w-[25%] font-din-2014 font-700 text-18px mb-2 uppercase'>
                    {browse[0].sections.tableOfConformers.headline}
                </h3>
                <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                    {browse[0].sections.tableOfConformers.paragraph1}
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                <h3 className='w-[25%] font-din-2014 font-700 text-18px mb-2 uppercase'>
                    {browse[0].sections.contourPlots.headline}
                </h3>
                <div className='w-[75%] font-din-2014 text-16px mb-2 text-justify'>
                    {browse[0].sections.contourPlots.paragraph1}
                </div>
            </div>
        </div>
    );
}

function HowToCite() {
    return (
        <div className='mt-7'>
            <div>
                The NtC alphabet - a unified dinucleotide alphabet of both RNA and DNA conformations is described in <a className='underline cursor-pointer' href='https://dnatco.datmos.org/next/papers/gkaa383.pdf' target='_blank'>Černý et al., NAR 48, 6367 (2020)</a>
            </div>
            <div>
                The web service (version 3.2) is described in <a className='underline cursor-pointer' href='https://dnatco.datmos.org/next/papers/rr5151.pdf' target='_blank'>Černý et al., Acta Cryst D 76, 805 (2020)</a>
            </div>
            <div>
                The DNA-based conformers and the way they were identified is described in <a className='underline cursor-pointer' href='https://dnatco.datmos.org/next/papers/rr5151.pdf'>Schneider et al., Acta Cryst D 74, 52 (2018)</a>
            </div>
            <div>
                For an example application of the DNA Structural Alphabet see <a className='underline cursor-pointer' href='https://dnatco.datmos.org/next/papers/genes-08-00278-v3.pdf'>Schneider et al., Genes 8, 278, (2017)</a>
            </div>
            <div>
                The web service (version 2) is described in <a className='underline cursor-pointer' href='https://dnatco.datmos.org/next/papers/gkw381.pdf'>Černý et al., NAR 44, W284 (2016)</a>
            </div>
        </div>
    );
}

function VersionHistory() {
    return (
        <div>
            <div className='flex border-t-secondary-second border-t mt-4 pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                        v3.2
                    </h3>
                </div>
                <div className='w-[75%] mb-2'>
                    <div className='font-din-2014 text-16px text-justify'>
                        The version described in <a className='underline cursor-pointer' href='https://dnatco.datmos.org/next/papers/ir5007.pdf' target='_blank'>Černý et al., Acta Cryst D 76, 805 (2020)</a>.
                    </div>
                    <div className='font-din-2014 text-16px text-justify '>
                        Updated the universal set of 96+1 conformers for both DNA and RNA structures.
                    </div>
                    <div className='font-din-2014 text-16px text-justify'>
                        Restraints for <a className='underline cursor-pointer' href='https://www.phenix-online.org/' target='_blank'>Phenix</a>,
                        <a className='underline cursor-pointer' href='https://www2.mrc-lmb.cam.ac.uk/groups/murshudov/content/refmac/refmac.html' target='_blank'>REFMAC</a>,
                        and <a className='underline cursor-pointer' href='https://github.com/samuelflores/MMB' target='_blank'>MMB</a> can be generated.
                    </div>
                    <div className='font-din-2014 text-16px text-justify'>
                        Support for CCP4/MRC maps was added.
                    </div>
                    <div className='font-din-2014 text-16px text-justify'>
                        Interactive 'connectivity' scatter plot added.
                    </div>
                    <div className='font-din-2014 text-16px text-justify'>
                        Contour plots of RSCC vs Cartesian RMSD or Euclidean distance added.
                    </div>
                    <div className='font-din-2014 text-16px text-justify'>
                        Output of assignment can be downloaded as a JSON file.
                    </div>
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t mt-4 pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                        v3.1
                    </h3>
                </div>
                <div className='w-[75%] mb-2'>
                    <div className='font-din-2014 text-16px text-justify'>
                        User-uploaded data in PDB and mmCIF format are supported.
                    </div>
                    <div className='font-din-2014 text-16px text-justify '>
                        Interactive 'similarity' scatter plot added.
                    </div>
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t mt-4 pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                        v3.0
                    </h3>
                </div>
                <div className='w-[75%] mb-2'>
                    <div className='font-din-2014 text-16px text-justify'>
                        A universal set of conformer classes for both DNA and RNA introduced.
                    </div>
                    <div className='font-din-2014 text-16px text-justify '>
                        Additional parameters (NN, CC, NCCN/μ) for better description of intercalated or open steps.
                    </div>
                    <div className='font-din-2014 text-16px text-justify '>
                        Structures from PDB and PDB-REDO databases analyzed as mmCIF format internally.
                    </div>
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t mt-4 pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                        v2.3
                    </h3>
                </div>
                <div className='w-[75%] mb-2'>
                    <div className='font-din-2014 text-16px text-justify'>
                        Improved assignment protocol involving known δ/pseudorotation angle correlation for detection of outliers.
                    </div>
                    <div className='font-din-2014 text-16px text-justify '>
                        RMSD between selected step and reference reported for atoms defining the nine torsions.
                    </div>
                    <div className='font-din-2014 text-16px text-justify '>
                        Tetrahedron representation of the NtC conformer introduced.
                    </div>
                    <div className='font-din-2014 text-16px text-justify '>
                        <a className='underline cursor-pointer' href='https://dnatco.datmos.org/v2.3' target='_blank'>https://dnatco.datmos.org/v2.3</a>
                    </div>
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t mt-4 pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                        v2.2
                    </h3>
                </div>
                <div className='w-[75%] mb-2'>
                    <div className='font-din-2014 text-16px text-justify'>
                        Confal (conformer validation score) introduced.
                    </div>
                    <div className='font-din-2014 text-16px text-justify '>
                        Reporting the 'most similar' conformation for non-assigned (NANT) steps.
                    </div>
                    <div className='font-din-2014 text-16px text-justify '>
                        <a className='underline cursor-pointer' href='https://dnatco.datmos.org/v2.2/' target='_blank'>https://dnatco.datmos.org/v2.2/</a>
                    </div>
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t mt-4 pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                        v2
                    </h3>
                </div>
                <div className='w-[75%] mb-2'>
                    <div className='font-din-2014 text-16px text-justify'>
                        The version described in <a className='underline cursor-pointer' href='https://dnatco.datmos.org/next/papers/gkw381.pdf' target='_blank'>Černý et al., NAR 44, W284 (2016)</a>.
                    </div>
                    <div className='font-din-2014 text-16px text-justify '>
                        Reporting the 'most similar' conformation for non-assigned (NANT) steps.
                    </div>
                    <div className='font-din-2014 text-16px text-justify '>
                        <a className='underline cursor-pointer' href='https://dnatco.datmos.org/v2/' target='_blank'>https://dnatco.datmos.org/v2/</a>
                    </div>
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t mt-4 pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className='font-din-2014 font-700 text-18px mb-2 uppercase'>
                        v1
                    </h3>
                </div>
                <div className='w-[75%] mb-2'>
                    <div className='font-din-2014 text-16px text-justify'>
                        The initial implementation based on <a className='underline cursor-pointer' href='https://dnatco.datmos.org/next/papers/gkn260.pdf' target='_blank'>Svozil et al., NAR 36, 3690 (2008)</a>.
                    </div>
                    <div className='font-din-2014 text-16px text-justify '>
                        <a className='underline cursor-pointer' href='https://dnatco.datmos.org/v1/'>https://dnatco.datmos.org/v1/</a>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface State {
    selected: typeof Tabs[number][0];
}
const AboutTab: React.FC = () => {

        const location = useLocation();
        const [state, setState] = useState<State>({ selected: 'help' });

        useEffect(() => {
            const selectedTab = location?.state?.selectedTab || 'help';
            setState({ selected: selectedTab });
          }, [location]);

    const renderTab = () => {
        switch (state.selected) {
        case 'contact': return <Contact />;
        case 'downloads': return <Downloads />;
        case 'help': return <Help />;
        case 'how-to-cite': return <HowToCite />;
        case 'version-history': return <VersionHistory />;
        }
    }


        return (
            <div className='rdo-offset'>
                    <div className='rdo-screen-with-side-panel overflow-hidden h-[calc(100%-6rem)] flex flex-col mt-24'>
                        <SideSwitchingPanel
                            items={Tabs}
                            selectedItemId={state.selected}
                            onSwitched={id => setState({ ...state, selected: id})}
                        />
                        <div className='flex flex-col overflow-hidden rdo-offset'>
                            <div className='font-din-2014 text-22px uppercase font-700 mb-4'>
                                {Tabs.find((tab) => tab[0] === state.selected)![1].caption}
                            </div>
                            <div className='overflow-hidden rdo-scroll-vertically'>
                                {renderTab()}
                            </div>
                        </div>
                    </div>
            </div>
        );
}

export default AboutTab;
