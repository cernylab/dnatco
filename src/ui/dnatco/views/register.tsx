import React from 'react';
import { View } from './view';
import { AssignedNtCs } from './annotation/assigned-ntcs';
import { Downloads } from './annotation/downloads';
import { StructureInfo } from './annotation/structure-info';
import { MmbCommandsFile } from './refinement/mmb-commands-file';
import { PhenixRestraints } from './refinement/phenix-restraints';
import { RefmacRestraints } from './refinement/refmac-restraints';
import { ConfalsRmsds } from './validation/confals-rmsds';
import { ConnectivitySimilarityPlots } from './validation/connectivity-similarity-plots';
import { StepTorsions } from './validation/step-torsions';

export namespace Register {
    export const Views = {
        'assigned-ntcs': (props: View.Props) => <AssignedNtCs {...props} />,
        'confals-rmsds': (props: View.Props) => <ConfalsRmsds {...props} />,
        'connectivity-similarity-plots': (props: View.Props) => <ConnectivitySimilarityPlots {...props} />,
        'downloads': (props: View.Props) => <Downloads {...props} />,
        'mmb-commands-file': (props: View.Props) => <MmbCommandsFile {...props} />,
        'phenix-restraints': (props: View.Props) => <PhenixRestraints {...props} />,
        'refmac-restraints': (props: View.Props) => <RefmacRestraints {...props} />,
        'step-torsions': (props: View.Props) => <StepTorsions {...props} />,
        'structure-info': (props: View.Props) => <StructureInfo {...props} />,
    };
}
