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

export const densityMaps = [
    {
        headline: 'Density Maps and Structure Factors',
        subHeadlineText: 'DNATCO supports multiple density map formats for structure validation. Understanding which format to use and how they are processed helps optimize your validation workflow.',
        sections: [
            {
                id: 'supportedFormats',
                headline: 'Supported Formats',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'DNATCO accepts the following density data formats:'
                    },
                    {
                        type: 'paragraph',
                        text: 'MTZ Files (.mtz): Crystallographic structure factors containing reflection data and map coefficients. Processed using phenix.real_space_correlation. Format specification: https://www.ccp4.ac.uk/html/mtzformat.html'
                    },
                    {
                        type: 'paragraph',
                        text: 'CCP4/MRC Map Files (.ccp4, .map, .mrc): Pre-calculated electron density maps for both crystallographic (2Fo-Fc, Fo-Fc) and cryo-EM structures. Processed using phenix.map_model_cc. Format specification: https://www.ccp4.ac.uk/html/maplib.html'
                    },
                    {
                        type: 'paragraph',
                        text: 'DSN6 Files (.dsn6): Legacy density map format, primarily for visualization only.'
                    },
                ],
            },
            {
                id: 'fileTypeDetection',
                headline: 'Automatic File Type Detection',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'DNATCO automatically detects the file type based on binary signatures:'
                    },
                    {
                        type: 'paragraph',
                        text: 'MTZ files: Identified by "MTZ " magic bytes at file start (bytes 0-3: 0x4D 0x54 0x5A 0x20)'
                    },
                    {
                        type: 'paragraph',
                        text: 'CCP4/MRC maps: Identified by "MAP " marker at bytes 208-211 (bytes 208-211: 0x4D 0x41 0x50 0x20)'
                    },
                    {
                        type: 'paragraph',
                        text: 'The appropriate validation method is selected automatically based on detection.'
                    },
                ],
            },
            {
                id: 'rsccCalculation',
                headline: 'RSCC Calculation Methods',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'Real-Space Correlation Coefficient (RSCC) measures the agreement between atomic model and experimental density. DNATCO uses different Phenix programs depending on the file format:'
                    },
                    {
                        type: 'paragraph',
                        text: 'For MTZ Files (Structure Factors):'
                    },
                    {
                        type: 'paragraph',
                        text: '• Program: phenix.real_space_correlation'
                    },
                    {
                        type: 'paragraph',
                        text: '• Purpose: Calculates maps from structure factors and correlates them with the model'
                    },
                    {
                        type: 'paragraph',
                        text: '• Best for: Crystallographic data with reflection data'
                    },
                    {
                        type: 'paragraph',
                        text: '• Parameters: detail=atom, resolution_factor=1./8'
                    },
                    {
                        type: 'paragraph',
                        text: 'For CCP4/MRC Map Files:'
                    },
                    {
                        type: 'paragraph',
                        text: '• Program: phenix.map_model_cc'
                    },
                    {
                        type: 'paragraph',
                        text: '• Purpose: Directly correlates pre-calculated density maps with the model'
                    },
                    {
                        type: 'paragraph',
                        text: '• Best for: Both crystallographic maps (2Fo-Fc, Fo-Fc) and cryo-EM density maps'
                    },
                    {
                        type: 'paragraph',
                        text: '• Parameters: compute.cc_per_atom=True, print_cc_per_atom=True, resolution=<value> (for EM maps)'
                    },
                ],
            },
            {
                id: 'recommendedFormats',
                headline: 'Format Recommendations',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'For RSCC Calculation (Validation):'
                    },
                    {
                        type: 'paragraph',
                        text: '• Preferred: MTZ files for crystallographic structures (most accurate, uses original reflection data)'
                    },
                    {
                        type: 'paragraph',
                        text: '• Alternative: CCP4/MRC maps work for both crystallographic and EM structures'
                    },
                    {
                        type: 'paragraph',
                        text: '• EM structures: Must use CCP4/MRC map format with resolution parameter'
                    },
                    {
                        type: 'paragraph',
                        text: 'For Visualization Only:'
                    },
                    {
                        type: 'paragraph',
                        text: '• CCP4/MRC maps: Displayed in Mol* viewer alongside structure'
                    },
                    {
                        type: 'paragraph',
                        text: '• DSN6 maps: Legacy format, visualization only (no RSCC calculation)'
                    },
                    {
                        type: 'paragraph',
                        text: '• Multiple maps: You can provide different map types (2Fo-Fc, Fo-Fc, EM) simultaneously'
                    },
                ],
            },
            {
                id: 'uploadingMaps',
                headline: 'Uploading Density Data',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'When adding maps in the upload dialog:'
                    },
                    {
                        type: 'paragraph',
                        text: '1. Click "Add Files" button to open the map selection modal'
                    },
                    {
                        type: 'paragraph',
                        text: '2. Select map type from dropdown (2fo-fc, fo-fc, EM map, or coefficients)'
                    },
                    {
                        type: 'paragraph',
                        text: '3. Choose your file (MTZ or CCP4/MRC format)'
                    },
                    {
                        type: 'paragraph',
                        text: '4. Add additional maps if needed using "+ Add file" button'
                    },
                    {
                        type: 'paragraph',
                        text: '5. Click "Done" when finished'
                    },
                    {
                        type: 'paragraph',
                        text: 'Important: Use the "Remove" button to delete unwanted files. Removed files are cleared from processing - they will not be included in validation or visualization.'
                    },
                    {
                        type: 'paragraph',
                        text: 'Map Type Selection:'
                    },
                    {
                        type: 'paragraph',
                        text: '• 2fo-fc: Standard crystallographic electron density map'
                    },
                    {
                        type: 'paragraph',
                        text: '• fo-fc: Difference density map showing discrepancies'
                    },
                    {
                        type: 'paragraph',
                        text: '• EM map: Cryo-EM density maps'
                    },
                    {
                        type: 'paragraph',
                        text: '• coefficients: MTZ file containing structure factors and map coefficients for RSCC calculation'
                    },
                ],
            },
            {
                id: 'dataProcessing',
                headline: 'How Maps Are Processed',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'Client-Side Processing:'
                    },
                    {
                        type: 'paragraph',
                        text: '• Visualization maps (CCP4/MRC, DSN6) are processed in your browser'
                    },
                    {
                        type: 'paragraph',
                        text: '• Files are parsed locally and displayed in Mol* viewer'
                    },
                    {
                        type: 'paragraph',
                        text: '• No data is sent to servers for visualization'
                    },
                    {
                        type: 'paragraph',
                        text: 'Server-Side Processing (RSCC Calculation):'
                    },
                    {
                        type: 'paragraph',
                        text: '• When RSCC calculation is requested, density data is sent to the Phenix server'
                    },
                    {
                        type: 'paragraph',
                        text: '• File type is automatically detected by binary signature'
                    },
                    {
                        type: 'paragraph',
                        text: '• Appropriate Phenix program is invoked (real_space_correlation or map_model_cc)'
                    },
                    {
                        type: 'paragraph',
                        text: '• Per-atom correlation coefficients are calculated and returned'
                    },
                    {
                        type: 'paragraph',
                        text: '• Temporary files are deleted immediately after processing'
                    },
                ],
            },
            {
                id: 'technicalDetails',
                headline: 'Technical Details',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'Configuration Requirements:'
                    },
                    {
                        type: 'paragraph',
                        text: '• Phenix installation with both phenix.real_space_correlation and phenix.map_model_cc'
                    },
                    {
                        type: 'paragraph',
                        text: '• Scratch directory for temporary file processing (/tmp/phenix_rednatco by default)'
                    },
                    {
                        type: 'paragraph',
                        text: 'File Extensions:'
                    },
                    {
                        type: 'paragraph',
                        text: '• MTZ files: .mtz extension, stored as refls.mtz during processing'
                    },
                    {
                        type: 'paragraph',
                        text: '• CCP4/MRC maps: .ccp4, .map, .mrc extensions, stored as map.ccp4 during processing'
                    },
                    {
                        type: 'paragraph',
                        text: 'Performance:'
                    },
                    {
                        type: 'paragraph',
                        text: '• MTZ processing: Slower (must calculate maps from reflections) but most accurate'
                    },
                    {
                        type: 'paragraph',
                        text: '• CCP4/MRC processing: Faster (uses pre-calculated maps) but requires properly prepared maps'
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
            'Optional Maps: Fo–Fc, 2Fo–Fc, EM maps or map coefficients. See Help > Density Maps for detailed format information.',
            'Next Steps: Annotation, Validation, or Refinement',
            'Requirements: Standard atom names (PDB ≥ 3.1). Omits steps missing δ to δ+1 or χ torsions. Modified residues with standard nomenclature are accepted. For non‑standard residues or NMR/MD data, contact the DNATCO team.',
            'User-Provided Structures: When uploading custom PDB/mmCIF files, DNATCO processes them locally in your browser. If the file cannot be parsed or contains geometry issues, you will be prompted to repair it using the MAXIT converter (maxit.datmos.org).',
            'MAXIT Integration: Files with parsing or geometry errors can be automatically sent to maxit.datmos.org for standardization and repair. MAXIT validates structure geometry, corrects formatting issues, and returns a standardized mmCIF file that DNATCO can process. After successful conversion, you can either download the repaired file or directly analyze it in DNATCO.',
            'Data Privacy: User-uploaded files are processed client-side in your browser whenever possible. If MAXIT repair is required, your file will be temporarily uploaded to maxit.datmos.org for processing. All files on the MAXIT server are automatically deleted immediately after conversion. If your data is confidential or unpublished, please be aware of this temporary server-side processing before using the repair feature.'
        ]
    }
]

