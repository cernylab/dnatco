import React from 'react';
import { View } from './view';
import { ViewerApi } from '../viewer-api';
import { Common as C } from '../common';
import { ComboBox } from '../../common/combo-box';
import { NamedList } from '../../common/named-list';
import { Tooltip } from '../../common/tooltip';
import { Cif } from '../../../cif';
import {
    NdbStructNtcStepParameters, NdbStructNtcStepParameters_Schema,
    NdbStructNtcStepSummary, NdbStructNtcStepSummary_Schema,
    NdbStructSugarStepParameters, NdbStructSugarStepParameters_Schema,
} from '../../../cif/categories/ndb-struct-ntc';
import { NtC } from  '../../../dnatco/ntc';
import { Dnatcofication } from '../../../dnatco/dnatcofication';
import { StepsMapper } from '../../../dnatco/steps-mapper';
import { sequence, toFixed } from '../../../util';

const TorsionsDisplayOrder: NtC.Torsion[] = ['delta1', 'epsilon1', 'zeta1', 'alpha2', 'beta2', 'gamma2', 'delta2', 'chi1', 'chi2'];
const TorsionsCaptions = {
    delta1: 'δ1',
    epsilon1: 'ε1',
    zeta1: 'ζ1',
    alpha2: 'α2',
    beta2: 'β2',
    gamma2: 'γ2',
    delta2: 'δ2',
    chi1: 'χ1',
    chi2: 'χ2',
    nccn: 'μ',
};

const DistancesDisplayOrder: NtC.Distance[] = ['nn', 'cc'];
const DistancesCaptions = {
    cc: 'CC',
    nn: 'NN',
};

function distanceColumn(table: Cif.Table<NdbStructNtcStepParameters_Schema>, dist: NtC.Distance) {
    switch (dist) {
    case 'cc': return table.dist_CC;
    case 'nn': return table.dist_NN
    }
}

function distanceConfalColumn(table: Cif.Table<NdbStructNtcStepParameters_Schema>, dist: NtC.Distance) {
    switch (dist) {
    case 'cc': return table.confal_dist_CC;
    case 'nn': return table.confal_dist_NN
    }
}

function distanceDiffColumn(table: Cif.Table<NdbStructNtcStepParameters_Schema>, dist: NtC.Distance) {
    switch (dist) {
    case 'cc': return table.diff_dist_CC;
    case 'nn': return table.diff_dist_NN
    }
}

function torsionColumn(table: Cif.Table<NdbStructNtcStepParameters_Schema>, torsion: NtC.Torsion) {
    switch (torsion) {
    case 'delta1':
        return table.tor_delta_1;
    case 'epsilon1':
        return table.tor_epsilon_1;
    case 'zeta1':
        return table.tor_zeta_1;
    case 'alpha2':
        return table.tor_alpha_2;
    case 'beta2':
        return table.tor_beta_2;
    case 'gamma2':
        return table.tor_gamma_2;
    case 'delta2':
        return table.tor_delta_2;
    case 'chi1':
        return table.tor_chi_1;
    case 'chi2':
        return table.tor_chi_2;
    case 'nccn':
        return table.tor_NCCN;
    }
}

function torsionConfalColumn(table: Cif.Table<NdbStructNtcStepParameters_Schema>, torsion: NtC.Torsion) {
    switch (torsion) {
    case 'delta1':
        return table.confal_tor_delta_1;
    case 'epsilon1':
        return table.confal_tor_epsilon_1;
    case 'zeta1':
        return table.confal_tor_zeta_1;
    case 'alpha2':
        return table.confal_tor_alpha_2;
    case 'beta2':
        return table.confal_tor_beta_2;
    case 'gamma2':
        return table.confal_tor_gamma_2;
    case 'delta2':
        return table.confal_tor_delta_2;
    case 'chi1':
        return table.confal_tor_chi_1;
    case 'chi2':
        return table.confal_tor_chi_2;
    case 'nccn':
        return table.confal_tor_NCCN;
    }
}

