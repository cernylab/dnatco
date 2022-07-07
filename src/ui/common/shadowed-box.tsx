import * as React from 'react';

export class ShadowedBox extends React.Component<{ children?: React.ReactNode }> {
    render() {
        return (
            <div className='rdo-shadowed-box'>
                {this.props.children}
            </div>
        );
    }
}