export const annotation = [
    {
        headline: 'Annotation page',
        paragraphs: [
            'Provides a concise overview of conformer assignments and structural features across five tabs:',
            'Conformation: Table of assigned NtC classes (left) and Mol* viewer with color-coded NtC tube (right); colors correspond to NtC family categories.',
            'Base Pairs: Leontis–Westhof annotation of base pairs by edge (Watson–Crick, Hoogsteen, Sugar) and orientation (cis/trans), see User’s Guide.',
            'Structure Info: Key metadata from the mmCIF: experimental method, resolution, deposition date, and citation.',
            'Downloads: Export tables of assigned NtCs (CSV, JSON) and the annotated mmCIF with DNATCO categories.'
        ],
    },
]

export const validation = [
    {
        headline: 'Validation page',
        paragraphs: [
            'Delivers in-depth quality metrics via seven tabs:',
            'Overall Quality: Summary of total conformers, RMSD distributions, mean confal score, and valence-geometry assessment.',
            'Conformer Quality: Stepwise table with NtC, CANA, CS, and RMSD, color-coded (red → yellow → green) to indicate quality.',
            'Base Pairs: Leontis–Westhof annotation of base pairs by edge (Watson–Crick, Hoogsteen, Sugar) and orientation (cis/trans), see User’s Guide.',
            'Step Torsions: Displays 12 torsion angles for a selected step versus reference distributions (violin plots + overlaid values).',
            'Similarity Plot: Interactive RMSD (Å) vs. torsional distance (°) scatter plot for all NtC references; colors reflect RMSD thresholds (< 1 Å = green).',
            'RSCC/RMSD Plot: Contour-backed scattergrams correlating RSCC and RMSD for assigned vs. unassigned steps, linked to Mol* for interactive selection.',
            'Bond Lengths & Angles: Compares bond-geometry parameters to curated standards. Multi-colored stripes indicate percentile groups; expandable sections reveal per-residue statistics and probability plots.',
            'Downloads: Provides all validation outputs for offline analysis. Extended mmCIF file: mmCIF with additional DNATCO categories. Assigned NtCs tables: summary and full tables (with confal score & RMSD) in CSV/JSON. Bond lengths & angles by residue: individual-residue measurements (CSV, JSON). Bond lengths & angles by nucleotide type: aggregated by nucleotide (CSV, JSON). Valence-geometry reports: Naval validation reports for bond lengths, bond angles, and overall geometry (CSV). RSCC vs. RMSD plots: assigned vs. unassigned step plots (SVG). Structure validation report: comprehensive report listing all dinucleotide steps (PDF or plain-text).'
        ],
    }
]

