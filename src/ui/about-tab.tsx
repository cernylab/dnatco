import * as React from 'react';
import { Help as _Help } from './help';
import { Link } from './common/link';
import { SideSwitchingPanel } from './common/side-switching-panel';
import { CasLogoImg, IbtLogoImg } from '../assets/images';
import { ConformersFile } from '../assets/misc';
import { about, annotation, browse, densityMaps, home, refinement, validation } from '../help-tags';
import { useLocation, useNavigate, useParams } from 'react-router';
import { useState, useEffect, useMemo } from 'react';
import { ReactNode } from 'react';

// Parses markdown-style links in text: [text](url) for external, [text](#id) for internal
function renderTextWithLinks(text: string): ReactNode {
    // Regex to match [text](url) pattern
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = linkRegex.exec(text)) !== null) {
        // Add text before the link
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }

        const linkText = match[1];
        const linkUrl = match[2];

        if (linkUrl.startsWith('#')) {
            // Internal link - scroll to section
            const targetId = linkUrl.substring(1);
            parts.push(
                <a
                    key={key++}
                    href={linkUrl}
                    className="rdo-link underline cursor-pointer"
                    onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById(targetId);
                        if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }}
                >
                    {linkText}
                </a>
            );
        } else {
            // External link - open in new tab
            parts.push(
                <a
                    key={key++}
                    href={linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rdo-link underline cursor-pointer"
                >
                    {linkText}
                </a>
            );
        }

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text after last link
    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    // If no links found, return original text
    if (parts.length === 0) {
        return text;
    }

    return <>{parts}</>;
}

// Email link component for bot protection
const EmailLink: React.FC<{ user: string; domain: string; subject?: string; children: React.ReactNode }> = ({ user, domain, subject, children }) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const email = `${user}@${domain}`;
        const mailtoUrl = subject ? `mailto:${email}?Subject=${subject}` : `mailto:${email}`;
        window.location.href = mailtoUrl;
    };

    return (
        <a className='rdo-link' href="#" onClick={handleClick} style={{ cursor: 'pointer' }}>
            ✉ {children}
        </a>
    );
};

const Tabs = [
    ['how-to-cite', { caption: 'How to cite' }],
    ['help', { caption: 'Help' }],
    ['version-history', { caption: 'Version history' }],
    ['resources', { caption: 'Resources' }],
    ['contact', { caption: 'Contact' }],
] as const;

