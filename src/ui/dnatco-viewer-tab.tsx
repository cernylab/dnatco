import * as React from 'react';
import { ShadowedBox } from './common/shadowed-box';

export class DnatcoViewerTab extends React.Component<{ children?: React.ReactNode }> {
    render() {
        return (
            <div className='rdo-offset'>
                <ShadowedBox>
                    {this.props.children}
                </ShadowedBox>
            </div>
        );
    }
}