function torsionDiffColumn(table: Cif.Table<NdbStructNtcStepParameters_Schema>, torsion: NtC.Torsion) {
    switch (torsion) {
    case 'delta1':
        return table.diff_tor_delta_1;
    case 'epsilon1':
        return table.diff_tor_epsilon_1;
    case 'zeta1':
        return table.diff_tor_zeta_1;
    case 'alpha2':
        return table.diff_tor_alpha_2;
    case 'beta2':
        return table.diff_tor_beta_2;
    case 'gamma2':
        return table.diff_tor_gamma_2;
    case 'delta2':
        return table.diff_tor_delta_2;
    case 'chi1':
        return table.diff_tor_chi_1;
    case 'chi2':
        return table.diff_tor_chi_2;
    case 'nccn':
        return table.diff_tor_NCCN;
    }
}

type DistanceInfo = {
    actual: Record<NtC.Distance, number>,
    confal: Record<NtC.Distance, number>,
    diff: Record<NtC.Distance, number>,
    reference: Record<NtC.Distance, number>,
}
function DistanceInfo(): DistanceInfo {
    return {
        actual: { cc: NaN, nn: NaN },
        confal: { cc: NaN, nn: NaN },
        diff: { cc: NaN, nn: NaN },
        reference: { cc: NaN, nn: NaN },
    };
}

const StepInfo = {
    cartesianRmsd: 0,
    conformer: C.NA,
    p1: 0,
    tau1: 0,
    pn1: C.NA,
    p2: 0,
    tau2: 0,
    pn2: C.NA,
    details: ''
};

type TorsionInfo = {
    actual: Record<NtC.Torsion, number>,
    confal: Record<NtC.Torsion, number>,
    diff: Record<NtC.Torsion, number>,
    reference: Record<NtC.Torsion, number>,
}
function TorsionInfo(): TorsionInfo {
    return {
        actual: { delta1: NaN, epsilon1: NaN, zeta1: NaN, alpha2: NaN, beta2: NaN, gamma2: NaN, delta2: NaN, chi1: NaN, chi2: NaN, nccn: NaN },
        confal: { delta1: NaN, epsilon1: NaN, zeta1: NaN, alpha2: NaN, beta2: NaN, gamma2: NaN, delta2: NaN, chi1: NaN, chi2: NaN, nccn: NaN },
        diff: { delta1: NaN, epsilon1: NaN, zeta1: NaN, alpha2: NaN, beta2: NaN, gamma2: NaN, delta2: NaN, chi1: NaN, chi2: NaN, nccn: NaN },
        reference: { delta1: NaN, epsilon1: NaN, zeta1: NaN, alpha2: NaN, beta2: NaN, gamma2: NaN, delta2: NaN, chi1: NaN, chi2: NaN, nccn: NaN },
    };
}

const TorsionNames = [
    { tag: 'd1', name: 'δ1' },
    { tag: 'e1', name: 'ɛ1' },
    { tag: 'z1', name: 'ζ1' },
    { tag: 'a2', name: '⍺2' },
    { tag: 'b2', name: 'β2' },
    { tag: 'g2', name: 'ɣ2' },
    { tag: 'd2', name: 'δ2' },
    { tag: 'ch1', name: 'χ1' },
    { tag: 'ch2', name: 'χ2' },
];
function mkViolationDetailsToolip(details: string|null) {
    if (details === null)
        return [];

    const elems: JSX.Element[] = [];
    const items = details.split(';');

    let keyIdx = 0;
    for (const it of items) {
        if (it.startsWith('cNn')) {
            const tor = TorsionNames.find(x => x.tag.endsWith(it.substring(3)));
            if (tor)
                elems.push(<div key={keyIdx++}>{`${tor.name} exceeded tolerance against the average of all nearest neighbors`}</div>);
        } else if (it.startsWith('cAn')) {
            const tor = TorsionNames.find(x => x.tag.endsWith(it.substring(3)));
            if (tor)
                elems.push(<div key={keyIdx++}>{`${tor.name} exceeded tolerance against the nearest neighbor`}</div>);
        } else if (it === 'cNN')
            elems.push(<div key={keyIdx++}>NN distance exceeded tolerance</div>);
        else if (it === 'cCC')
            elems.push(<div key={keyIdx++}>CC distance exceeded tolerance</div>);
        else if (it === 'cmu')
            elems.push(<div key={keyIdx++}>μ pseudotorsion exceeded tolerance</div>);
        else if (it === 'cMB')
            elems.push(<div key={keyIdx++}>Sum of differences of first 7 torsions exceeded tolerance</div>);
        else if (it === 'cP')
            elems.push(<div key={keyIdx++}>Pseudorotation of the first ribose ring exceeded tolerance</div>);
        else if (it === 'cP1')
            elems.push(<div key={keyIdx++}>Pseudorotation of the second ribose ring exceeded tolerance</div>);
    }

    return elems;
}

