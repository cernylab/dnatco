import * as React from 'react';
import { NamedList, NamedListItem } from '../common/named-list';
import { NtC } from '../../dnatco/ntc';
import { ListOfConformers } from '../../dnatco/list-of-conformers';
import { capitalize, objKeys } from '../../util';

function fmtFlt(f: number) { return f.toFixed(1); }

function maxNumLen(props: SingleStepInfo.Props) {
    let len = 0;
    const keys = objKeys(props, ['NtC']);
    for (const k of keys) {
        const s = fmtFlt(props[k as keyof SingleStepInfo.Props] as number);
        const _len = s.length;
        if (_len > len)
            len = _len;
    }

    return len;
}

function padFlt(f: number, len: number) {
    const s = fmtFlt(f);
    return <div className='rdo-monospace'>{s.padStart(len, '\u00A0')}</div>;
}

export class SingleStepInfo extends React.Component <SingleStepInfo.Props> {
    private numbersPadding = 0;

    constructor(props: SingleStepInfo.Props) {
        super(props);

        this.numbersPadding = maxNumLen(this.props);
    }

    componentDidUpdate() {
        this.numbersPadding = maxNumLen(this.props);
    }

    render() {
        const desc = ListOfConformers.stepByName(this.props.NtC)?.description ?? this.props.NtC;
        return (
            <div>
                <NamedList>
                    <NamedListItem name='Conformer'>{capitalize(desc)}</NamedListItem>
                    <NamedListItem name='δ1'>{padFlt(this.props.delta1, this.numbersPadding)}</NamedListItem>
                    <NamedListItem name='ε1'>{padFlt(this.props.epsilon1, this.numbersPadding)}</NamedListItem>
                    <NamedListItem name='ζ1'>{padFlt(this.props.zeta1, this.numbersPadding)}</NamedListItem>
                    <NamedListItem name='α2'>{padFlt(this.props.alpha2, this.numbersPadding)}</NamedListItem>
                    <NamedListItem name='β2'>{padFlt(this.props.beta2, this.numbersPadding)}</NamedListItem>
                    <NamedListItem name='γ2'>{padFlt(this.props.gamma2, this.numbersPadding)}</NamedListItem>
                    <NamedListItem name='δ2'>{padFlt(this.props.delta2, this.numbersPadding)}</NamedListItem>
                    <NamedListItem name='χ1'>{padFlt(this.props.chi1, this.numbersPadding)}</NamedListItem>
                    <NamedListItem name='χ2'>{padFlt(this.props.chi2, this.numbersPadding)}</NamedListItem>
                    <NamedListItem name='μ'>{padFlt(this.props.mu, this.numbersPadding)}</NamedListItem>
                    <NamedListItem name='NN'>{padFlt(this.props.NN, this.numbersPadding)}</NamedListItem>
                    <NamedListItem name='C'>{padFlt(this.props.CC, this.numbersPadding)}</NamedListItem>
                </NamedList>
            </div>
        );
    }
}

export namespace SingleStepInfo {
    export interface Props {
        NtC: NtC.Class;
        delta1: number;
        epsilon1: number;
        zeta1: number;
        alpha2: number;
        beta2: number;
        gamma2: number;
        delta2: number;
        chi1: number;
        chi2: number;
        mu: number;
        CC: number;
        NN: number;
    }
}
