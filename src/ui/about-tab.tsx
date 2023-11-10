import * as React from 'react';
import { Help as _Help } from './help';
import { Link } from './common/link';
import { SideSwitchingPanel } from './common/side-switching-panel';
import { CasLogoImg, DefinitionNewTrans2Img, IbtLogoImg } from '../assets/images';
import { ConformersFile } from '../assets/misc';

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
                <div className='rdo-paragraph'>
                    ©
                    Michal Malý <span className='rdo-sup'>1</span> &amp;
                    Lada Biedermannová <span className='rdo-sup'>2</span> &amp;
                    <a className='rdo-link' href='mailto:jiri.cerny-at-ibt.cas.cz?Subject=DNATCO'>Jiří Černý</a><span className='rdo-sup'>1</span> &amp;
                    <a className='rdo-link' href='mailto:bohdan.schneider-at-gmail.com?Subject=DNATCO'>Bohdan Schneider</a> <span className='rdo-sup'>2</span>
                </div>

                <div className='rdo-paragraph'>
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
            <div className='rdo-page'>
                <div className='rdo-paragraph-caption'>NtC data</div>
                <div className='rdo-paragraph'>
                    <ul className='rdo-list'>
                        <li>
                            Table of NtC conformers - annotation and frequency of occurrence (<a className='rdo-link' href={ConformersFile} download='conformers.csv'>csv file </a>)
                        </li>
                        <li>
                            Definition of the NtC conformers (<Link url='https://dnatco.datmos.org/next/coords/NtC_averages.csv'>torsion averages</Link> and <Link url='https://dnatco.datmos.org/next/coords/NtC_esd.csv'>esd values</Link>)
                        </li>
                        <li>
                            <a className='rdo-link' href='https://dnatco.datmos.org/next/coords/NtC_representative.zip'>Representative structures</a> of the NtC conformers (cartesian coords).
                        </li>
                    </ul>
                </div>

                <div className='rdo-paragraph-caption'>Example scripts</div>
                <div className='rdo-paragraph'>
                    <ul className='rdo-list'>
                        <li>
                            Uploading PDB or mmCIF formatted file using <a className='rdo-link' href='https://dnatco.datmos.org/next/scripts/POST_coords2dnatco.py'>python script</a>.
                        </li>
                        <li>
                            Assign a single step from <Link url='https://dnatco.datmos.org/next/scripts/POST_json_coords.py'>atomic coordinates</Link> or <Link url='https://dnatco.datmos.org/next/scripts/POST_json_torsions.py'>from torsions</Link>.
                        </li>
                    </ul>
                </div>

                <div className='rdo-paragraph-caption'>Research articles</div>
                <div className='rdo-paragraph'>
                    <ul className='rdo-list'>
                        <li>
                            Definition of the unified DNA/RNA conformers: <a className='rdo-link' href='https://dnatco.datmos.org/next/papers/gkaa383.pdf'>Černý et al., NAR 48, 6367 (2020)</a>.
                        </li>
                        <li>
                            Description of DNATCO server version 3.2: <a className='rdo-link' href='https://dnatco.datmos.org/next/papers/ir5007.pdf'>Černý et al., Acta Cryst D 76, 805 (2020)</a>.
                        </li>
                        <li>
                            Definition of DNA conformers: <a className='rdo-link' href='https://dnatco.datmos.org/next/papers/rr5151.pdf'>Schneider et al., Acta Cryst D 74, 52 (2018)</a>.
                        </li>
                        <li>
                            Example of application: <a className='rdo-link' href='https://dnatco.datmos.org/next/papers/genes-08-00278-v3.pdf'>Schneider et al., Genes 8, 278, (2017)</a>.
                        </li>
                        <li>
                            Description of DNATCO server version 2: <a className='rdo-link' href='https://dnatco.datmos.org/next/papers/gkw381.pdf'>Černý et al., NAR 44, W284 (2016)</a>.
                        </li>
                    </ul>
                </div>
            </div>
        </_Help.Container>
    );
}

