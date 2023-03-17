import * as React from 'react';
import { GlobalConfig } from '../global-config';
import { Version } from '../version';
import 'assets/imgs/definition_new_trans2.png';

export class BigLogo extends React.Component {
    render() {
        return (
            <div className='rdo-big-logo-container'>
                <img
                    src={`${GlobalConfig.data().pathPrefix}/imgs/definition_new_trans2.png`}
                    style={{
                        height: '7em',
                        margin: '0.5em',
                        objectFit: 'contain',
                    }}
                />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ color: 'white', fontSize: 'var(--font-xxlarge)' }}>{GlobalConfig.data().displayedProductName} v{Version.tag()}</div>
                    <div style={{ color: 'white', fontSize: 'var(--font-large)' }}>Analyze DNA/RNA structures</div>
                </div>
            </div>
        );
    }
}
