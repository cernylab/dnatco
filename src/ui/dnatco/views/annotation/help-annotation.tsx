import * as React from 'react';
import { View } from '../view';

export class HelpAnnotation extends View {
        render() {
            return (
                <div>
                    <h2 className='font-din-2014 font-700 text-20px mb-2'>Annotation</h2>
                    <div className='font-din-2014 text-16px mb-2'>
                        The Annotation page provides users with a concise summary of the analysis results, based on the assignment of NtC classes. The page is organised into three tabs: Assigned NtCs, Structure Info, and Downloads.
                    </div>
                    <h3 className='font-din-2014 font-700 text-18px mb-2'>Assigned NtCs tab</h3>
                    <div className='font-din-2014 text-16px mb-2'>
                        cture and their assigned NtC class and CANA letter. By hovering the mouse over the info button for each dinucleotide step, users can access more detailed information on the 12 parameters defining NtC. The Mol* viewer on the right side of the tab provides a cartoon mode visualisation of the nucleic acid structure, with NtC conformations represented by colour-coded phosphate-centred pyramids. The Mol* viewer and the table are interconnected, so selecting a step in the table highlights the selected step in the Mol* viewer (showing an overlaid reference structure in yellow) and vice versa. For larger structures containing many chains, such as the ribosome, users can list results for only one selected chain, with the Mol* viewer displaying the selected chain only. 
                    </div>
                    <h3 className='font-din-2014 font-700 text-18px mb-2'>Structure Info tab</h3>
                    <div className='font-din-2014 text-16px mb-2'>
                        The Structure Info tab lists information available from the mmCIF file, such as structure determination method, resolution, PDB deposition date, and literature reference.
                    </div>
                    <h3 className='font-din-2014 font-700 text-18px mb-2'>Downloads tab</h3>
                    <div className='font-din-2014 text-16px mb-2'>
                        The Downloads tab provides links to download the table of assigned NtCs in CSV and JSON formats, as well as an annotated mmCIF file with additional information on the NtC assigned steps.
                    </div>
                </div>
            );
        }
    }

export namespace HelpAnnotation {
    export const StepSwitcher = () => {}
}