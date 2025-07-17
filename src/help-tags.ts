import { DefinitionNewTrans2Img, dnatcoFamilies, interactingEdges, cisTrans, } from "./assets/images"

export const about = [
    {
        headline: "User's guide",
        subHeadlineText: 'The DNATCO web application is designed to offer comprehensive analysis and validation of nucleic acid structures, primarily relying on the identification of dinucleotide conformers through the NtC structural alphabet. By employing NtC analysis, this tool provides detailed insights into the conformational characteristics of nucleic acid structures. Users can leverage this feature to attain a deeper comprehension of their data, as well as to validate and refine their structures.',
        sections: [
            {
                id: 'ntcStructuralAlphabet',
                headline: 'The NtC structural alphabet',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'The DNATCO server relies on the NtC structural alphabet, comprising 96 symbols that represent unique dinucleotide conformers. These conformers are determined by assessing 12 specific backbone torsion parameters (as depicted in Figure 1), which characterise the conformation of the DNA/RNA backbone.',
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
                    {
                        type: 'paragraph',
                        text: 'The NtC structural alphabet, developed within our institute, serves as a valuable tool for the analysis of nucleic acid structures, encompassing both DNA and RNA. This structural alphabet employs a set of 96 symbols, each comprising four characters (e.g., BB00 or ZZ1S), and these symbols represent distinct dinucleotide conformers. Detailed explanation for the nomenclature of NtC conformers is provided below. A comprehensive table listing all NtC conformers is accessible for download via the "ABOUT > Downloads" tab. Additionally, users have the option to download the definitions of NtC conformers, including torsion averages and esd values, along with representative structures of these conformers in cartesian coordinates.',
                    },
                ],
            },
            {
                id: 'ntcNamingRules',
                headline: 'NtC naming rules',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'The NtC conformers are denoted by four-character symbols. Conformers whose symbols commence with "A," "B," or "Z" in the first and/or second position correspond to dinucleotides featuring stacked bases, with the initial or second nucleotide adopting an A-, B-, or Z-like conformation, respectively (e.g., AA00, BB00 exemplifying the canonical A-form and B-form structures). Conformers with names beginning with "IC" represent steps with bases that are parallel but distanced and can be intercalated, while those starting with "OP" pertain to steps with unstacked "open" bases. Symbols featuring "S" in the 3rd or 4th position indicate that the first or second base, respectively, is in the syn orientation. Conformers that deviate significantly from the categories above are designated as the 97th conformer and are formally referred to as "NANT."'
                    },
                ],
            },
            {
                id: 'glossaryOfAcronyms',
                headline: 'Glossary of acronyms',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'NtC, short for the diNucleotide Conformers, is a structural alphabet that characterises dinucleotide conformers based on 12 torsion and distance parameters. It categorises these conformers into 96+1 classes, with the final class reserved for those that have not been specifically assigned.',
                    },
                    {
                        type: 'paragraph',
                        text: 'CANA, the Conformational Alphabet of Nucleic Acids, clusters similar NtCs together and consists of 14+1 symbols. For more details on NtCs and CANA letters, please refer to the "Browse > Table of Conformers" section.',
                    },
                    {
                        type: 'paragraph',
                        text: `CS, which stands for the "Confal Score," is a quality metric. A score of 100 indicates a perfect alignment with a reference, while a score of 0 signifies a significant departure from the expected conformation. The confal function follows a Gaussian distribution, peaking at 100 at the parameter's average value and tapering off to 1 as it approaches the boundary closer to the average. Values further from the average are assigned a confal score of 0. To determine the confal score for a given step, it's calculated as the harmonic mean of its 12 confal values. For an entire structure, the confal score is derived as the average of the individual step values.`,
                    },
                    {
                        type: 'paragraph',
                        text: 'RMSD, or the Root Mean Square Deviation, quantifies the average spatial difference in cartesian coordinates between the analysed step and a reference.',
                    },
                    {
                        type: 'paragraph',
                        text: 'RSCC, or the real-space correlation coefficient, serves as a metric for quantifying the likeness between an electron-density map derived directly from a structural model and one computed from experimental data.',
                    },
                ],
            },
        ],
    }
]