function Contact() {
    return (
        <_Help.Container>
            <div>
                <div className='mb-4'>
                    {/* <h3 className='font-700 text-18px mb-2 uppercase'>Contact</h3> */}
                    <div className='mb-2'>
                        <EmailLink user="jiri.cerny" domain="ibt.cas.cz" subject="DNATCO">Jiří Černý</EmailLink><span className='rdo-sup'>1</span> &amp; <EmailLink user="bohdan.schneider" domain="gmail.com" subject="DNATCO">Bohdan Schneider</EmailLink><span className='rdo-sup'>2</span>
                    </div>
                </div>

                <div className='mb-4'>
                    <h3 className='font-700 text-18px mb-2 uppercase'>Contributors</h3>
                    <div className='mb-2'>
                        Michal Malý<span className='rdo-sup'>1</span>, 
                        Paulína Božíková<span className='rdo-sup'>1</span>, 
                        Michal Tykač<span className='rdo-sup'>1</span>, 
                        Lada Biedermannová<span className='rdo-sup'>2</span>, 
                        Terezie Prchalová<span className='rdo-sup'>1,2</span>, 
                        Jakub Svoboda<span className='rdo-sup'>2</span>, 
                        Daniel Šrom<span className='rdo-sup'>1</span>
                    </div>
                </div>

                <div className='mb-4'>
                    <div>
                        <span className='rdo-sup'>1</span> <a className='rdo-link' href='https://www.ibt.cas.cz/en/research-laboratories/laboratory-of-structural-bioinformatics-of-proteins' target='_blank'>Laboratory of Structural Bioinformatics of Proteins</a>, Institute of Biotechnology, Czech Academy of Sciences
                    </div>
                    <div>
                        <span className='rdo-sup'>2</span> <a className='rdo-link' href='https://www.ibt.cas.cz/en/research-laboratories/laboratory-of-biomolecular-recognition' target='_blank'>Laboratory of Biomolecular Recognition</a>, Institute of Biotechnology, Czech Academy of Sciences
                    </div>
                </div>

                <div className='flex'>
                    <Link url='https://www.ibt.cas.cz/en/' newTab={true}>
                        <img src={IbtLogoImg} alt='Institute of Biotechnology logo' className='w-20 mr-5' />
                    </Link>
                    <Link url='https://www.avcr.cz/en/' newTab={true}>
                        <img src={CasLogoImg} alt='Czech Academy of Sciences logo' className='w-20' />
                    </Link>
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
                        <h3 className='font-700 text-18px mb-2 uppercase'>
                            NtC data
                        </h3>
                    </div>
                    <div className='w-[75%] mb-2'>
                        <div className='text-16px text-justify'>
                            Table of NtC conformers - annotation and frequency of occurrence (<a className='underline cursor-pointer' href={ConformersFile} download='conformers.csv' target='_blank'>csv file</a>)
                        </div>
                        <div className='w-[75%] text-16px mb-2 text-justify'>
                            Definition of the NtC conformers (<Link className='underline cursor-pointer' url='/coords/NtC_averages.csv'>torsion averages</Link> and <Link className='underline cursor-pointer' url='/coords/NtC_esd.csv'>esd values</Link>)
                        </div>
                        <div className='w-[75%] text-16px mb-2 text-justify'>
                            <a className='underline cursor-pointer' href='/coords/NtC_representative.zip'>Representative structures</a> of the NtC conformers (cartesian coords)
                        </div>
                    </div>
                </div>
                <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                    <div className='w-[25%]'>
                        <h3 className='font-700 text-18px mb-2 uppercase'>
                            Example scripts
                        </h3>
                    </div>
                    <div className='w-[75%] mb-2'>
                        <div className='text-16px text-justify'>
                            Uploading PDB or mmCIF formatted file using <a className='underline cursor-pointer' href='/scripts/POST_coords2dnatco.py'>python script</a>
                        </div>
                        <div className='w-[75%] text-16px mb-2 text-justify'>
                            Assign a single step from <Link className='underline cursor-pointer' url='/scripts/POST_json_coords.py'>atomic coordinates</Link> or <Link className='underline cursor-pointer' url='/scripts/POST_json_torsions.py'>from torsions</Link>
                        </div>
                    </div>
                </div>
                <div className='flex border-t-secondary-second border-t pt-3 mb-8'>
                    <div className='w-[25%]'>
                        <h3 className='font-700 text-18px mb-2 uppercase'>
                            Research articles
                        </h3>
                    </div>
                    <div className='w-[75%] mb-2'>
                        <div className='text-16px text-justify'>
                            Definition of the unified DNA/RNA conformers: <a className='underline cursor-pointer' href='/papers/gkaa383.pdf'>Černý et al., NAR 48, 6367 (2020)</a>
                        </div>
                        <div className='w-[75%] text-16px mb-2 text-justify'>
                            Description of DNATCO server version 3.2: <a className='underline cursor-pointer' href='/papers/ir5007.pdf'>Černý et al., Acta Cryst D 76, 805 (2020)</a>
                        </div>
                        <div className='w-[75%] text-16px mb-2 text-justify'>
                            Definition of DNA conformers: <a className='underline cursor-pointer' href='/papers/rr5151.pdf'>Schneider et al., Acta Cryst D 74, 52 (2018)</a>
                        </div>
                        <div className='w-[75%] text-16px mb-2 text-justify'>
                            Example of application: <a className='underline cursor-pointer' href='/papers/genes-08-00278-v3.pdf'>Schneider et al., Genes 8, 278, (2017)</a>
                        </div>
                        <div className='w-[75%] text-16px mb-2 text-justify'>
                            Description of DNATCO server version 2: <a className='underline cursor-pointer' href='/papers/gkw381.pdf'>Černý et al., NAR 44, W284 (2016)</a>
                        </div>
                    </div>
                </div>
            </div>
        </_Help.Container>
    );
}