function numOrNA(n: number, decimals = 2, padding = 7) {
    return isNaN(n) ? C.NA : toFixed(n, decimals, { char: '\u00A0', length: padding });
}

interface State {
    chain: string;
    model: string;
    stepId: number;
}
export class StepTorsions extends View<View.Props, State> {
    private stepParamsTable: Cif.Table<NdbStructNtcStepParameters_Schema>|null;
    private stepSumTable: Cif.Table<NdbStructNtcStepSummary_Schema>|null;
    private sugarStepParamsTable: Cif.Table<NdbStructSugarStepParameters_Schema>|null;

    constructor(props: View.Props) {
        super(props);

        this.state = {
            chain: '',
            model: '',
            stepId: -1,
        };

        this.stepParamsTable = props.dnatcofication.hasTable(NdbStructNtcStepParameters) ? props.dnatcofication.table(NdbStructNtcStepParameters) : null;
        this.stepSumTable = props.dnatcofication.hasTable(NdbStructNtcStepSummary) ? props.dnatcofication.table(NdbStructNtcStepSummary) : null;
        this.sugarStepParamsTable = props.dnatcofication.hasTable(NdbStructSugarStepParameters) ? props.dnatcofication.table(NdbStructSugarStepParameters) : null;
    }

    private distanceInfo(stepId: number) {
        if (!this.stepParamsTable)
            return DistanceInfo();

        const idx = this.stepParamsTable.step_id.values?.indexOf(stepId) ?? -1;
        if (idx === -1)
            return DistanceInfo();

        const info = DistanceInfo();
        for (const key in info.actual) {
            const dist = key as keyof DistanceInfo['actual'];
            info.actual[dist] = distanceColumn(this.stepParamsTable, dist).value(idx)!;
        }
        for (const key in info.diff) {
            const dist = key as keyof DistanceInfo['diff'];
            info.diff[dist] = distanceDiffColumn(this.stepParamsTable, dist).value(idx)!;
        }
        for (const key in info.reference) {
            const dist = key as keyof DistanceInfo['reference'];
            info.reference[dist] = info.actual[dist] - info.diff[dist];
        }
        for (const key in info.confal) {
            const dist = key as keyof DistanceInfo['confal'];
            info.confal[dist] = distanceConfalColumn(this.stepParamsTable, dist).value(idx)!;
        }

        return info;
    }

    private naChainOptions() {
        const opts = [{ caption: 'All', value: '' }];

        if (this.state.model === '')
            return opts;

        for (const ch of Dnatcofication.Structure.nucleicAcidChains(this.props.dnatcofication, parseInt(this.state.model)))
            opts.push({ caption: ch, value: ch });

        return opts;
    }

