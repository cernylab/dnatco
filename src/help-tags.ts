import { DefinitionNewTrans2Img, dnatcoFamilies, interactingEdges, cisTrans, ntcFamiliesTable, } from "./assets/images"

export const about = [
    {
        headline: "User's guide",
        subHeadlineText: 'The DNATCO web application delivers detailed conformational analysis and validation of nucleic acid structures using the NtC (diNucleotide Conformer) structural alphabet. By assigning NtC labels to each dinucleotide step, DNATCO reveals backbone geometry, supports structure validation, and guides refinement workflows.',
        sections: [
            {
                id: 'ntcStructuralAlphabet',
                headline: 'The NtC structural alphabet',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'Conformers: 96 unique dinucleotide classes, defined by 12 backbone torsion angles and interatomic distances (Figure 1).',
                    },
                    {
                        type: 'paragraph',
                        text: 'Download the full list under Browse > Table of Conformers.'
                    },
                    {
                        type: 'paragraph',
                        text: 'Codes: four-character labels (e.g., BB00, ZZ1S) that uniquely identify each conformer.',
                    },
                    {
                        type: 'paragraph',
                        text: 'Resources: Under Help > Resources, access',
                    },
                    {
                        type: 'paragraph',
                        text: 'Complete conformer definitions',
                    },
                    {
                        type: 'paragraph',
                        text: 'Average torsion values and estimated standard deviations',
                    },
                    {
                        type: 'paragraph',
                        text: 'Representative Cartesian coordinates for each conformer',
                    },
                    {
                        type: 'image',
                        url: DefinitionNewTrans2Img,
                        width: 'w-[20rem]'
                    },
                    {
                        type: 'paragraph',
                        text: 'Figure 1: The 12 parameters defining the NtC conformational class are illustrated here, with backbone torsions in grey and distances in blue, in the context of a dinucleotide step.',
                    },
                ],
            },
            {
                id: 'ntcNamingRules',
                headline: 'NtC naming rules',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'NtC codes consist of four characters:'
                    },
                    {
                        type: 'paragraph',
                        text: '1–2: Backbone geometry types for nucleotides 1 and 2 (A, B, or Z for helical forms, IC for intercalated/parallel but separated bases, OP for open, unstacked bases)'
                    },
                    {
                        type: 'paragraph',
                        text: '3–4: Conformer index (or S for syn base in the first/second position)'
                    },
                    {
                        type: 'paragraph',
                        text: 'NANT: 97th class for unassigned or atypical steps'
                    },
                    {
                        type: 'paragraph',
                        text: 'Examples: AA00, BB00, BA05, IC07, OP12, ZZS1'
                    },
                ],
            },
            {
                id: 'ntcFamilies',
                headline: 'NtC Families',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'For visualization and rapid interpretation, conformers are grouped into nine families (color-coded in Mol*):'
                    },
                    {
                        type: 'image',
                        url: ntcFamiliesTable,
                        width: 'max-w-[37rem]'
                    },
                ],
            },
            {
                id: 'cana',
                headline: 'Cana',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'The Conformational Alphabet of Nucleic Acids (CANA) groups related NtC conformers into 15 three‑letter codes that capture broader structural motifs: A, B, Z forms, open and intercalated steps and more. CANA codes appear alongside NtC labels in tables, offering a high‑level overview while preserving torsion‑level detail.'
                    },
                ],
            },
            {
                id: 'basePairs',
                headline: 'Base Pairs',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'DNATCO uses the Leontis–Westhof classification system to annotate base pairs by edge and orientation (Leontis & Westhof, RNA 2001), see Figure 2 and Figure 3.'
                    },
                    {
                        type: 'paragraph',
                        text: 'Edges: Watson–Crick (W), Hoogsteen (H), Sugar (S)'
                    },
                    {
                        type: 'paragraph',
                        text: 'Orientations: cis (c) or trans (t)'
                    },
                    {
                        type: 'paragraph',
                        text: 'Base-pair identification is performed via the FR3D tool (Sarver et al., J. Math. Biol. 2008).'
                    },
                    {
                        type: 'image',
                        url: interactingEdges,
                        width: 'max-w-[37rem]'
                    },
                    {
                        type: 'image',
                        url: cisTrans,
                        width: 'max-w-[37rem]'
                    },
                    {
                        type: 'paragraph',
                        text: 'Figure 2: Base edges (Left). The three base edges that are available for hydrogen-bonding interactions: Watson-Crick (W), Hoogsteen (H) and Sugar-edge (S). Cis and Trans base-pairing geometries (Right), illustrated for two bases interacting with W edges.'
                    },
                    {
                        type: 'image',
                        url: dnatcoFamilies,
                        width: 'max-w-[37rem]'
                    },
                    {
                        type: 'paragraph',
                        text: 'Figure 3: Schematic representation of the 12 base pairing families in the Leontis-Westhof classification system, along with a diagram explaining the edges.'
                    },
                ],
            },
            {
                id: 'glossaryOfAcronyms',
                headline: 'Glossary of acronyms',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'NtC: diNucleotide Conformers (96 + 1 unassigned)',
                    },
                    {
                        type: 'paragraph',
                        text: 'CANA: Conformational Alphabet of Nucleic Acids (15 clusters)',
                    },
                    {
                        type: 'paragraph',
                        text: 'CS (Confal Score): Harmonic mean of 12 Gaussian-derived torsion scores (0–100)',
                    },
                    {
                        type: 'paragraph',
                        text: 'RMSD: Root-Mean-Square Deviation between model and reference (Å)',
                    },
                    {
                        type: 'paragraph',
                        text: 'RSCC: Real-Space Correlation Coefficient (model vs. experimental density)',
                    },
                ],
            },
        ],
    }
]