function Help() {
  const location = useLocation();
  const navigate = useNavigate();
  const topic = location.hash ? location.hash.slice(1) : '';

  useEffect(() => {
    if (!topic) return;

    const el = document.getElementById(topic);
    if (el) {
        const t = setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        return () => clearTimeout(t);
    } else {
        navigate('/app/about/help', { replace: true });
    }
}, [location.hash, navigate]);

    const displayAbout = about.map(page => ({
        headline: page.headline,
        subHeadlineText: page.subHeadlineText,
        sections: page.sections.map(section => ({
            id: section.id,
            headline: section.headline,
            paragraphs: section.paragraphs
        }))
    }))

    const displayHome = home.map(page => ({
        headline: page.headline,
        paragraphs: page.paragraphs.map(paragraph => paragraph)
    }));

    const displayAnnotation = annotation.map(page => ({
        headline: page.headline,
        paragraphs: page.paragraphs.map(paragraph => paragraph)
    }))

    const displayValidation = validation.map(page => ({
        headline: page.headline,
        paragraphs: page.paragraphs.map(paragraph => paragraph)
    }))

    const displayRefinement = refinement.map(page => ({
        headline: page.headline,
        paragraphs: page.paragraphs.map(paragraph => paragraph)
    }))

    const displayBrowse = browse.map(page => ({
        headline: page.headline,
        paragraphs: page.paragraphs.map(paragraph => paragraph)
    }))

    const displayDensityMaps = densityMaps.map(page => ({
        headline: page.headline,
        subHeadlineText: page.subHeadlineText,
        sections: page.sections.map(section => ({
            id: section.id,
            headline: section.headline,
            paragraphs: section.paragraphs
        }))
    }))

    function display(display: any): ReactNode {
        const [expandedSections, setExpandedSections] = React.useState<{[key: string]: boolean}>({});

        const toggleSection = (sectionId: string) => {
            setExpandedSections(prev => ({
                ...prev,
                [sectionId]: !prev[sectionId]
            }));
        };

        return (
            <>
                {display.map((page:any, index:any) => (
                    <>
                        <div key={index} className='flex border-t-secondary-second border-t pt-3 mb-8'>
                            <div className='w-[25%]'>
                                <h3 className='font-700 text-18px mb-2 uppercase'>
                                    {page.headline}
                                </h3>
                            </div>
                            <div className='w-[75%] text-16px mb-2 text-justify'>
                                {page.subHeadlineText}
                            </div>
                        </div>
                        {page.sections.map((section:any, idx:any) => {
                            const sectionId = `${index}-${idx}`;
                            const isExpanded = expandedSections[sectionId] ?? true; // Default to expanded

                            return (
                                <div key={sectionId} id={section?.id} className='mb-4'>
                                    <div
                                        className='flex pt-3 pb-2 cursor-pointer hover:bg-gray-50 ml-8'
                                        onClick={() => toggleSection(sectionId)}
                                    >
                                        <div className='w-[25%] pl-4'>
                                            <h3 className='font-700 text-16px mb-2 uppercase flex items-center'>
                                                <span className='mr-2'>{isExpanded ? '▼' : '▶'}</span>
                                                {section.headline}
                                            </h3>
                                        </div>
                                        <div className='w-[75%]'></div>
                                    </div>
                                    {isExpanded && (
                                        <div className='flex ml-8 pl-8 pt-2 pb-4'>
                                            <div className='w-[25%]'></div>
                                            <div className='w-[75%] text-16px text-justify'>
                                                {section.paragraphs.map((item: any, itemIdx: any) => {
                                                    // Handle both string format and object format
                                                    if (typeof item === 'string') {
                                                        return (
                                                            <div key={itemIdx}>
                                                                <p>{renderTextWithLinks(item)}</p>
                                                                <div className='h-3'></div>
                                                            </div>
                                                        );
                                                    }
                                                    // Handle object format
                                                    return (
                                                        <div key={itemIdx}>
                                                            {item.type === 'paragraph' && (
                                                                <>
                                                                    <p>{renderTextWithLinks(item.text)}</p>
                                                                    <div className='h-3'></div>
                                                                </>
                                                            )}
                                                            {item.type === 'image' && (
                                                                <img src={item.url} alt={`Image ${itemIdx}`} className={`${item.width} my-4`} />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                {/* Back to top link */}
                                                <div className='mt-4 text-right'>
                                                    <a
                                                        href="#toc"
                                                        className="rdo-link underline cursor-pointer text-14px"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            const el = document.getElementById('toc');
                                                            if (el) {
                                                                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                            }
                                                        }}
                                                    >
                                                        ↑ Back to top
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </>
                ))}
            </>
        )
    }

    function displayTabs(display: any): ReactNode {
        return (
            <>
                {display.map((page: any, index:any) => (
                    <div key={index} id={page.id} className='flex border-t-secondary-second border-t pt-3 mb-8'>
                        <div className='w-[25%]'>
                            <h3 className='font-700 text-18px mb-2 uppercase'>
                                {page.headline}
                            </h3>
                        </div>
                        <div className='w-[75%] text-16px mb-2 text-justify'>
                            <div className='h-3'></div>
                            {page.paragraphs.map((paragraph: any, idx: any) => (
                                <div key={idx}>
                                    {renderTextWithLinks(paragraph)}
                                    <div className='h-3'></div>
                                </div>
                            ))}
                            {/* Back to top link */}
                            <div className='mt-4 text-right'>
                                <a
                                    href="#toc"
                                    className="rdo-link underline cursor-pointer text-14px"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const el = document.getElementById('toc');
                                        if (el) {
                                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }
                                    }}
                                >
                                    ↑ Back to top
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </>
        )

    }

    const aboutSection = display(displayAbout);
    const densityMapsSection = display(displayDensityMaps);
    const homeSection = displayTabs(displayHome);
    const annotationSection = displayTabs(displayAnnotation);
    const validationSection = displayTabs(displayValidation);
    const refinementSection = displayTabs(displayRefinement);
    const browseSection = displayTabs(displayBrowse);

    // Collect all pages and sections for TOC with hierarchy
    const tocStructure = [
        ...displayAbout.map((page: any) => ({
            headline: page.headline,
            sections: page.sections
        })),
        ...displayDensityMaps.map((page: any) => ({
            headline: page.headline,
            sections: page.sections
        })),
        {
            headline: 'Web Application Tabs',
            sections: [
                ...displayHome.map((page: any) => ({ id: page.id, headline: page.headline })),
                ...displayAnnotation.map((page: any) => ({ id: page.id, headline: page.headline })),
                ...displayValidation.map((page: any) => ({ id: page.id, headline: page.headline })),
                ...displayRefinement.map((page: any) => ({ id: page.id, headline: page.headline })),
                ...displayBrowse.map((page: any) => ({ id: page.id, headline: page.headline }))
            ]
        }
    ];

    return (
        <div>
            {/* Table of Contents */}
            <div id="toc" className='mb-8 border-b-secondary-second border-b pb-4'>
                <h3 className='font-700 text-18px mb-3 uppercase'>Table of Contents</h3>
                <div className='ml-4'>
                    {tocStructure.map((page: any, pageIdx: number) => (
                        <div key={pageIdx} className='mb-3'>
                            <div className='font-700 text-16px mb-1'>
                                {page.headline}
                            </div>
                            {page.sections && page.sections.length > 0 && (
                                <div className='ml-4'>
                                    {page.sections.map((section: any, sectionIdx: number) => (
                                        <div key={sectionIdx} className='mb-1'>
                                            <a
                                                href={`#${section.id}`}
                                                className="rdo-link underline cursor-pointer text-15px"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    const el = document.getElementById(section.id);
                                                    if (el) {
                                                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                    }
                                                }}
                                            >
                                                {section.headline}
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div>{aboutSection}</div>
            <div>{densityMapsSection}</div>
            <div>{homeSection}</div>
            <div>{annotationSection}</div>
            <div>{validationSection}</div>
            <div>{refinementSection}</div>
            <div>{browseSection}</div>
        </div>
    );
}

function HowToCite() {
    return (
        <div className='mt-7'>
            <div>
                The NtC alphabet - a unified dinucleotide alphabet of both RNA and DNA conformations is described in <a className='underline cursor-pointer' href='/papers/gkaa383.pdf' target='_blank'>Černý et al., NAR 48, 6367 (2020)</a>
            </div>
            <div>
                The web service (version 3.2) is described in <a className='underline cursor-pointer' href='/papers/rr5151.pdf' target='_blank'>Černý et al., Acta Cryst D 76, 805 (2020)</a>
            </div>
            <div>
                The DNA-based conformers and the way they were identified is described in <a className='underline cursor-pointer' href='/papers/rr5151.pdf'>Schneider et al., Acta Cryst D 74, 52 (2018)</a>
            </div>
            <div>
                For an example application of the DNA Structural Alphabet see <a className='underline cursor-pointer' href='/papers/genes-08-00278-v3.pdf'>Schneider et al., Genes 8, 278, (2017)</a>
            </div>
            <div>
                The web service (version 2) is described in <a className='underline cursor-pointer' href='/papers/gkw381.pdf'>Černý et al., NAR 44, W284 (2016)</a>
            </div>
        </div>
    );
}

function VersionHistory() {
    const navigate = useNavigate();

    return (
        <div>
            {/* v5.0 */}
            <div className='flex border-t-secondary-second border-t mt-4 pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className=' font-700 text-18px mb-2 uppercase'>
                        <a href='' target='_blank'>
                            v5.0
                        </a>
                    </h3>
                </div>
                <div className='w-[75%] mb-2'>
                    <div className=' text-16px text-justify'>
                        DNATCO was reimplemented as client-side web application.
                    </div>
                    <div className=' text-16px text-justify'>
                        Novel validation of nucleic acid valence geometry (bonds and angles) was implemented.
                    </div>
                    <div className=' text-16px text-justify'>
                        Base pairing summary for the PDB-deposited structures was added.
                    </div>
                    <div className=' text-16px text-justify'>
                        Introducing the 'NtC tube', a new graphical representation of nucleic acids.
                    </div>
                    <div className=' text-16px text-justify'>
                        Providing direct links to specific structures, dinucleotide steps, base pairs, and residues with optional bond/angle validation (<a className='underline cursor-pointer' href='#url-parameters' onClick={(e) => { e.preventDefault(); navigate({ pathname: '/app/about/help', hash: 'url-parameters' }); }}>more details here</a>).
                    </div>
                    <div className=' text-16px text-justify'>
                        Complete source code for DNATCO and its submodules/dependencies is now available at <a className='underline cursor-pointer' href='https://github.com/cernylab/dnatco' target='_blank'>https://github.com/cernylab/dnatco</a>.
                    </div>
                </div>
            </div>
            {/* v4.1 */}
            <div className='flex border-t-secondary-second border-t mt-4 pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className=' font-700 text-18px mb-2 uppercase'>
                        <a href='/v4.1' target='_blank'>
                            v4.1
                        </a>
                    </h3>
                </div>
                <div className='w-[75%] mb-2'>
                    <div className=' text-16px text-justify'>
                        Mol* viewer was implemented instead of JSmol.
                    </div>
                    <div className=' text-16px text-justify '>
                        <a className='underline cursor-pointer' href='/v4.1' target='_blank'>/v4.1</a>
                    </div>
                </div>
            </div>
            {/* v3.2 */}
            <div className='flex border-t-secondary-second border-t mt-4 pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className=' font-700 text-18px mb-2 uppercase'>
                        <a href='/v3.2' target='_blank'>
                            v3.2
                        </a>
                    </h3>
                </div>
                <div className='w-[75%] mb-2'>
                    <div className=' text-16px text-justify'>
                        The version described in <a className='underline cursor-pointer' href='/papers/ir5007.pdf' target='_blank'>Černý et al., Acta Cryst D 76, 805 (2020)</a>.
                    </div>
                    <div className=' text-16px text-justify '>
                        Updated the universal set of 96+1 conformers for both DNA and RNA structures.
                    </div>
                    <div className=' text-16px text-justify'>
                        Restraints for <a className='underline cursor-pointer' href='https://www.phenix-online.org/' target='_blank'>Phenix</a>, 
                        <a className='underline cursor-pointer' href='https://www2.mrc-lmb.cam.ac.uk/groups/murshudov/content/refmac/refmac.html' target='_blank'>REFMAC</a>,
                        and <a className='underline cursor-pointer' href='https://github.com/samuelflores/MMB' target='_blank'>MMB</a> can be generated.
                    </div>
                    <div className=' text-16px text-justify'>
                        Support for CCP4/MRC maps was added.
                    </div>
                    <div className=' text-16px text-justify'>
                        Interactive 'connectivity' scatter plot added.
                    </div>
                    <div className=' text-16px text-justify'>
                        Contour plots of RSCC vs Cartesian RMSD or Euclidean distance added.
                    </div>
                    <div className=' text-16px text-justify'>
                        Output of assignment can be downloaded as a JSON file.
                    </div>
                    <div className=' text-16px text-justify '>
                        <a className='underline cursor-pointer' href='/v3.2' target='_blank'>/v3.2</a>
                    </div>
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t mt-4 pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className=' font-700 text-18px mb-2 uppercase'>
                        v3.1
                    </h3>
                </div>
                <div className='w-[75%] mb-2'>
                    <div className=' text-16px text-justify'>
                        User-uploaded data in PDB and mmCIF format are supported.
                    </div>
                    <div className=' text-16px text-justify '>
                        Interactive 'similarity' scatter plot added.
                    </div>
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t mt-4 pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className=' font-700 text-18px mb-2 uppercase'>
                        v3.0
                    </h3>
                </div>
                <div className='w-[75%] mb-2'>
                    <div className=' text-16px text-justify'>
                        A universal set of conformer classes for both DNA and RNA introduced.
                    </div>
                    <div className=' text-16px text-justify '>
                        Additional parameters (NN, CC, NCCN/μ) for better description of intercalated or open steps.
                    </div>
                    <div className=' text-16px text-justify '>
                        Structures from PDB and PDB-REDO databases analyzed as mmCIF format internally.
                    </div>
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t mt-4 pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className=' font-700 text-18px mb-2 uppercase'>
                        <a href='/v2.3'target='_blank'>
                            v2.3
                        </a>
                    </h3>
                </div>
                <div className='w-[75%] mb-2'>
                    <div className=' text-16px text-justify'>
                        Improved assignment protocol involving known δ/pseudorotation angle correlation for detection of outliers.
                    </div>
                    <div className=' text-16px text-justify '>
                        RMSD between selected step and reference reported for atoms defining the nine torsions.
                    </div>
                    <div className=' text-16px text-justify '>
                        Tetrahedron representation of the NtC conformer introduced.
                    </div>
                    <div className=' text-16px text-justify '>
                        <a className='underline cursor-pointer' href='/v2.3' target='_blank'>/v2.3</a>
                    </div>
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t mt-4 pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className=' font-700 text-18px mb-2 uppercase'>
                        <a href='/v2.2' target='_blank'>
                            v2.2
                        </a>
                    </h3>
                </div>
                <div className='w-[75%] mb-2'>
                    <div className=' text-16px text-justify'>
                        Confal (conformer validation score) introduced.
                    </div>
                    <div className=' text-16px text-justify '>
                        Reporting the 'most similar' conformation for non-assigned (NANT) steps.
                    </div>
                    <div className=' text-16px text-justify '>
                        <a className='underline cursor-pointer' href='/v2.2' target='_blank'>/v2.2</a>
                    </div>
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t mt-4 pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className=' font-700 text-18px mb-2 uppercase'>
                        <a href='/v2' target='_blank'>
                            v2
                        </a>
                    </h3>
                </div>
                <div className='w-[75%] mb-2'>
                    <div className=' text-16px text-justify'>
                        The version described in <a className='underline cursor-pointer' href='/papers/gkw381.pdf' target='_blank'>Černý et al., NAR 44, W284 (2016)</a>.
                    </div>
                    <div className=' text-16px text-justify '>
                        Reporting the 'most similar' conformation for non-assigned (NANT) steps.
                    </div>
                    <div className=' text-16px text-justify '>
                        <a className='underline cursor-pointer' href='/v2' target='_blank'>/v2</a>
                    </div>
                </div>
            </div>
            <div className='flex border-t-secondary-second border-t mt-4 pt-3 mb-8'>
                <div className='w-[25%]'>
                    <h3 className=' font-700 text-18px mb-2 uppercase'>
                        <a href='/v1' target='_blank'>
                            v1
                        </a>
                    </h3>
                </div>
                <div className='w-[75%] mb-2'>
                    <div className=' text-16px text-justify'>
                        The initial implementation based on <a className='underline cursor-pointer' href='/papers/gkn260.pdf' target='_blank'>Svozil et al., NAR 36, 3690 (2008)</a>.
                    </div>
                    <div className=' text-16px text-justify '>
                        <a className='underline cursor-pointer' href='/v1'>/v1</a>
                    </div>
                </div>
            </div>
        </div>
    );
}

type Section = typeof Tabs[number][0];

const AboutTab: React.FC = () => {
    const { section } = useParams<{ section?: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    
    const [selected, setSelected] = useState<string>('help');

    const validIds = useMemo(() => new Set<Section>(Tabs.map(([id]) => id)), []);

    useEffect(() => {
        if (!section || !validIds.has(section as Section)) {
            navigate(
                { pathname: '/app/about/help', hash: location.hash || '' },
                { replace: true }
            );
            setSelected('help');
        } else {
            setSelected(section as Section);
        }
    }, [section, navigate, validIds, location.hash]);

    const renderTab = () => {
        switch (section) {
        case 'contact': return <Contact />;
        case 'resources': return <Downloads />;
        case 'help': return <Help />;
        case 'how-to-cite': return <HowToCite />;
        case 'version-history': return <VersionHistory />;
        default:
            return <Help />;
        }
    }

      const sectionLabel = selected
        .replace(/[-_]+/g, ' ')
        .replace(/^./, c => c.toUpperCase());

    return (
        <div className='rdo-offset'>
                <div className='rdo-screen-with-side-panel overflow-hidden h-full flex flex-col'>
                    <SideSwitchingPanel
                        items={Tabs}
                        selectedItemId={selected}
                        onSwitched={id => navigate({ pathname: `/app/about/${id}`, hash: '' })}
                    />
                    <div className='flex flex-col overflow-hidden rdo-offset'>
                        <div className=' text-22px uppercase font-700 mb-4'>
                            {sectionLabel}
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