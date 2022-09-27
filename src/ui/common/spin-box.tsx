import * as React from 'react';
import { GlobalConfig } from '../../global-config';
import '../../../assets/imgs/triangle-up.svg';
import '../../../assets/imgs/triangle-down.svg';

function defaultFormatter(v: number|null) {
    if (v === null)
        return '';
    return v.toString();
}

export class SpinBox extends React.Component<SpinBox.Props> {
    static defaultProps = {
        disabled: false,
    };

    private clsDisabled() {
        return this.props.classNameDisabled ?? 'rdo-spinbox-input-disabled';
    }

    private clsEnabled() {
        return this.props.className ?? 'rdo-spinbox-input';
    }

    private decrease() {
        if (this.props.value === null)
            return;
        const nv = this.props.value - this.props.step;
        if (nv >= this.props.min)
            this.props.onChange(nv);
    }

    private increase() {
        if (this.props.value === null)
            return;
        const nv = this.props.value + this.props.step;
        if (nv >= this.props.min)
            this.props.onChange(nv);
    }

    render() {
        const pathPrefix = GlobalConfig.data().pathPrefix;

        return (
            <div className='rdo-spinbox-container'>
                <input
                    type='text'
                    className={this.props.disabled ? this.clsDisabled() : this.clsEnabled()}
                    value={this.props.formatter ? this.props.formatter(this.props.value) : defaultFormatter(this.props.value)}
                    onChange={evt => {
                        const num = parseFloat(evt.currentTarget.value);
                        if (!isNaN(num))
                            this.props.onChange(num);
                    }}
                    onWheel={evt => {
                        if (this.props.value === null)
                            return;
                        if (evt.deltaY < 0) {
                            const nv = this.props.value + this.props.step;
                            if (nv <= this.props.max)
                                this.props.onChange(nv);
                        } else if (evt.deltaY > 0) {
                            const nv = this.props.value - this.props.step;
                            if (nv >= this.props.min)
                                this.props.onChange(nv);
                        }
                    }}
                />
                <div className='rdo-spinbox-buttons'>
                    <img
                        className='rdo-spinbox-button'
                        src={`${pathPrefix}/imgs/triangle-up.svg`} onClick={() => this.increase()}
                    />
                    <img
                        className='rdo-spinbox-button'
                        src={`${pathPrefix}/imgs/triangle-down.svg`} onClick={() => this.decrease()}
                    />
                </div>
            </div>
        );
    }
}

export namespace SpinBox {
    export interface Props {
        value: number|null;
        onChange: (v: number) => void;
        min: number;
        max: number;
        step: number;
        disabled: boolean;
        className?: string;
        classNameDisabled?: string;
        formatter?: (v: number|null) => string;
    }
}