export const home = [
    {
        headline: 'Home page',
        subHeadlineText: 'The Home page offers users an interface for entering their data, presenting them with two choices. They can input a PDB ID to select a structure from a database, or they can upload a custom file containing a nucleic acid structure in either PDB or mmCIF format. After submitting the structure, the user can then navigate to one of three subsequent pages: Annotation, Validation, or Refinement, based on the specific analysis they need.',
        paragraphs: [
            'Density maps: For users who opt to upload a custom file, there is also the choice to include various types of density maps (Fo-FC, 2Fo-Fc, EM, and map coefficients) along with their submission.',
            'Structure requirements: The analysis of DNA/RNA steps relies on atom names defined in the PDB format, version 3.1 or later. Steps that lack the atoms defining torsions δ1 to δ2, χ1, and χ2, or feature non-standard atoms in these positions, are excluded from the assignment process. However, modified residues that possess standard atom names for defining step torsions between δ and δ+1 and χ and χ+1 are eligible for conformer assignment. For a comprehensive list of accepted residues, please consult the provided list of accepted residues. If you are dealing with extensive structures comprising multiple NMR MODELs or MD simulation trajectories, or if you have non-standard residues that necessitate analysis, kindly reach out to the authors for offline analysis.'
        ]
    }
]

export const annotation = [
    {
        headline: 'Annotation page',
        subHeadlineText: 'The Annotation page offers users a concise summary of the analysis outcomes, which are derived from the assignment of NtC classes. The page is structured into three tabs: "Assigned NtCs," "Structure Info," and "Downloads."',
        sections: [
            {
                id: 'basePairs',
                headline: 'Base pairs',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'The Leontis-Westhof classification system annotates base pairs according to the interacting edge used on each base (Watson-Crick, Hoogsteen, Sugar), and bond orientation (Cis, Trans). The classification table is shown below, along with diagrams explaining the edge pairings and bond orientations (Leontis NB and Westhof E. (2001) Geometric nomenclature and classification of RNA base pairs. RNA 7:499-512).'
                    },
                    {
                        type: 'image',
                        url: dnatcoFamilies,
                        width: 'max-w-[40rem]'
                    },
                    {
                        type: 'image',
                        url: interactingEdges,
                        width: 'max-w-[40rem]'
                    },
                    {
                        type: 'image',
                        url: cisTrans,
                        width: 'max-w-[40rem]'
                    },
                    {
                        type: 'paragraph',
                        text: 'Base edges and Base-pair geometric isomerism. (Upper left) An adenosine showing the three base edges that are available for hydrogen-bonding interactions: Watson-Crick (W-C), Hoogsteen and Sugar-edge. (Lower left) Representation of RNA base as a triangle. The position of the ribose is indicated with a circle in the corner defined by the Hoogsteen and Sugar edge. (Right) Cis and Trans base-pairing geometries, illustrated for two bases interacting with W-C edges.',
                    },
                    {
                        type: 'paragraph',
                        text: 'Basepairs geometric families and their annotation. Upper panel: Twelve geometric basepair families resulting from all combinations of edge-to-edge interactions of two bases with cis or trans orientation of the glycosidic bonds. Circles represent W-C edges, squares Hoogsteen edges, and triangles Sugar edges. Basepair symbols are composed by combining edge symbols, with solid symbols indicating cis basepairs and open symbol, trans basepairs. Lower Left: Symbols for other pairwise interactions (Leontis NB, Stombaugh J, Westhof E. (2002) The non-W-C base pairs and their associated isostericity matrices. Nucleic Acids Res 30:3497-3531).'
                    },
                    {
                        type: 'paragraph',
                        text: 'FR3D: Finding Local and Composite Recurrent Structural Motifs in RNA 3D Structures, Michael Sarver; Craig L. Zirbel; Jesse Stombaugh; Ali Mokdad; Neocles B. Leontis. Journal of Mathematical Biology (2008) 56:215–252.'
                    },
                ],
            },
            {
                id: 'assignedNtCs',
                headline: 'Assigned NtCs tab',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'The "Assigned NtCs" tab is divided into three sections: a left sidebar with tabs, a central section featuring a table of results, and a right panel housing a Mol* viewer. The results table showcases all dinucleotide steps within the structure, along with their corresponding NtC class and CANA letter assignments. Hovering the mouse over the information button for each dinucleotide step grants users access to more detailed information about the 12 parameters defining the NtC conformation.',
                    },
                    {
                        type: 'paragraph',
                        text: 'The Mol* viewer on the right side of the tab offers a visual representation of the nucleic acid structure in cartoon mode, with NtC conformations represented by colour-coded phosphate-centred pyramids. Importantly, the Mol* viewer and the table are interconnected, meaning that selecting a step in the table will highlight the chosen step in the Mol* viewer (showing an overlaid reference structure in yellow), and vice versa. In the case of larger structures with multiple chains, like the ribosome, users can filter the results to display data for only one selected chain, and the Mol* viewer will accordingly present the selected chain exclusively.',
                    },
                ],
            },
            {
                id: 'structureInfo',
                headline: 'Structure Info tab',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'The "Structure Info" tab provides a list of pertinent details sourced from the mmCIF file. This includes information such as the structure determination method, resolution, PDB deposition date, and literature reference.'
                    },
                ],
            },
            {
                id: 'downloads',
                headline: 'Downloads tab',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'The "Downloads" tab offers links for downloading essential data in various formats. Users can access the table of assigned NtCs in both CSV and JSON formats, along with an annotated mmCIF file that contains supplementary information regarding the NtC assigned steps.'
                    },
                ],
            },
        ],
    },
]