function Help() {
    return (
        <_Help.Container>
            <div className='rdo-page'>
                <div className='rdo-paragraph-caption'>Method</div>
                <div className='rdo-paragraph'>
                    The DNATCO server analyzes structures of nucleic acids - both DNA and RNA - using the NtC structural alphabet developed in our institute.
                    The NtC structural alphabet describes DNA/RNA backbone conformation using 96 “symbols”, where each symbol consists of four characters (e.g. BB00 or ZZ1S) and corresponds to a distinct dinucleotide conformer.
                    The dinucleotide conformers are assigned based on the values of 12 backbone torsion parameters (Figure 1).
                </div>

                <div className='rdo-image-tainer'>
                    <img
                        className='rdo-image'
                        src={DefinitionNewTrans2Img}
                    />
                    <div><span className='rdo-bold'>Figure 1.</span> Dinucleotide step with the 12 parameters <br /> (backbone torsions shown in gray, distances in blue) <br /> that define the NtC conformational class.</div>
                </div>

                <div className='rdo-paragraph-caption'>NtC conformers</div>
                <div className='rdo-paragraph'>
                    Table listing all the conformers is here and can be downloaded.
                    Definition of the NtC conformers (torsion averages and esd values) can be downloaded.
                    Representative structures of the NtC conformers (cartesian coords) can be downloaded.
                </div>

                <div className='rdo-paragraph-caption'>NtC naming</div>
                <div className='rdo-paragraph'>
                    <ul className='rdo-list'>
                        <li>
                            The conformers are identified using four-character symbols.
                        </li>
                        <li>
                            Symbols containing "A", "B", "Z" as the first and/or second character imply a dinucleotide with stacked bases and with first/second nucleotide in an A-, B-, or Z-like conformation.
                        </li>
                        <li>
                            Symbols starting with "IC" correspond to steps with distant but parallel bases that can be InterCalated.
                        </li>
                        <li>
                            Symbols starting with "OP" correspond to steps with unstacked “OPen” bases.
                        </li>
                        <li>
                            Symbols containing "S" at 3rd or 4th position imply that the 1st or 2nd base, respectively, is in syn orientation.
                        </li>
                        <li>
                            Conformationally extreme conformers are not assigned to any of the above; these steps formally represent the 97th conformer denoted as NANT.
                        </li>
                    </ul>
                </div>

                <div className='rdo-paragraph-caption'>Validation metrics - confal, RMSD</div>
                <div className='rdo-paragraph'>
                    <ul className='rdo-list'>
                        <li>
                            <span className='rdo-strong'>confal</span> a quality score, with value of 100 corresponding to a perfect fit to the reference and 0 corresponding to conformational outliers.
                            The confal function is a Gaussian function defined in such a way that it reaches a value of 100 at the average value of the parameter and a value of 1 at the border closer to the average.
                            The confal value is set to 0 for more distant values. The confal score for a step is then calculated as a harmonic mean of its 12 confal values,
                            and the confal score for a structure is calculated as an average of the step values.
                        </li>
                        <li>
                            <span className='rdo-strong'>RMSD</span>: root mean square deviation in cartesian space between the analyzed step and reference.
                        </li>
                    </ul>
                </div>

                <div className='rdo-paragraph-caption'>Analysis of uploaded structures</div>
                <div className='rdo-paragraph'>
                    <ul className='rdo-list'>
                        <li>
                            DNA/RNA steps are identified based on atom names as defined by the PDB format, version 3.1 or above (sugar atoms as O4' not O4*).
                        </li>
                        <li>
                            Steps with non-standard or missing atoms that define torsions δ1 to δ2, χ1, and χ2 are not considered in the assignment process.
                        </li>
                        <li>
                            Conformers are assigned for modified residues that contain standard names for atoms defining the step torsions between δ and δ+1 and χ and χ+1. <br />
                            See the  <a className='rdo-link' href='https://dnatco.datmos.org/next/standard.php'>list of accepted residues </a></li>
                        <li>
                            Analysis of large structures (multiple NMR MODELs or MD simulation trajectory) or non-standard residues - please, contact the authors for off-line analysis.
                        </li>
                    </ul>
                </div>
            </div>
        </_Help.Container>
    );
}

function HowToCite() {
    return (
        <div className='rdo-page'>
            <ul className='rdo-list'>
                <li>
                    The NtC alphabet - a unified dinucleotide alphabet of both RNA and DNA conformations is described in <a className='rdo-link' href='https://dnatco.datmos.org/next/papers/gkaa383.pdf'>Černý et al., NAR 48, 6367 (2020)</a>.
                </li>
                <li>
                    The web service (version 3.2) is described in <a className='rdo-link' href='https://dnatco.datmos.org/next/papers/rr5151.pdf'>Černý et al., Acta Cryst D 76, 805 (2020)</a>.
                </li>
                <li>
                    The DNA-based conformers and the way they were identified is described in <a className='rdo-link' href='https://dnatco.datmos.org/next/papers/rr5151.pdf'>Schneider et al., Acta Cryst D 74, 52 (2018)</a>.
                </li>
                <li>
                    For an example application of the DNA Structural Alphabet see <a className='rdo-link' href='https://dnatco.datmos.org/next/papers/genes-08-00278-v3.pdf'>Schneider et al., Genes 8, 278, (2017)</a>.
                </li>
                <li>
                    The web service (version 2) is described in <a className='rdo-link' href='https://dnatco.datmos.org/next/papers/gkw381.pdf'>Černý et al., NAR 44, W284 (2016)</a>.
                </li>
            </ul>
        </div>
    );
}

function VersionHistory() {
    return (
        <div className='rdo-page'>
            <div className='rdo-subsection-caption'>v3.2</div>
            <ul className='rdo-list'>
                <li>
                    The version described in <a className='rdo-link' href='https://dnatco.datmos.org/next/papers/ir5007.pdf'>Černý et al., Acta Cryst D 76, 805 (2020)</a>.
                </li>
                <li>
                    Updated the universal set of 96+1 conformers for both DNA and RNA structures.
                </li>
                <li>
                    Restraints for <a className='rdo-link' href='https://www.phenix-online.org/'>Phenix</a>,
                    <a className='rdo-link' href='https://www2.mrc-lmb.cam.ac.uk/groups/murshudov/content/refmac/refmac.html'>REFMAC</a>,
                    and <a className='rdo-link' href='https://github.com/samuelflores/MMB'>MMB</a> can be generated.
                </li>
                <li>
                    Support for CCP4/MRC maps was added.
                </li>
                <li>
                    Interactive 'connectivity' scatter plot added.
                </li>
                <li>
                    Contour plots of RSCC vs Cartesian RMSD or Euclidean distance added.
                </li>
                <li>
                    Output of assignment can be downloaded as a JSON file.
                </li>
            </ul>

            <div className='rdo-subsection-caption'>v3.1</div>
            <ul className='rdo-list'>
                <li>
                    User-uploaded data in PDB and mmCIF format are supported.
                </li>
                <li>
                    Interactive 'similarity' scatter plot added.
                </li>
            </ul>

            <div className='rdo-subsection-caption'>v3.0</div>
            <ul className='rdo-list'>
                <li>
                    A universal set of conformer classes for both DNA and RNA introduced.
                </li>
                <li>
                    Additional parameters (NN, CC, NCCN/μ) for better description of intercalated or open steps.
                </li>
                <li>
                    Structures from PDB and PDB-REDO databases analyzed as mmCIF format internally.
                </li>
            </ul>

            <div className='rdo-subsection-caption'>v2.3</div>
            <ul className='rdo-list'>
                <li>
                    Improved assignment protocol involving known δ/pseudorotation angle correlation for detection of outliers.
                </li>
                <li>
                    RMSD between selected step and reference reported for atoms defining the nine torsions.
                </li>
                <li>
                    Tetrahedron representation of the NtC conformer introduced.
                </li>
                <li>
                    <a className='rdo-link' href='https://dnatco.datmos.org/v2.3'>https://dnatco.datmos.org/v2.3</a>
                </li>
            </ul>

            <div className='rdo-subsection-caption'>v2.2</div>
            <ul className='rdo-list'>
                <li>
                    Confal (conformer validation score) introduced.
                </li>
                <li>
                    Reporting the 'most similar' conformation for non-assigned (NANT) steps.
                </li>
                <li>
                    <a className='rdo-link' href='https://dnatco.datmos.org/v2.2/'>https://dnatco.datmos.org/v2.2/</a>
                </li>
            </ul>

            <div className='rdo-subsection-caption'>v2</div>
            <ul className='rdo-list'>
                <li>
                    The version described in <a className='rdo-link' href='https://dnatco.datmos.org/next/papers/gkw381.pdf'>Černý et al., NAR 44, W284 (2016)</a>.
                </li>
                <li>
                    <a className='rdo-link' href='https://dnatco.datmos.org/v2/'>https://dnatco.datmos.org/v2/</a>
                </li>
            </ul>

            <div className='rdo-subsection-caption'>v1</div>
            <ul className='rdo-list'>
                <li>
                    The initial implementation based on <a className='rdo-link' href='https://dnatco.datmos.org/next/papers/gkn260.pdf'>Svozil et al., NAR 36, 3690 (2008)</a>.
                </li>
                <li>
                    <a className='rdo-link' href='https://dnatco.datmos.org/v1/'>https://dnatco.datmos.org/v1/</a>
                </li>
            </ul>
        </div>
    );
}

interface State {
    selected: typeof Tabs[number][0];
}
export class AboutTab extends React.Component<{}, State> {
    constructor(props: {}) {
        super(props);

        this.state = {
            selected: 'how-to-cite',
        };
    }

    private renderTab() {
        switch (this.state.selected) {
        case 'contact': return <Contact />;
        case 'downloads': return <Downloads />;
        case 'help': return <Help />;
        case 'how-to-cite': return <HowToCite />;
        case 'version-history': return <VersionHistory />;
        }
    }

    render() {
        return (
            <div className='rdo-offset'>
                    <div className='rdo-screen-with-side-panel overflow-hidden h-[calc(100%-6rem)] flex flex-col mt-24'>
                        <SideSwitchingPanel
                            items={Tabs}
                            selectedItemId={this.state.selected}
                            onSwitched={id => this.setState({ ...this.state, selected: id})}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div className='rdo-primary-caption'>
                                {Tabs.find((tab) => tab[0] === this.state.selected)![1].caption}
                            </div>
                            <div className='rdo-offset' style={{ overflow: 'hidden' }}>
                                {this.renderTab()}
                            </div>
                        </div>
                    </div>
            </div>
        );
    }
}
