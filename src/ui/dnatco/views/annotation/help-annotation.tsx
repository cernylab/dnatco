import * as React from 'react';
import { View } from '../view';

export class HelpAnnotation extends View {
        render() {
            return (
                <div>
                    <h2 className='font-din-2014 font-700 text-20px mb-2'>Annotation</h2>
                    <div className='font-din-2014 text-16px mb-2'>
                        The Annotation page provides users with a concise summary of the analysis results, based on the assignment of NtC classes. The page is organised into three tabs: "Assigned NtCs", "Structure Info", and "Downloads".
                    </div>
                    <h3 className='font-din-2014 font-700 text-18px mb-2'>Assigned NtCs tab</h3>
                    <div className='font-din-2014 text-16px mb-2'>
                        The "Assigned NtCs" tab is divided into three sections: a left sidebar with tabs, a central section featuring a table of results, and a right panel housing a Mol* viewer. The results table showcases all dinucleotide steps within the structure, along with their corresponding NtC class and CANA letter assignments. Hovering the mouse over the information button for each dinucleotide step grants users access to more detailed information about the 12 parameters defining the NtC conformation.
                        <br/>
                        The Mol* viewer on the right side of the tab offers a visual representation of the nucleic acid structure in cartoon mode, with NtC conformations represented by colour-coded phosphate-centred pyramids. Importantly, the Mol* viewer and the table are interconnected, meaning that selecting a step in the table will highlight the chosen step in the Mol* viewer (showing an overlaid reference structure in yellow), and vice versa. In the case of larger structures with multiple chains, like the ribosome, users can filter the results to display data for only one selected chain, and the Mol* viewer will accordingly present the selected chain exclusively.
                    </div>
                    <h3 className='font-din-2014 font-700 text-18px mb-2'>Structure Info tab</h3>
                    <div className='font-din-2014 text-16px mb-2'>
                        The "Structure Info" tab lists information available from the mmCIF file, such as structure determination method, resolution, PDB deposition date, and literature reference.
                    </div>
                    <h3 className='font-din-2014 font-700 text-18px mb-2'>Downloads tab</h3>
                    <div className='font-din-2014 text-16px mb-2'>
                        The "Downloads" tab provides links to download the table of assigned NtCs in CSV and JSON formats, as well as an annotated mmCIF file with additional information on the NtC assigned steps.
                    </div>
                </div>
            );
        }
    }

export namespace HelpAnnotation {
    export const StepSwitcher = () => {}
}