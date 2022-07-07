import * as React from 'react';
import * as RDC from 'react-dom/client';
import { PushButton } from './push-button';

export class Popup extends React.Component<Popup.Props> {
    private dismiss() {
        document.body.removeChild(this.props.parentElement);
    }

    render() {
        return (
            <div className='rdo-popup'>
                <div className='rdo-popup-inner'>
                    <div style={{ flex: 1 }}>
                        {this.props.children}
                    </div>
                    <div className='rdo-popup-button-bar'>
                        <div style={{ flex: 1 }} />
                        <PushButton
                            caption='Dismiss'
                            enabled={true}
                            onClick={() => this.dismiss()}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export namespace Popup {
    export interface Props {
        parentElement: HTMLElement;
        children?: React.ReactNode;
    }

    export function create(children: React.ReactNode) {
        const tainer = document.createElement('div');
        document.body.appendChild(tainer);

        const reactRoot = RDC.createRoot(tainer!)
        reactRoot.render(
            <Popup parentElement={tainer}>
                {children}
            </Popup>
        );
    }
}
