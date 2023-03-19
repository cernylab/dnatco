import React from 'react';
import * as RDC from 'react-dom/client';
import { PushButton } from './push-button';

interface Props extends QuestionDialog.Props{
    parentElement: HTMLElement;
}
export class QuestionDialog extends React.Component<Props> {
    private dismiss() {
        document.body.removeChild(this.props.parentElement);
    }

    render() {
        return (
            <div className='rdo-popup'>
                <div className='rdo-popup-inner'>
                    <div className='rdo-named-list-name'>{this.props.caption}</div>
                    <div className='rdo-line-spacer' />

                    { typeof this.props.text === 'string'
                        ? <div>{this.props.text}</div>
                        : this.props.text
                    }

                    <div className='rdo-line-spacer' />
                    <div className='rdo-popup-button-bar'>
                        <div style={{ flex: 1 }} />
                        {
                            this.props.answers.map(x => {
                                return (
                                    <PushButton
                                        caption={x.text}
                                        onClick={() => {
                                            this.dismiss();
                                            this.props.onAnswered(x.code);
                                        }}
                                    />
                                )
                            })
                        }
                    </div>
                </div>
            </div>
        );
    }
}

export namespace QuestionDialog {
    export interface Props {
        caption: string,
        text: string|JSX.Element,
        answers: { text: string, code: number }[],
        onAnswered: (code: number) => void,
    }

    export function create(props: Props) {
        const tainer = document.createElement('div');
        document.body.appendChild(tainer);

        const reactRoot = RDC.createRoot(tainer!)
        reactRoot.render(
            <QuestionDialog {...props} parentElement={tainer} />
        );
    }
}
