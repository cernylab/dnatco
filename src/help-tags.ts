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
                    'Conformers: 96 unique dinucleotide classes, defined by 12 backbone torsion angles and interatomic distances (Figure 1).',
                    'Download the full list under Browse > Table of Conformers.',
                    'Codes: four-character labels (e.g., BB00, ZZ1S) that uniquely identify each conformer.',
                    'Resources: Under Help > Resources, access',
                    'Complete conformer definitions',
                    'Average torsion values and estimated standard deviations',
                    'Representative Cartesian coordinates for each conformer',
                    {
                        type: 'image',
                        url: DefinitionNewTrans2Img,
                        width: 'w-[20rem]'
                    },
                    'Figure 1: The 12 parameters defining the NtC conformational class are illustrated here, with backbone torsions in grey and distances in blue, in the context of a dinucleotide step.'
                ],
            },
            {
                id: 'ntcNamingRules',
                headline: 'NtC naming rules',
                paragraphs: [
                    'NtC codes consist of four characters:',
                    '1–2: Backbone geometry types for nucleotides 1 and 2 (A, B, or Z for helical forms, IC for intercalated/parallel but separated bases, OP for open, unstacked bases)',
                    '3–4: Conformer index (or S for syn base in the first/second position)',
                    'NANT: 97th class for unassigned or atypical steps',
                    'Examples: AA00, BB00, BA05, IC07, OP12, ZZS1'
                ],
            },
            {
                id: 'ntcFamilies',
                headline: 'NtC Families',
                paragraphs: [
                    'For visualization and rapid interpretation, conformers are grouped into nine families (color-coded in Mol*):',
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
                    'The Conformational Alphabet of Nucleic Acids (CANA) groups related NtC conformers into 15 three‑letter codes that capture broader structural motifs: A, B, Z forms, open and intercalated steps and more. CANA codes appear alongside NtC labels in tables, offering a high‑level overview while preserving torsion‑level detail.'
                ],
            },
            {
                id: 'basePairs',
                headline: 'Base Pairs',
                paragraphs: [
                    'DNATCO uses the Leontis–Westhof classification system to annotate base pairs by edge and orientation (Leontis & Westhof, RNA 2001), see Figure 2 and Figure 3.',
                    'Edges: Watson–Crick (W), Hoogsteen (H), Sugar (S)',
                    'Orientations: cis (c) or trans (t)',
                    'Base-pair identification is performed via the FR3D tool (Sarver et al., J. Math. Biol. 2008).',
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
                    'Figure 2: Base edges (Left). The three base edges that are available for hydrogen-bonding interactions: Watson-Crick (W), Hoogsteen (H) and Sugar-edge (S). Cis and Trans base-pairing geometries (Right), illustrated for two bases interacting with W edges.',
                    {
                        type: 'image',
                        url: dnatcoFamilies,
                        width: 'max-w-[37rem]'
                    },
                    'Figure 3: Schematic representation of the 12 base pairing families in the Leontis-Westhof classification system, along with a diagram explaining the edges.'
                ],
            },
            {
                id: 'glossaryOfAcronyms',
                headline: 'Glossary of acronyms',
                paragraphs: [
                    'NtC: diNucleotide Conformers (96 + 1 unassigned)',
                    'CANA: Conformational Alphabet of Nucleic Acids (15 clusters)',
                    'CS (Confal Score): Harmonic mean of 12 Gaussian-derived torsion scores (0–100)',
                    'RMSD: Root-Mean-Square Deviation between model and reference (Å)',
                    'RSCC: Real-Space Correlation Coefficient (model vs. experimental density)',
                ],
            },
            {
                id: 'search-functionality',
                headline: 'Search Functionality',
                paragraphs: [
                    'DNATCO provides a built-in search feature to quickly locate specific dinucleotide steps and base pairs within loaded structures. The search icon (magnifying glass) appears in table headers throughout the application.',
                    '',
                    'SEARCH LOCATIONS',
                    '• Annotation > Conformation table - Search by chain and residue number in the Step header',
                    '• Annotation > Base Pairs table - Search by chain and residue number in the main header',
                    '• Validation > Conformer Quality table - Search by chain and residue number in the Step header',
                    '• Refinement > Change NtCs table - Search by chain and residue number in the Step header',
                    '',
                    'HOW TO USE',
                    '1. Click the magnifying glass icon in the table header',
                    '2. Enter search criteria:',
                    '   • For steps/base pairs: Type residue number (e.g., "2109") or chain and residue (e.g., "B 2109")',
                    '   • Respects current model and chain filters if applied',
                    '3. Select a result from the list or press Enter to jump to the first match',
                    '4. Press Escape or click Close to dismiss the search box',
                ],
            },
            {
                id: 'url-parameters',
                headline: 'URL Parameters',
                paragraphs: [
                    'DNATCO supports direct linking to specific structures, dinucleotide steps, base pairs, and residues through URL parameters. This enables sharing exact views and programmatic access to specific data. All chain and residue identifiers use author (user) numbering from mmCIF categories.',
                    'BASIC STRUCTURE SELECTION',
                    '• cifcode={pdbId} - Load structure from PDB (e.g., [/?cifcode=4qvi](/?cifcode=4qvi))',
                    //'• db={database} - Select database: "dnatco", "rcsb", "pdbe" or "pdb-redo" (default: dnatco)',
                    '• db={database} - Select database: "dnatco", "rcsb" or "pdb-redo" (default: dnatco)',
                    '',
                    'DINUCLEOTIDE STEP SELECTION',
                    '• stepName={stepIdentifier} - Navigate to specific step and show in validation table',
                    'Format: {pdbid}[-mX]_{authAsymId1}_{authCompId1}[.{labelAltId1}]_{authSeqId1}[.{pdbxPdbInsCode1}]_{authAsymId2}_{authCompId2}[.{labelAltId2}]_{authSeqId2}[.{pdbxPdbInsCode2}]',
                    '• Model number: Use -mX suffix (e.g., 6r8e-m2 for model 2; model 1 is implicit)',
                    '• Alternative locations (labelAltId): Use .{altId} after compound (e.g., DG.B for altId B)',
                    '• Insertion codes (pdbxPdbInsCode): Use .{insCode} after sequence number (e.g., 100.A for insCode A)',
                    'Example: [/?cifcode=4qvi&stepName=4qvi_B_U_2109_B_G_2110](/?cifcode=4qvi&stepName=4qvi_B_U_2109_B_G_2110)',
                    '',
                    'BASE PAIR SELECTION',
                    '• basePair={pairIdentifier} - Navigate to specific base pair',
                    'Format: {pdbid}[-mX]_{authAsymId1}_{authCompId1}[.{labelAltId1}]_{authSeqId1}[.{pdbxPdbInsCode1}]_{authAsymId2}_{authCompId2}[.{labelAltId2}]_{authSeqId2}[.{pdbxPdbInsCode2}]',
                    '• Model number: Use -mX suffix (e.g., 6r8e-m2 for model 2; model 1 is implicit)',
                    '• Alternative locations (labelAltId): Use .{altId} after compound (e.g., DG.B for altId B)',
                    '• Insertion codes (pdbxPdbInsCode): Use .{insCode} after sequence number (e.g., 100.A for insCode A)',
                    'Example: [/?cifcode=4qvi&basePair=4qvi_B_U_2109_B_U_2180](/?cifcode=4qvi&basePair=4qvi_B_U_2109_B_U_2180)',
                    '',
                    'RESIDUE SELECTION WITH BOND/ANGLE VALIDATION',
                    '• residue={residueIdentifier} - Navigate to specific residue in validation table',
                    'Format: {pdbid}[-mX]_{authAsymId}_{authCompId}[.{labelAltId}]_{authSeqId}[.{pdbxPdbInsCode}]',
                    '• bond={atom1}_{atom2} - Auto-open bond validation window (e.g., &bond=C1\'_C2\')',
                    '• angle={atom1}_{atom2}_{atom3} - Auto-open angle validation window (e.g., &angle=C3\'_C4\'_C5\')',
                    'Note: Atom names with prime (′) could be URL-encoded as %27 (e.g., C1%27 for C1′)',
                    'Examples:',
                    '• Residue with bond: [/?cifcode=4qvi&residue=4qvi_B_U_2109&bond=C1\'_C2\'](/?cifcode=4qvi&residue=4qvi_B_U_2109&bond=C1\'_C2\')',
                    '• Residue with angle: [/?cifcode=4qvi&residue=4qvi_B_U_2109&angle=C3\'_C4\'_C5\'](/?cifcode=4qvi&residue=4qvi_B_U_2109&angle=C3\'_C4\'_C5\')'
                ],
            },
            {
                id: 'url-paths',
                headline: 'URL Paths',
                paragraphs: [
                    'DNATCO provides direct URLs to all application sections. Structure-specific sections (Annotation, Validation, Refinement, Downloads) require a loaded structure via the ?cifcode= parameter. The paths could be further combined with the URL Parameters described above.',
                    '',
                    'ANNOTATION SECTION (requires ?cifcode=)',
                    '• [/app/dnatco/annotation/conformation?cifcode=4qvi](/app/dnatco/annotation/conformation?cifcode=4qvi) - Main conformer analysis view',
                    '• [/app/dnatco/annotation/base-pairs?cifcode=4qvi](/app/dnatco/annotation/base-pairs?cifcode=4qvi) - Base pair annotation',
                    '• [/app/dnatco/annotation/structure-info?cifcode=4qvi](/app/dnatco/annotation/structure-info?cifcode=4qvi) - Structure metadata and information',
                    '• [/app/dnatco/annotation/downloads?cifcode=4qvi](/app/dnatco/annotation/downloads?cifcode=4qvi) - Download annotated data',
                    '• [/app/dnatco/annotation/help-annotation?cifcode=4qvi](/app/dnatco/annotation/help-annotation?cifcode=4qvi) - Annotation help',
                    '',
                    'VALIDATION SECTION (requires ?cifcode=)',
                    '• [/app/dnatco/validation/overall-quality?cifcode=4qvi](/app/dnatco/validation/overall-quality?cifcode=4qvi) - Overall structure quality metrics',
                    '• [/app/dnatco/validation/backbone-quality?cifcode=4qvi](/app/dnatco/validation/backbone-quality?cifcode=4qvi) - Conformer quality analysis',
                    '• [/app/dnatco/validation/step-torsions?cifcode=4qvi](/app/dnatco/validation/step-torsions?cifcode=4qvi) - Step torsion angle analysis',
                    '• [/app/dnatco/validation/similarity-plot?cifcode=4qvi](/app/dnatco/validation/similarity-plot?cifcode=4qvi) - Conformer similarity visualization',
                    '• [/app/dnatco/validation/rscc-plot?cifcode=4qvi](/app/dnatco/validation/rscc-plot?cifcode=4qvi) - RSCC/RMSD plot',
                    '• [/app/dnatco/validation/angles-lengths?cifcode=4qvi](/app/dnatco/validation/angles-lengths?cifcode=4qvi) - Bond length and angle validation',
                    '• [/app/dnatco/validation/downloads-validation?cifcode=4qvi](/app/dnatco/validation/downloads-validation?cifcode=4qvi) - Download validation results',
                    '• [/app/dnatco/validation/help-validation?cifcode=4qvi](/app/dnatco/validation/help-validation?cifcode=4qvi) - Validation help',
                    '',
                    'REFINEMENT SECTION (requires ?cifcode=)',
                    '• [/app/dnatco/refinement/connectivity-plot?cifcode=4qvi](/app/dnatco/refinement/connectivity-plot?cifcode=4qvi) - Connectivity analysis',
                    '• [/app/dnatco/refinement/refmac-restraints?cifcode=4qvi](/app/dnatco/refinement/refmac-restraints?cifcode=4qvi) - REFMAC restraint files',
                    '• [/app/dnatco/refinement/phenix-restraints?cifcode=4qvi](/app/dnatco/refinement/phenix-restraints?cifcode=4qvi) - Phenix restraint files',
                    '• [/app/dnatco/refinement/buster-restraints?cifcode=4qvi](/app/dnatco/refinement/buster-restraints?cifcode=4qvi) - BUSTER restraint files',
                    '• [/app/dnatco/refinement/coot-restraints?cifcode=4qvi](/app/dnatco/refinement/coot-restraints?cifcode=4qvi) - Coot restraint files',
                    '• [/app/dnatco/refinement/mmb-commands-file?cifcode=4qvi](/app/dnatco/refinement/mmb-commands-file?cifcode=4qvi) - MMB commands file',
                    '• [/app/dnatco/refinement/change-ntcs?cifcode=4qvi](/app/dnatco/refinement/change-ntcs?cifcode=4qvi) - Change NtC assignments',
                    '• [/app/dnatco/refinement/help-refinement?cifcode=4qvi](/app/dnatco/refinement/help-refinement?cifcode=4qvi) - Refinement help',
                    '',
                    'DOWNLOADS SECTION (requires ?cifcode=)',
                    '• [/app/dnatco/downloads?cifcode=4qvi](/app/dnatco/downloads?cifcode=4qvi) - Download all analysis results',
                    '',
                    'BROWSE SECTION (no structure required)',
                    '• [/app/browse/conformers](/app/browse/conformers) - Search conformers in database',
                    '• [/app/browse/base-pairs](/app/browse/base-pairs) - Browse base pairs in database',
                    '• [/app/browse/table-of-conformers](/app/browse/table-of-conformers) - Complete conformer table',
                    '• [/app/browse/contour-plots](/app/browse/contour-plots) - Conformer contour plots',
                    '• [/app/browse/reference-sets](/app/browse/reference-sets) - Reference conformer sets',
                    '',
                    'ABOUT SECTION (no structure required)',
                    '• [/app/about/help](/app/about/help) - DNATCO help documentation',
                    '• [/app/about/how-to-cite](/app/about/how-to-cite) - Citation information',
                    '• [/app/about/version-history](/app/about/version-history) - Version history and changelog',
                    '• [/app/about/resources](/app/about/resources) - Additional resources',
                    '• [/app/about/contact](/app/about/contact) - Contact information',
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
                    'DNATCO accepts the following density data formats:',
                    'MTZ Files (.mtz): Reciprocal-space data. Processed using phenix.real_space_correlation. MTZ format [specification](https://www.ccp4.ac.uk/html/mtzformat.html).',
                    'CCP4/MRC Map Files (.ccp4, .map, .mrc): Pre-calculated real-space density maps for crystallographic (2Fo-Fc) or cryo-EM structures. Processed using phenix.map_model_cc. CCP4 MAP format [specification](https://www.ccp4.ac.uk/html/maplib.html).',
                    'DSN6 Files (.dsn6): Legacy density map format, primarily for visualization only.'
                ],
            },
            {
                id: 'fileTypeDetection',
                headline: 'Automatic File Type Detection',
                paragraphs: [
                    'DNATCO automatically detects the file type based on binary signatures:',
                    'MTZ files: Identified by "MTZ " magic bytes at file start (bytes 0-3: 0x4D 0x54 0x5A 0x20)',
                    'CCP4/MRC maps: Identified by "MAP " marker at bytes 208-211 (bytes 208-211: 0x4D 0x41 0x50 0x20)',
                    'The appropriate validation method is selected automatically based on detection.'
                ],
            },
            {
                id: 'rsccCalculation',
                headline: 'RSCC Calculation Methods',
                paragraphs: [
                    'Real-Space Correlation Coefficient (RSCC) measures the agreement between atomic model and experimental density. DNATCO uses different Phenix programs depending on the file format:',
                    'For MTZ Files:',
                    '• Program: phenix.real_space_correlation',
                    '• Parameters: detail=atom, resolution_factor=1./8',
                    'For CCP4/MRC Map Files:',
                    '• Program: phenix.map_model_cc',
                    '• Parameters: compute.cc_per_atom=True, print_cc_per_atom=True, resolution=<value>'
                ],
            },
            {
                id: 'recommendedFormats',
                headline: 'Format Recommendations',
                paragraphs: [
                    'For RSCC Calculation (Validation):',
                    '• Preferred: MTZ files for crystallographic structures',
                    '• Alternative: CCP4/MRC maps work for both crystallographic and EM structures',
                    '• When using a CCP4/MRC map for RSCC calculations, the coordinate file must include the resolution, and this resolution should match the one used to generate the map.',
                    'For Visualization Only:',
                    '• CCP4/MRC maps: Displayed in Mol* viewer alongside structure',
                    '• DSN6 maps: Legacy format, visualization only (no RSCC calculation)',
                    '• Multiple maps: You can provide different map types (2Fo-Fc, Fo-Fc, EM) simultaneously'
                ],
            },
            {
                id: 'uploadingMaps',
                headline: 'Uploading Density Data',
                paragraphs: [
                    'When adding maps in the upload dialog:',
                    '1. Click "Add Files" button to open the map selection modal',
                    '2. Select map type from dropdown (2fo-fc, fo-fc, EM map, or coefficients)',
                    '3. Choose your file (MTZ or CCP4/MRC format)',
                    '4. Add additional maps if needed using "+ Add file" button',
                    '5. Click "Done" when finished',
                    'Important: Use the "Remove" button to delete unwanted files. Removed files are cleared from processing - they will not be included in validation or visualization.',
                    'Map Type Selection:',
                    '• 2fo-fc: Standard crystallographic electron density map',
                    '• fo-fc: Difference density map showing discrepancies',
                    '• EM map: Cryo-EM density maps',
                    '• coefficients: MTZ file containing structure factors and map coefficients for RSCC calculation'
                ],
            },
            {
                id: 'dataProcessing',
                headline: 'How Maps Are Processed',
                paragraphs: [
                    'Client-Side Processing:',
                    '• Visualization maps (CCP4/MRC, DSN6) are processed in your browser',
                    '• Files are parsed locally and displayed in Mol* viewer',
                    '• No data is sent to servers for visualization',
                    'Server-Side Processing (RSCC Calculation):',
                    '• When RSCC calculation is requested, density data is sent to the DNATCO server',
                    '• Appropriate Phenix program is invoked (real_space_correlation or map_model_cc)',
                    '• Per-atom correlation coefficients are calculated and returned',
                    '• Temporary files are deleted immediately after processing'
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