import React from 'react';
import * as RDC from 'react-dom/client';

interface State {
    value: string;
    error: string|undefined;
}
interface Props extends InputDialog.Props {
    parentElement: HTMLElement;
}
export class InputDialog extends React.Component<Props, State> {
    private textInputRef = React.createRef<HTMLInputElement>();

    constructor(props: Props) {
        super(props);

        this.state ={
            value: '',
            error: void 0,
        };
    }

    private dismiss() {
        document.body.removeChild(this.props.parentElement);
    }

    private accept() {
        if ((this.props.validator && (this.props.validator(this.state.value) === void 0)) || !this.props.validator) {
            this.dismiss();
            this.props.onAccepted(this.state.value);
        }
    }

    private reject() {
        this.dismiss();
    }

    componentDidMount() {
        this.props.parentElement.addEventListener('keydown', (ev) => {
            const key = ev.key;
            if (key === 'Enter')
                this.accept();
            else if (key === 'Escape')
                this.dismiss();
        });

        if (this.props.validator) {
            this.setState({ ...this.state, error: this.props.validator(this.state.value) });
        }

        if (this.textInputRef.current)
            this.textInputRef.current.focus();
    }

    render() {
        return (
            <div className='rdo-popup absolute top-0 left-0 bg-test w-screen h-screen'>
                <div className='rdo-popup-inner absolute top-[40%] left-[40%] bg-primary-first p-4 rounded-standard'>
                    <div className='rdo-named-list-name text-white mb-2'>{this.props.caption}</div>
                    {this.props.description && (<div className='text-white'>{this.props.description}</div>)}
                    <input
                        ref={this.textInputRef}
                        className='text-18px w-full bg-white rounded-smaller px-2 py-1'
                        type='text'
                        value={this.state.value}
                        onChange={ev => {
                            const value = ev.currentTarget.value;
                            const error = this.props.validator ? this.props.validator(value) : void 0;
                            this.setState({ ...this.state, value, error })
                        }}
                    />

                    {this.state.error ? <div className='text-secondary-third'>{this.state.error}</div> : void 0}

                    <div className='rdo-popup-button-bar flex mt-4'>
                        <button
                            className='bg-white items-center flex justify-center px-4 py-1 cursor-pointer rounded-standard hover:bg-secondary-second transition-all mr-2'
                            onClick={() => this.accept()}
                        >
                            OK
                        </button>
                        <button 
                            className='bg-white items-center flex justify-center px-4 py-1 cursor-pointer rounded-standard hover:bg-secondary-second transition-all mr-2'
                            onClick={() => this.reject()}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export namespace InputDialog {
    export interface Props {
        caption: string;
        description?: string;
        onAccepted: (v: string) => void;
        validator?: (v: string) => string|undefined;
    }

    export function create(props: Props) {
        const tainer = document.createElement('div');
        document.body.appendChild(tainer);

        const reactRoot = RDC.createRoot(tainer!)
        reactRoot.render(
            <InputDialog {...props} parentElement={tainer} />
        );
    }
}