export const home = [
    {
        headline: 'Home page',
        paragraphs: [
            'Data Input: Enter a PDB ID or upload a PDB/mmCIF file',
            'Optional Maps: Fo–Fc, 2Fo–Fc, EM maps or map coefficients',
            'Next Steps: Annotation, Validation, or Refinement',
            'Requirements: Standard atom names (PDB ≥ 3.1). Omits steps missing δ to δ+1 or χ torsions. Modified residues with standard nomenclature are accepted. For non‑standard residues or NMR/MD data, contact the DNATCO team.'
        ]
    }
]

export const annotation = [
    {
        headline: 'Annotation page',
        subHeadlineText: 'Provides a concise overview of conformer assignments and structural features across five tabs:',
        sections: [
            {
                id: 'mainFeatures',
                headline: 'Main Features',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'Table of assigned NtC classes (left) and Mol* viewer with color‑coded NtC tube (right); colors correspond to NtC family categories.',
                    },
                ],
            },
            {
                id: 'assignedNtCs',
                headline: 'Assigned NtCs',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'Table of all dinucleotide steps with NtC class, CANA letter, confal score, and RMSD. Hover for torsion details; selecting a row highlights that step and overlays its reference conformer in Mol*.',
                    },
                ],
            },
            {
                id: 'basePairs',
                headline: 'Base Pairs',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'Leontis–Westhof annotation of base pairs by edge (Watson–Crick, Hoogsteen, Sugar) and orientation (cis/trans), see User’s Guide.',
                    },
                ],
            },
            {
                id: 'structureInfo',
                headline: 'Structure Info',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'Key metadata from the mmCIF: experimental method, resolution, deposition date, and citation.'
                    },
                ],
            },
            {
                id: 'downloads',
                headline: 'Downloads',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'Export tables of assigned NtCs (CSV, JSON) and the annotated mmCIF with DNATCO categories.'
                    },
                ],
            },
        ],
    },
]

