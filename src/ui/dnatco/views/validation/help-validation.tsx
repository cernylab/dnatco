import * as React from 'react';
import { View } from '../view';

export class HelpValidation extends View {
        render() {
            return (
                <div>
                    <h2 className='font-din-2014 font-700 text-20px mb-2'>Validation</h2>
                    <div className='font-din-2014 text-16px mb-2'>
                        The Validation page provides a more detailed view of the results than the Annotation page. Specifically, this view contains additional information on the structure quality as assessed by confal score and RMSD scores between reference NtC classes and actual dinucleotide step conformations, as well as assessment of valence geometry parameters (bond lengths and angles. The content is also organised into tabs.
                    </div>
                    <h3 className='font-din-2014 font-700 text-18px mb-2'>Confals & RMSDs tab</h3>
                    <div className='font-din-2014 text-16px mb-2'>
                        The first tab, Confals & RMSDs, displays a table of dinucleotide steps and their assigned NtCs and CANA letters, along with their confal score (CS) and RMSD value. These values are colour-coded from red (worst) to yellow to green (best) for easy assessment of structure quality. Confal score represents the similarity in the 12 parameter space between the analysed step and the assigned NtC class reference, with values ranging from 0 (no match) to 100 (perfect match), while RMSD represents the root mean square deviation in cartesian space between the analysed step and reference. An overview section precedes this table, providing information about the number of assigned NtC conformers, the number of steps according to their RMSD, and the average confal score for the whole structure.
                    </div>
                    <h3 className='font-din-2014 font-700 text-18px mb-2'>Step torsions tab</h3>
                    <div className='font-din-2014 text-16px mb-2'>
                        The next tab, Step torsions, presents actual NtC parameter values for a selected step and compares them to reference values. The data is also displayed as a plot, where the NtC parameter values are shown as a yellow crosses on top of a set of violin plots that depict the distribution of parameters in the dataset of experimental structures. This plot type was described in detail in a previous publication by Cerny et al in Acta D 2020.
                    </div>
                    <h3 className='font-din-2014 font-700 text-18px mb-2'>Similarity plot tab</h3>
                    <div className='font-din-2014 text-16px mb-2'>
                        The Similarity plot tab displays an interactive scatter plot that shows the correlation between the selected step and all 96 NtC class references in terms of their Cartesian RMSD and Euclidean distance. The points on the plot are colour-coded based on their RMSD value on a "semaphore" colour scale. Red points with RMSD value above 1.0 Å are considered to be of poor quality.
                    </div>
                    <h3 className='font-din-2014 font-700 text-18px mb-2'>RSCC plot tab</h3>
                    <div className='font-din-2014 text-16px mb-2'>
                        The RSCC plot tab contains two plots that show the correlation between the real-space correlation coefficient (RSCC) and RMSD values for all steps in the structure, separately for steps with an assigned NtC conformer class and for unassigned steps. These plots are overlaid on a contour plot that shows the data for the whole structure dataset. This graph allows users to assess the local structure quality at the level of individual dinucleotides, showing their goodness of fit in the electron density map (RSCC) and their structural deviation from a reference structure (RMSD). The plots are interactive, and clicking on a data point in the plot selects the corresponding dinucleotide step in the Mol* viewer, and vice versa.
                    </div>
                    <h3 className='font-din-2014 font-700 text-18px mb-2'>Bond Lengths & Angles</h3>
                    <div className='font-din-2014 text-16px mb-2'>
                        The last tab on the Validation page, Bond Lengths & Angles, focuses on individual nucleotides and their bond lengths and angles, rather than dinucleotide conformers. The parameter values for the structure (or a selected chain) are compared to a carefully curated set of structures' distribution of parameter values. The number of values (bond lengths or angles) belonging to the 80th, 95th, 99th, 99.9th percentile, and outlier groups are colour-coded blue, green, yellow, orange, and red, respectively, and shown as horizontal multi-colored stripes. The overall statistics for the whole structure/selection are presented, followed by an expandable section showing the statistics for individual residues. Hovering the mouse over the "Lengths" or "Angles" (or "L" and "A" for individual residues) text displays the statistics in the form of a summary table. Each residue can be expanded to inspect the individual values and probabilities for each bond length or angle parameter. Hovering the mouse over the colour stripe on the left opens a graph displaying the actual value of the parameter compared to the distribution in the dataset.
                    </div>
                </div>
            );
        }
    }

export namespace HelpValidation {
    export const StepSwitcher = () => {}
}