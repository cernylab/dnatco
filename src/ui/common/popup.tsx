import * as React from 'react';
import * as RDC from 'react-dom/client';
import { PushButton } from './push-button';

export class Popup extends React.Component<Popup.Props> {
    private selfRef = React.createRef<HTMLDivElement>();

    private dismiss() {
        document.body.removeChild(this.props.parentElement);
    }

    componentDidMount() {
        if (this.selfRef.current) {
            this.selfRef.current.addEventListener('keydown', (ev) => {
                if (ev.key === 'Escape')
                    this.dismiss();
            });
            this.selfRef.current.focus();
        }
    }

    render() {
        return (
            <div
                ref={this.selfRef}
                className='rdo-popup'
                tabIndex={0}
            >
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

        const reactRoot = RDC.createRoot(tainer!);
        reactRoot.render(
            <Popup parentElement={tainer}>
                {children}
            </Popup>
        );
    }
}
