import * as React from 'react';
import { Email } from './common/email';
import { IconButton } from './common/push-button';
import { Net } from '../util/net';
import 'assets/imgs/ibt.png';
import 'assets/imgs/elixir.png';
import 'assets/imgs/CAS_centred_logo_ENG_rgb.png';

const PadderStyle = { marginLeft: 'calc(var(--h-gap) / 2)', marginRight: 'calc(var(--h-gap) / 2)' };

export class Footer extends React.Component {
    render() {
        return (
            <>
                <div className='rdo-footer-gutter' />
                <div className='rdo-footer'>
                    <div
                        style={{
                            marginLeft: '2em',
                            marginRight: '2em',
                            display: 'grid',
                            gridTemplateColumns: 'auto auto auto 1fr auto 5em 5em 5em',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <div style={PadderStyle}>
                            <div className='rdo-footer-text'>© 2022</div>
                        </div>
                        <div style={PadderStyle}>
                            <Email email='jiri.cerny@ibt.cas.cz'><span style={{ color: 'var(--color-c)' }}>Jiří Černý</span></Email>
                        </div>
                        <div style={PadderStyle}>
                            <Email email='bohdan.schneider@ibt.cas.cz'><span style={{ color: 'var(--color-c)' }}>Bohdan Schneider</span></Email>
                        </div>

                        <div />

                        <div style={PadderStyle}>
                            <div style={{ color: 'var(--color-c)' }}>Supported by Institude of Biotechnology & Elixir CZ</div>
                        </div>

                        <IconButton
                            className='rdo-footer-icon-button'
                            iconClassName='rdo-footer-icon-button-image'
                            src='imgs/ibt.png'
                            onClick={() => Net.openLink('https://www.ibt.cas.cz/', true)}
                        />
                        <IconButton
                            className='rdo-footer-icon-button'
                            iconClassName='rdo-footer-icon-button-image'
                            src='imgs/elixir.png'
                            onClick={() => Net.openLink('https://www.elixir-czech.cz/', true)}
                        />
                        <IconButton
                            className='rdo-footer-icon-button'
                            iconClassName='rdo-footer-icon-button-image'
                            src='imgs/CAS_centred_logo_ENG_rgb.png'
                            onClick={() => Net.openLink('https://www.avcr.cz', true)}
                        />
                    </div>
                </div>
            </>
        );
    }
}