    private stepInfo(stepId: number) {
        if (!this.stepSumTable || !this.sugarStepParamsTable || !this.stepParamsTable)
            return StepInfo;

        const { assigned_NtC, cartesian_rmsd_closest_NtC_representative } = this.stepSumTable;
        let index = this.stepSumTable.step_id.values?.indexOf(stepId) ?? -1;
        if (index === -1)
            return StepInfo;

        const { P_1, tau_1, Pn_1, P_2, tau_2, Pn_2 } = this.sugarStepParamsTable;
        index = this.sugarStepParamsTable.step_id.values?.indexOf(stepId) ?? -1;
        if (index === -1)
            return StepInfo;

        const { details } = this.stepParamsTable;
        index = this.stepParamsTable?.step_id.values?.indexOf(stepId) ?? -1;
        if (index === -1)
            return StepInfo;


        return {
            cartesianRmsd: cartesian_rmsd_closest_NtC_representative.value(index),
            conformer: assigned_NtC.value(index)!,
            p1: P_1.value(index)!,
            tau1: tau_1.value(index)!,
            pn1: Pn_1.value(index)!,
            p2: P_2.value(index)!,
            tau2: tau_2.value(index)!,
            pn2: Pn_2.value(index)!,
            details: details.value(index)!,
        };
    }

    private stepsOptions() {
        const model = this.state.model !== '' ? parseInt(this.state.model) : void 0;
        const chain = this.state.chain !== '' ? this.state.chain : void 0;

        const opts: { caption: string, value: string }[] = [];
        for (const s of StepsMapper.segment(this.props.dnatcofication, model, chain))
            opts.push({ caption: s.name, value: s.id.toString() });

        return opts;
    }

    private torsionInfo(stepId: number) {
        if (!this.stepParamsTable)
            return TorsionInfo();

        const idx = this.stepParamsTable.step_id.values?.indexOf(stepId) ?? -1;
        if (idx === -1)
            return TorsionInfo();

        const info = TorsionInfo();
        for (const key in info.actual) {
            const tor = key as keyof TorsionInfo['actual'];
            info.actual[tor] = torsionColumn(this.stepParamsTable, tor).value(idx)!;
        }
        for (const key in info.diff) {
            const tor = key as keyof TorsionInfo['diff'];
            info.diff[tor] = torsionDiffColumn(this.stepParamsTable, tor).value(idx)!;
        }
        for (const key in info.reference) {
            const tor = key as keyof TorsionInfo['reference'];
            info.reference[tor] = info.actual[tor] - info.diff[tor];
        }
        for (const key in info.confal) {
            const tor = key as keyof TorsionInfo['confal'];
            info.confal[tor] = torsionConfalColumn(this.stepParamsTable, tor).value(idx)!;
        }

        return info;
    }

    componentDidMount() {
        this.subscribe(this.props.dnatcofication.events.structureChanged, () => {
            this.stepParamsTable = this.props.dnatcofication.hasTable(NdbStructNtcStepParameters) ? this.props.dnatcofication.table(NdbStructNtcStepParameters) : null;
            this.stepSumTable = this.props.dnatcofication.hasTable(NdbStructNtcStepSummary) ? this.props.dnatcofication.table(NdbStructNtcStepSummary) : null;
            this.sugarStepParamsTable = this.props.dnatcofication.hasTable(NdbStructSugarStepParameters) ? this.props.dnatcofication.table(NdbStructSugarStepParameters) : null;
        });

        const steps = this.stepsOptions();
        if (steps.length > 0)
            this.setState({ ...this.state, stepId: parseInt(steps[0].value) });
    }

