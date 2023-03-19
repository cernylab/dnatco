import { type StandardLonghandProperties } from 'csstype';
import * as React from 'react';
import { GlobalConfig } from '../../global-config';
import 'assets/imgs/down_arrow.svg';

const SizingPolicy = {
    'min-content': 'min-content',
    'maximum-available': '100%',
    'auto': 'auto',
};

export class ComboBox extends React.Component<ComboBox.Props> {
    static defaultProps = {
        disabled: false,
    };

    constructor(props: ComboBox.Props) {
        super(props);
    }

    private containerClass() {
        return this.props.disabled ? 'rdo-combobox-container rdo-combobox-container-disabled' : 'rdo-combobox-container';
    }

    render() {
        return (
            <div
                className={this.containerClass()}
                style={{ width: this.props.sizing ? SizingPolicy[this.props.sizing] : SizingPolicy['min-content'] }}
            >
                <select
                    className='rdo-combobox'
                    value={this.props.value}
                    onChange={e => this.props.onChange(e.currentTarget.value)}
                    style={this.props.innerStyle}
                    disabled={this.props.disabled}
                    onWheel={(ev) => {
                        const numOpts = this.props.options.length;
                        if (numOpts < 1 || this.props.disabled)
                            return;

                        const y = ev.deltaY;
                        const direction = y > 0 ? 'down' : y < 0 ? 'up' : 'none';

                        const idx = this.props.options.findIndex(x => x.value === this.props.value);
                        if (idx < 0)
                            return; // Should never happen

                        if (direction === 'down' && idx < numOpts - 1)
                            this.props.onChange(this.props.options[idx + 1].value);
                        else if (direction === 'up' && idx > 0)
                            this.props.onChange(this.props.options[idx - 1].value);
                    }}
                >
                    {this.props.options.map(o => {
                        return (
                            <option
                                key={o.value}
                                value={o.value}
                            >{o.caption}</option>
                        );
                    })}
                </select>
                <div className='rdo-combobox-arrow'>
                    <img src={`${GlobalConfig.data().pathPrefix}/imgs/down_arrow.svg`} />
                </div>
            </div>
        );
    }
}

export namespace ComboBox {
    export type Option = {
        value: string;
        caption: string;
    }

    export interface Props {
        disabled: boolean;
        options: Option[];
        onChange: (v: string) => void;
        value: string;
        sizing?: keyof typeof SizingPolicy;
        innerStyle?: StandardLonghandProperties;
    }
}