export const refinement = [
    {
        headline: 'Refinement page',
        paragraphs: [
            'Facilitates real-time adjustment of NtC assignments:',
            'Change NtCs: Create custom torsion-restraint sets by selecting new NtC codes (click Add, name set). The default Computed set is read-only; multiple custom sets can be saved and reused.',
            `Connectivity Plot: Two plots evaluate O3' and C5' atomic distances with overlapping dinucleotide steps, helping to establish compatibility of the central step with the previous and next steps.`,
            'Restraints: Export restraint files for REFMAC, Coot, Phenix, Buster, and MMB (MacroMolecule Builder).',
        ],
    }
]

export const browse = [
    {
        headline: 'Browse page',
        paragraphs: [
            'Explore conformer and base-pair resources:',
            'Conformers: Search the PDB for NtC examples. Results include step ID, NtC, CANA, CS, RMSD, resolution, and density availability. Click to open and highlight your step in DNATCO analysis in a new window.',
            'Base Pairs: Link to basepairs.datmos.org for detailed base-pair data.',
            'Table of Conformers: Lists all 96 NtC classes with annotations, DNA/RNA occurrence frequencies, and defining parameters.',
            'Contour Plots: RSCC vs. RMSD scattergrams for structures at < 1.8 Å and > 2.5 Å resolution, divided into quadrants with percentage annotations for quick quality assessment. (Lower-right = good geometry & good density fit).',
        ],
    }
]