export const validation = [
    {
        headline: 'Validation page',
        subHeadlineText: `The "Validation" page offers a more comprehensive examination of the results compared to the "Annotation" page. It provides detailed information on the structure's quality, including assessments based on the confal score and RMSD scores, which measure the alignment of reference NtC classes with the actual dinucleotide step conformations. Additionally, this page evaluates valence geometry parameters, such as bond lengths and angles. The content is organised into distinct tabs for easy navigation.`,
        sections: [
            {
                id: 'confalsRMSD',
                headline: 'Confals & RMSDs tab',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: `The initial tab, "Confals & RMSDs," showcases a table listing dinucleotide steps, their assigned NtCs, CANA letters, confal scores (CS), and RMSD values. These values are colour-coded, transitioning from red (indicating the poorest match) to yellow and ultimately green (representing the best match) to facilitate an easy assessment of the structure's quality. The confal score quantifies the similarity in the 12-parameter space between the analysed step and the assigned NtC class reference, with values spanning from 0 (no match) to 100 (a perfect match). Concurrently, RMSD represents the root mean square deviation in cartesian space between the analysed step and the reference.`,
                    },
                    {
                        type: 'paragraph',
                        text: 'An overview section precedes the table, providing information about the count of assigned NtC conformers, the number of steps categorised according to their RMSD, and the average confal score for the entire structure.',
                    },
                ],
            },
            {
                id: 'stepTorsions',
                headline: 'Step torsions tab',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'In the following tab, "Step Torsions," users can access the specific NtC parameter values for a chosen step and compare them to reference values. This data is also visualised in the form of a plot, where the NtC parameter values are represented by yellow crosses overlaid on a set of violin plots. These violin plots provide an illustration of the distribution of parameters in the dataset of experimental structures and are a type of visualisation that was thoroughly described in a previous publication by Cerny et al. in Acta Cryst D 2020, 76, 805.'
                    },
                ],
            },
            {
                id: 'similarityPlot',
                headline: 'Similarity plot tab',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'The "Similarity Plot" tab displays an interactive scatter plot that illustrates the connection between the selected step and all 96 NtC class references. This comparison relies on their Cartesian RMSD and Euclidean distance. The points on the plot are colour-coded based on their RMSD value, using a "semaphore" colour scale. Points marked in green indicate NtC conformers with a favourable match to the selected step, while points highlighted in red, with an RMSD value surpassing 1.0 Å, are regarded as representing a poor match.',
                    },
                ],
            },
            {
                id: 'rsccRmsdPlot',
                headline: 'RSCC/RMSD plot tab',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: `The "RSCC/RMSD Plot" tab consists of two graphical plots that depict the relationship between the real-space correlation coefficient (RSCC) and RMSD values for all steps within the structure. The RMSD-RSCC plot depicts how well different parts of the model structure fit the experimental electron density map. The plots are shown separately for two categories of steps: one for steps with an assigned NtC conformer class and another for unassigned steps. They are superimposed on a contour plot that visualises the data for the entire structural dataset. This graph enables users to evaluate the local quality of the structure at the individual dinucleotide level. It provides insight into the goodness of fit in the electron density map (RSCC) and the structural deviation from a reference structure (RMSD). The plots are interactive, allowing users to click on a data point in the plot to select the corresponding dinucleotide step in the Mol* viewer, and vice versa.`
                    },
                ],
            },
            {
                id: 'bondLengthsAngles',
                headline: 'Bond Lengths & Angles tab',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: `The final tab on the Validation page, "Bond Lengths & Angles," shifts the focus from dinucleotide conformers to individual nucleotides and their respective bond lengths and angles. In this section, parameter values for the entire structure (or a selected chain) are compared to a meticulously curated set of structures, and the distribution of parameter values is analysed. The number of values (whether bond lengths or angles) falling within the 98th, 99.9th percentile, and outlier groups are colour-coded as green, yellow, and red, respectively, and displayed as horizontal multi-colored stripes. The overall statistics for the entire structure or chain selection are presented initially, followed by an expandable section that provides statistics for individual residues. Hovering over the "Lengths" or "Angles" (or "L" and "A" for individual residues) text reveals the statistics in the form of a summary table. Each residue can be further expanded to examine individual values and their associated probabilities for each bond length or angle parameter.`
                    },
                ],
            },
            {
                id: 'theCanaAlphabet',
                headline: 'CANA',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: `The CANA alphabet, short for Conformational Alphabet of Nucleic Acids, is a symbolic representation system devised for describing the structural diversity of nucleic acid molecules,  both RNA and DNA. It builds upon the classification scheme of NtC (diNucleotide Conformers), which categorizes dinucleotide fragments based on their structural properties. CANA groups the NtC categories into 15 three-letter codes to represent various structural motifs, ranging from typical A, B, and Z forms to more complex conformations observed in nucleic acid structures. This system allows for the intuitive understanding and graphical representation of key structural features, facilitating computer-based automated structure annotation`,
                    },
                ],
            }
        ]
    }
]

