import * as React from 'react';

export class CheckBox extends React.Component<CheckBox.Props> {
    render() {
        return (
            <div className='rdo-input-checkbox-tainer'>
                <input
                    className={`rdo-input-checkbox ${this.props.disabled ? 'rdo-input-checkbox-disabled' : ''}`}
                    type='checkbox'
                    checked={this.props.checked}
                    onChange={evt => {
                        if (!this.props.disabled)
                            this.props.onChanged(evt.currentTarget.checked);
                    }}
                />
                {this.props.caption ? <div>{this.props.caption}</div> : <></>}
            </div>
        );
    }
}

export namespace CheckBox {
    export interface Props {
        checked: boolean;
        onChanged: (checked: boolean) => void;
        caption?: string;
        disabled?: boolean;
    }
}
