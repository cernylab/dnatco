import * as React from 'react';
import { Email } from './common/email';
import { IconButton } from './common/push-button';
import { Net } from '../util/net';

export class Footer extends React.Component {
    render() {
        return (
            <>
                <div className='rdo-footer-gutter' />
                <div className='rdo-footer'>
                    <div className='rdo-footer-content'>
                        <div style={{ color: 'var(--color-c)' }}>Supported by</div>
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
                        <div style={{ flex: 1 }} />
                        <div className='rdo-footer-text'>© 2022</div>
                        <Email email='jiri.cerny@ibt.cas.cz'><span style={{ color: 'var(--color-c)' }}>Jiří Černý</span></Email>
                        <Email email='lada.biedermannova@ibt.cas.cz'><span style={{ color: 'var(--color-c)' }}>Lada Biedermannová</span></Email>
                        <Email email='bohdan.schneider@ibt.cas.cz'><span style={{ color: 'var(--color-c)' }}>Bohdan Schneider</span></Email>
                    </div>
                </div>
            </>
        );
    }
}