export const refinement = [
    {
        headline: 'Refinement page',
        subHeadlineText: 'The "Refinement" page is currently under development to assist users in refining their structures by leveraging NtC conformers. This section offers tools for adjusting the automatically assigned NtCs and enables users to visually inspect these modifications through similarity and connectivity plots. Users have the flexibility to create multiple sets of altered NtCs to be used to further refine the structure. The default set, labelled as "(Computed)," is not editable and contains NtCs that were automatically assigned by DNATCO.',
        sections: [
            {
                id: 'connectivityPlot',
                headline: 'Connectivity Plot tab',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'The "Connectivity Plot" tab features two connectivity plots. The connectivity plots are designed to illustrate how well-connected the structure would be if the components of the structure making up the previous, currently selected, and next steps were all replaced by reference NtCs.',
                    },
                    {
                        type: 'paragraph',
                        text: `To calculate connectivity with the previous step, DNATCO assesses the positions of the C5' and O3' atoms of the first residue in the currently selected step and compares them to the positions of the C5' and O3' atoms of the second residue in the previous step. The distances between these C5' and O3' atoms are represented in the connectivity plot. Similarly, connectivity to the next step is calculated, but it involves the distances between the C5'/O3' atoms of the second residue in the current step and the C5'/O3' atoms of the first residue in the next step. DNATCO computes connectivities between the currently selected NtC of the current step and all reference NtCs applied to the previous and next steps.`,
                    },
                ],
            },
            {
                id: 'restraints',
                headline: 'Restraints',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'The "REFMAC Restraints" tab presents a list of restraints that can be utilised with the REFMAC software. These restraints are generated from the currently selected set of NtCs.',
                    },
                    {
                        type: 'paragraph',
                        text: `Similarly, the "Phenix Restraints" tab offers a set of restraints suitable for use with the Phenix software. It's important to note that the restraints file generated by DNATCO is compatible with a modified version of Phenix.`,
                    },
                    {
                        type: 'paragraph',
                        text: `Additionally, the "MMB Commands File" tab provides a snippet of a commands file for the MacroMolecule Builder (MMB) software. Integrating this snippet into an MMB commands file instructs MMB to attempt to align the structure's geometry with the specified NtCs.`,
                    },
                ],
            },
            {
                id: 'changeNtCs',
                headline: 'Change NtCs',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'The "Change NtCs" tab serves as a utility for users to directly adjust the assigned NtCs. While the default set of NtC conformers assigned by DNATCO cannot be altered, users have the flexibility to create multiple custom NtC sets, which can be modified and reviewed using the plots in the other tabs. Additionally, restraints for these custom NtC sets can be downloaded for further usage.'
                    },
                ],
            }
        ],
    }
]

