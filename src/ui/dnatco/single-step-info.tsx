import * as React from 'react';
import { NamedList } from '../common/named-list';
import { NtC } from '../../dnatco/ntc';
import { ListOfConformers } from '../../dnatco/list-of-conformers';

function fmtFlt(f: number) { return f.toFixed(1); }

export class SingleStepInfo extends React.Component <SingleStepInfo.Props> {
    render() {
        const desc = ListOfConformers.stepByName(this.props.NtC)?.description ?? this.props.NtC;
        return (
            <div>
                <NamedList
                    items={[
                        { name: 'Conformer', value: desc },
                        { name: 'δ1', value: fmtFlt(this.props.delta1) },
                        { name: 'ε1', value: fmtFlt(this.props.epsilon1) },
                        { name: 'ζ1', value: fmtFlt(this.props.zeta1) },
                        { name: 'α2', value: fmtFlt(this.props.alpha2) },
                        { name: 'β2', value: fmtFlt(this.props.beta2) },
                        { name: 'γ2', value: fmtFlt(this.props.gamma2) },
                        { name: 'δ2', value: fmtFlt(this.props.delta2) },
                        { name: 'χ1', value: fmtFlt(this.props.chi1) },
                        { name: 'χ2', value: fmtFlt(this.props.chi2) },
                        { name: 'μ', value: fmtFlt(this.props.mu) },
                        { name: 'NN', value: fmtFlt(this.props.NN) },
                        { name: "C'C'", value: fmtFlt(this.props.CC) },
                    ]}
                />
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
