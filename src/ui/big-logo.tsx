import * as React from 'react';
import { GlobalConfig } from '../global-config';
import { Version } from '../version';
import '../../assets/imgs/definition_new_trans2.png';

export class BigLogo extends React.Component {
    render() {
        return (
            <div className='rdo-big-logo-container'>
                <div
                    style={{
                        alignItems: 'center',
                        display: 'flex',
                        flex: 3,
                        flexDirection: 'column',
                        gap: '2em',
                        justifyContent: 'center',
                    }}
                >
                    <div className='rdo-text-uber' style={{ color: 'white' }}>ReDNATCO v{Version.tag()}</div>
                    <div className='rdo-text-mega' style={{ color: 'white' }}>Assignment of DNA and RNA conformers</div>
                </div>
                <span style={{ flex: 2, padding: '0.5em' }}>
                    <img
                        src={`${GlobalConfig.data().pathPrefix}imgs/definition_new_trans2.png`}
                        style={{
                            height: '100%',
                            objectFit: 'contain',
                            width: '100%',
                        }}
                    />
                </span>
            </div>
        );
    }
}