export const browse = [
    {
        headline: 'Browse page',
        subHeadlineText: 'This page is designed to provide users with comprehensive information about the 96 conformers that comprise the NtC classification scheme. It is organised into various tabs, each serving a specific purpose.',
        sections: [
            {
                id: 'browse',
                headline: 'Browse tab',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'The "Browse" tab offers a user-friendly interface for searching the PDB database for examples of NtC dinucleotide conformers. The resulting table presents NtC step names, assigned NtC class and CANA, Confal scores, RMSD, and structure resolution, along with information on the availability of an electron density map for the given structure. Clicking on the step name opens a new DNATCO analysis for the structure containing the specified step and highlights that step in the resulting visualisation.',
                    },
                ],
            },
            {
                id: 'tableOfConformers',
                headline: 'Table of Conformers tab',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'The "Table of Conformers" tab lists all 96 NtC conformers. For each conformer, it provides descriptions (annotations), frequencies of occurrence in DNA and RNA structures, and the parameter values of the class representative.',
                    },
                ],
            },
            {
                id: 'contourPlots',
                headline: 'Contour Plots tab',
                paragraphs: [
                    {
                        type: 'paragraph',
                        text: 'The "Contour Plots" tab enables users to examine the distribution of NtC steps within each conformer class in the RSCC/RMSD space. It serves the best as quick and easy to use quality control for validation and control of refinement procedure.',
                    },
                    {
                        type: 'paragraph',
                        text: 'Plot is presented separately for structures with resolutions better than 1.8 Å and those with resolutions worse than 2.5 Å. This examination provides valuable insights into the relationship between the quality of fit into electron density maps (measured as real-space correlation coefficient) and the quality of alignment between the actual dinucleotide atomic coordinates or torsion parameters and those of an NtC class reference structure.',
                    },
                    {
                        type: 'paragraph',
                        text: 'The scattergram is divided into four quadrants. The percentage from total number of selected dinucleotides is displayed in each respective quadrant. The bottom-right quadrant shows dinucleotides with good fit to the electron density (RSCC > 0.8) and good geometrical closeness to the reference set (RMSD < 1.0 Å). The bottom-left displays dinucleotide with known geometry but poor fit to the electron density (RSCC < 0.8). It is likely caused by over-refinement or by poor experimental data. The upper-right part shows unique dinucleotides with good fit to the electron density e.g. exotic architectures such as left-handed tetraplexes etc. Finally, the upper-left quadrant shows dinucleotides with both poor fit to the electron density and unknown geometry'
                    },
                ],
            },
        ]
    }
]