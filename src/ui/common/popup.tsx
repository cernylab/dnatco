import * as React from 'react';
import * as RDC from 'react-dom/client';

export class Popup extends React.Component<Popup.Props> {
    private selfRef = React.createRef<HTMLDivElement>();

    private dismiss() {
        document.body.removeChild(this.props.parentElement);
    }

    componentDidMount() {
        if (this.selfRef.current) {
            this.selfRef.current.addEventListener('keydown', (ev) => {
                if (ev.key === 'Escape' || ev.key === 'Enter')
                    this.dismiss();
            });
            this.selfRef.current.focus();
        }
    }

    render() {
        return (
            <div
                ref={this.selfRef}
                className='absolute top-0 left-0 h-full w-full z-[999] m-auto bg-test'
                tabIndex={0}
            >
                <div className='bg-primary-first flex flex-col mx-auto p-4 relative top-[45%] rounded-standart max-w-[33%] text-white'>
                    <div>
                        {this.props.children}
                    </div>
                    <button
                        onClick={() => this.dismiss()}
                        className='bg-secondary-second text-primary-first items-center flex justify-center px-4 py-1 cursor-pointer w-fit rounded-smaller hover:bg-secondary-second-hover transition-all'
                    >
                        Dismiss
                    </button>
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