    componentDidUpdate(_prevProps: View.Props, prevState: State) {
        if (this.state.model !== prevState.model) {
            const steps = this.stepsOptions();
            this.setState({ ...this.state, chain: '', stepId: parseInt(steps[0]?.value) ?? -1 });
        } else if (this.state.chain !== prevState.chain) {
            const steps = this.stepsOptions();
            this.setState({ ...this.state, stepId: parseInt(steps[0]?.value) ?? -1 });
        }
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        const torsionInfo = this.torsionInfo(this.state.stepId);
        const distanceInfo = this.distanceInfo(this.state.stepId);
        const stepInfo = this.stepInfo(this.state.stepId);

        return (
            <div>
                <NamedList
                    items={[
                        {
                            name: 'Model',
                            value:
                                <ComboBox
                                    value={this.state.model}
                                    options={[
                                        { caption: 'All', value: '' },
                                        ...sequence(1, Dnatcofication.Structure.numberOfModels(this.props.dnatcofication)).map(n => {
                                            const s = n.toString();
                                            return { caption: s, value: s };
                                        })
                                    ]}
                                    onChange={v => {
                                        this.props.viewerApi.command(ViewerApi.Commands.SwitchModel(parseInt(v)));
                                        this.setState({ ...this.state, model: v });
                                    }}
                                />
                        },
                        {
                            name: 'Chain',
                            value:
                                <ComboBox
                                    value={this.state.chain}
                                    options={this.naChainOptions()}
                                    onChange={v => this.setState({ ...this.state, chain: v })}
                                />
                        },
                        {
                            name: 'Step',
                            value:
                                <ComboBox
                                    value={this.state.stepId?.toString()}
                                    options={this.stepsOptions()}
                                    onChange={v => {
                                        const stepId = parseInt(v);
                                        const step = StepsMapper.byId(this.props.dnatcofication, stepId);
                                        const { previous, next } = StepsMapper.previousNextById(this.props.dnatcofication, stepId);
                                        const prevStepName = previous === -1 ? null : StepsMapper.byId(this.props.dnatcofication, previous).name;
                                        const nextStepName = next === -1 ? null : StepsMapper.byId(this.props.dnatcofication, next).name;

                                        this.props.viewerApi.command(ViewerApi.Commands.SelectStep(step.name, prevStepName, nextStepName));
                                        this.setState({ ...this.state, stepId });
                                    }}
                                />
                        },
                    ]}
                />
                <div className='rdo-line-spacer' />
                Torsions and distances
                <table className='rdo-data-table'>
                    <thead>
                        <tr>
                            <th className='rdo-data-table'></th>
                            <th className='rdo-data-table'>Actual</th>
                            <th className='rdo-data-table'>{`Reference ${stepInfo.conformer}`}</th>
                            <th className='rdo-data-table'>Δ actual vs. ref.</th>
                            <th className='rdo-data-table'>Confal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {TorsionsDisplayOrder.map((tor, idx) => (
                            <tr key={idx} className='rdo-data-table'>
                                <td className='rdo-numeric-table'>{TorsionsCaptions[tor]}</td>
                                <td className='rdo-numeric-table'>{numOrNA(torsionInfo.actual[tor])}</td>
                                <td className='rdo-numeric-table'>{numOrNA(torsionInfo.reference[tor])}</td>
                                <td className='rdo-numeric-table'>{numOrNA(torsionInfo.diff[tor])}</td>
                                <td className='rdo-numeric-table'>{numOrNA(torsionInfo.confal[tor], 0)}</td>
                            </tr>
                        ))}
                        {DistancesDisplayOrder.map((dist, idx) => (
                            <tr key={idx} className='rdo-data-table'>
                                <td className='rdo-numeric-table'>{DistancesCaptions[dist]}</td>
                                <td className='rdo-numeric-table'>{numOrNA(distanceInfo.actual[dist])}</td>
                                <td className='rdo-numeric-table'>{numOrNA(distanceInfo.reference[dist])}</td>
                                <td className='rdo-numeric-table'>{numOrNA(distanceInfo.diff[dist])}</td>
                                <td className='rdo-numeric-table'>{numOrNA(distanceInfo.confal[dist], 0)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className='rdo-line-spacer' />
                <NamedList
                    items={[
                        { name: 'Step conformer', value: stepInfo.conformer },
                        { name: 'Cartesian RMSD', value: `${stepInfo.cartesianRmsd!.toFixed(2)} Å` },
                        { name: 'Pseudorotation', value: `${stepInfo.p1}, ${stepInfo.tau1}, ${stepInfo.pn1} / ${stepInfo.p2}, ${stepInfo.tau2}, ${stepInfo.pn2}` },
                        {
                            name: 'Details',
                            value:
                                <Tooltip
                                    tag={stepInfo.details}
                                >
                                    {mkViolationDetailsToolip(stepInfo.details)}
                                </Tooltip>
                        },
                    ]}
                />
            </div>
        );
    }
}
