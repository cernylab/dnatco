import React from 'react';
import { View } from './view';
import { AssignedNtCs } from './assigned-ntcs';
import { ConfalsRmsds } from './confals-rmsds';
import { ConnectivitySimilarityPlots } from './connectivity-similarity-plots';
import { Downloads } from './downloads';
import { RefmacRestraints } from './refinement/refmac-restraints';
import { StepTorsions } from './step-torsions';
import { StructureInfo } from './structure-info';

export namespace Register {
    export const Views = {
        'assigned-ntcs': (props: View.Props) => <AssignedNtCs {...props} />,
        'confals-rmsds': (props: View.Props) => <ConfalsRmsds {...props} />,
        'connectivity-similarity-plots': (props: View.Props) => <ConnectivitySimilarityPlots {...props} />,
        'downloads': (props: View.Props) => <Downloads {...props} />,
        'refmac-restraints': (props: View.Props) => <RefmacRestraints {...props} />,
        'step-torsions': (props: View.Props) => <StepTorsions {...props} />,
        'structure-info': (props: View.Props) => <StructureInfo {...props} />,
    };
}
