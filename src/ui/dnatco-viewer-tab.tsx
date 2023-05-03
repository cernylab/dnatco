import * as React from 'react';
import { Subject } from 'rxjs';
import { ShadowedBox } from './common/shadowed-box';
import { MainScreen } from './dnatco/main-screen';
import { Dnatcofication } from '../dnatco/dnatcofication';
import { ViewerInterop } from '../viewer/viewer-interop';

export type OutsideControl = {
    selectStep: Subject<string>,
}

export function DnatcoViewerTab(props: {
    dnatcofication: Dnatcofication,
    viewerInterop: ViewerInterop,
    outsideControl: OutsideControl,
}) {
    return (
        <div className='rdo-offset'>
            <ShadowedBox>
                <MainScreen
                    dnatcofication={props.dnatcofication}
                    viewerInterop={props.viewerInterop}
                    outsideControl={props.outsideControl}
                />
            </ShadowedBox>
        </div>
    );
}