export const validation = [
    {
        headline: 'Validation page',
        subHeadlineText: 'Delivers in-depth quality metrics via seven tabs:',
        sections: [
            {
                id: 'overallQuality',
                headline: 'Overall Quality',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'Summary of total conformers, RMSD distributions, mean confal score, and valence-geometry assessment.',
                    },
                ],
            },
            {
                id: 'backboneQuality',
                headline: 'Backbone Quality',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'Stepwise table with NtC, CANA, CS, and RMSD, color-coded (red → yellow → green) to indicate quality.',
                    },
                ],
            },
            {
                id: 'stepTorsions',
                headline: 'Step Torsions',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'Displays 12 torsion angles for a selected step versus reference distributions (violin plots + overlaid values).'
                    },
                ],
            },
            {
                id: 'similarityPlot',
                headline: 'Similarity Plot',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'Interactive RMSD (Å) vs. torsional distance (°) scatter plot for all NtC references; colors reflect RMSD thresholds (< 1 Å = green).',
                    },
                ],
            },
            {
                id: 'rsccRmsdPlot',
                headline: 'RSCC/RMSD Plot',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'Contour-backed scattergrams correlating RSCC and RMSD for assigned vs. unassigned steps, linked to Mol* for interactive selection.'
                    },
                ],
            },
            {
                id: 'bondLengthsAngles',
                headline: 'Bond Lengths & Angles',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'Compares bond-geometry parameters to curated standards. Multi-colored stripes indicate percentile groups; expandable sections reveal per-residue statistics and probability plots.'
                    },
                ],
            },
            {
                id: 'downloads',
                headline: 'Downloads',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'Provides all validation outputs for offline analysis:'
                    },
                    {
                        type: 'paragraph',
                        text: 'Extended mmCIF file: mmCIF with additional DNATCO categories.'
                    },
                    {
                        type: 'paragraph',
                        text: 'Assigned NtCs tables: summary and full tables (with confal score & RMSD) in CSV/JSON.'
                    },
                    {
                        type: 'paragraph',
                        text: 'Bond lengths & angles by residue: individual-residue measurements (CSV, JSON).'
                    },
                    {
                        type: 'paragraph',
                        text: 'Bond lengths & angles by nucleotide type: aggregated by nucleotide (CSV, JSON).'
                    },
                    {
                        type: 'paragraph',
                        text: 'Valence-geometry reports: Naval validation reports for bond lengths, bond angles, and overall geometry (CSV).'
                    },
                    {
                        type: 'paragraph',
                        text: 'RSCC vs. RMSD plots: assigned vs. unassigned step plots (SVG).'
                    },
                    {
                        type: 'paragraph',
                        text: 'Structure validation report: comprehensive report listing all dinucleotide steps (PDF or plain-text).'
                    },
                ],
            }
        ]
    }
]

export const refinement = [
    {
        headline: 'Refinement page',
        subHeadlineText: 'Facilitates real-time adjustment of NtC assignments:',
        sections: [
            {
                id: 'changeNtCs',
                headline: 'Change NtCs',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'Create custom torsion-restraint sets by selecting new NtC codes (click Add, name set). The default Computed set is read-only; multiple custom sets can be saved and reused.'
                    },
                ],
            },
            {
                id: 'connectivityPlot',
                headline: 'Connectivity Plot',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: `Two plots evaluate O3' and C5' atomic distances with overlapping dinucleotide steps, helping to establish compatibility of the central step with the previous and next steps.`,
                    },
                ],
            },
            {
                id: 'restraints',
                headline: 'Restraints',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'Export restraint files for REFMAC, Coot, Phenix, Buster, and MMB (MacroMolecule Builder).',
                    },
                ],
            },
        ],
    }
]

export const browse = [
    {
        headline: 'Browse page',
        subHeadlineText: 'Explore conformer and base-pair resources:',
        sections: [
            {
                id: 'conformers',
                headline: 'Conformers',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'Search the PDB for NtC examples. Results include step ID, NtC, CANA, CS, RMSD, resolution, and density availability. Click to open and highlight your step in DNATCO analysis in a new window.',
                    },
                ],
            },
            {
                id: 'basePairs',
                headline: 'Base Pairs',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'Link to basepairs.datmos.org for detailed base-pair data.',
                    },
                ],
            },
            {
                id: 'tableOfConformers',
                headline: 'Table of Conformers',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'Lists all 96 NtC classes with annotations, DNA/RNA occurrence frequencies, and defining parameters.',
                    },
                ],
            },
            {
                id: 'contourPlots',
                headline: 'Contour Plots',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'RSCC vs. RMSD scattergrams for structures at < 1.8 Å and > 2.5 Å resolution, divided into quadrants with percentage annotations for quick quality assessment. (Lower-right = good geometry & good density fit). ',
                    },
                ],
            },
        ]
    }
]