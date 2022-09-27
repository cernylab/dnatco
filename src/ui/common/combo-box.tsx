import * as React from 'react';
import { GlobalConfig } from '../../global-config';
import '../../../assets/imgs/down_arrow.svg';


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
            <div className={this.containerClass()}>
                <select
                    className='rdo-combobox'
                    value={this.props.value}
                    onChange={e => this.props.onChange(e.currentTarget.value)}
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
    }
}
