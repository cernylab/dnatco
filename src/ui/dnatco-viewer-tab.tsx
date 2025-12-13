import * as React from 'react';
import { Subject } from 'rxjs';
import { MainScreen } from './dnatco/main-screen';
import { Dnatcofication } from '../dnatco/dnatcofication';
import { ViewerInterop } from '../viewer/viewer-interop';
import { BasePair } from '../dnatco/base-pairs-mapper';
import { Measurements } from '../dnatco/angles-lengths/measurements';

export type OutsideControl = {
    selectStep: Subject<string>,
    selectBasePair: Subject<BasePair>,
    selectResidue: Subject<{
        residue: Measurements.Residue,
        bond?: string,
        angle?: string,
    }>,
    openBondWindow: Subject<{
        residue: Measurements.Residue,
        bondSpec: string, // Format: atom1_atom2
    }>,
    openAngleWindow: Subject<{
        residue: Measurements.Residue,
        angleSpec: string, // Format: atom1_atom2_atom3
    }>,
}

export function DnatcoViewerTab(props: {
    dnatcofication: Dnatcofication,
    viewerInterop: ViewerInterop,
    outsideControl: OutsideControl,
}) {
    return (
        <div className='rdo-offset'>
            <MainScreen
                dnatcofication={props.dnatcofication}
                viewerInterop={props.viewerInterop}
                outsideControl={props.outsideControl}
            />
        </div>
    );
}
