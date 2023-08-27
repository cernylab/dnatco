import * as React from 'react';
import { Email } from './common/email';
import { IconButton } from './common/push-button';
import { CasLogoImg, ElixirLogoImg, IbtLogoImg } from '../assets/images';
import { Net } from '../browser-util/net';
import { Globals } from '../globals';

const PadderStyle = { marginLeft: 'calc(var(--h-gap) / 2)', marginRight: 'calc(var(--h-gap) / 2)' };

export function Footer() {
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
                    {Globals.PrimaryContacts.map((c, idx) => (
                        <div style={PadderStyle} key={idx}>
                            <div className='rdo-footer-text'>
                                <Email email={c.email} subject='DNATCO'><span style={{ color: 'var(--color-c)' }}>{c.name}</span></Email>
                            </div>
                        </div>
                    ))}

                    <div />

                    <div style={PadderStyle}>
                        <div className='rdo-footer-text'>
                            <div style={{ color: 'var(--color-c)' }}>Supported by Institute of Biotechnology & Elixir CZ</div>
                        </div>
                    </div>

                    <IconButton
                        className='rdo-footer-icon-button'
                        iconClassName='rdo-footer-icon-button-image'
                        src={IbtLogoImg}
                        onClick={() => Net.openLink('https://www.ibt.cas.cz/en', true)}
                    />
                    <IconButton
                        className='rdo-footer-icon-button'
                        iconClassName='rdo-footer-icon-button-image'
                        src={ElixirLogoImg}
                        onClick={() => Net.openLink('https://www.elixir-czech.cz/', true)}
                    />
                    <IconButton
                        className='rdo-footer-icon-button'
                        iconClassName='rdo-footer-icon-button-image'
                        src={CasLogoImg}
                        onClick={() => Net.openLink('https://www.avcr.cz/en', true)}
                    />
                </div>
            </div>
        </>
    );
}
