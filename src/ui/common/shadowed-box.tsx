import * as React from 'react';

export class ShadowedBox extends React.Component {
    render() {
        return (
            <div className='rdo-shadowed-box'>
                {this.props.children}
            </div>
        );
    }
}
