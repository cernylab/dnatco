import React from 'react';
import { View } from './view';
import { AssignedNtCs } from './assigned-ntcs';
import { ConfalsRmsds } from './confals-rmsds';
import { SimilarityPlots } from './similarity-plots';
import { StepTorsions } from './step-torsions';
import { StructureInfo } from './structure-info';

export namespace Register {
    export const Views = {
        'assigned-ntcs': (props: View.Props) => <AssignedNtCs {...props} />,
        'confals-rmsds': (props: View.Props) => <ConfalsRmsds {...props} />,
        'similarity-plots': (props: View.Props) => <SimilarityPlots {...props} />,
        'step-torsions': (props: View.Props) => <StepTorsions {...props} />,
        'structure-info': (props: View.Props) => <StructureInfo {...props} />,
    };
}
