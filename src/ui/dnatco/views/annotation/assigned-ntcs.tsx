import type { StandardLonghandProperties } from 'csstype';
import React from 'react';
import { Annotation } from './common';
import { ChainSelect, ModelSelect } from '../structure-selectors';
import { View } from '../view';
import { InvalidChain, InvalidModelIndex, InvalidStepId } from '../../structure-selection';
import { DynamicTableDownloadBar } from '../../common';
import { valueToSemaphore } from '../../util';
import { SingleStepInfo } from '../../single-step-info';
import { DynamicTable } from '../../../common/dynamic-table';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { Tooltip } from '../../../common/tooltip';
import { Cif } from '../../../../cif';
import { clamp } from '../../../../util';
import {
    NdbStructNtcOverall, NdbStructNtcStep, NdbStructNtcStepSummary,
    NdbStructNtcStepParameters
} from '../../../../cif/categories/ndb-struct-ntc';
import { Dnatcofication, StepRmsdStats } from '../../../../dnatco/dnatcofication';
import { StepsMapper } from '../../../../dnatco/steps-mapper';
import { rgbToHex } from '../../../util';

const MarkerWidthRatio = 0.005;
const MarkerOverdrawRatio = 0.8; // How much smaller is the background gradient than the marker.
const BarHeightEm = 0.75;
const ScoreBarStyle = { width: '100%', height: `${BarHeightEm}em` };
const StyleTableSameColumnWidth = { tableLayout: 'fixed', width: '100%' } as StandardLonghandProperties;

// NO NO NO: This is just a very interim solution to check that we're correct
function percentile(confal: number) {
    // TODO: Better function
    const x = clamp(confal, 0.0, 100.0);
    const Coeffs = [
        -8.43983519489781E-13, 2.99903652081687E-10, -4.04702262570393E-08, 2.54732719424787E-06, -7.55126681196185E-05, 0.00111573721670155, -0.00220044745406717, 0.0259204823080706
    ];
    const N = Coeffs.length - 1;

    let y = 0;
    for (let idx = 0; idx < Coeffs.length; idx++)
        y += Coeffs[idx] * Math.pow(x, N - idx);

    return y * 100.0;
}

export class AssignedNtCs extends View<View.Props> {
    private tableModel: DynamicTable.Model = new DynamicTable.Model([]);
    private stepRatiosBarRef = React.createRef<HTMLCanvasElement>();
    private totalScoreBar = React.createRef<HTMLCanvasElement>();

    private drawStepRmdsStats(canvas: HTMLCanvasElement, stats: StepRmsdStats[]) {
        const ctx = canvas.getContext('2d');
        if (!ctx || stats.length < 3)
            return;

        const tw = canvas.width;
        const th = canvas.height;
        const green = stats[0].rmsdThreshold;
        const red = stats[stats.length - 2].rmsdThreshold;

        const total = stats.reduce((p, c) => p + c.count, 0);

        let fx = 0;
        for (let idx = 0; idx < stats.length; idx++) {
            const s = stats[idx];
            const thrPrev = stats[idx - 1]?.rmsdThreshold ?? 0;
            const v = s.rmsdThreshold === -1 ? red + 0.1 : thrPrev + (s.rmsdThreshold - thrPrev) / 2.0;

            const w = Math.round(tw * s.count / total);
            const rgb = valueToSemaphore(v, green ,red);

            ctx.fillStyle = rgbToHex(rgb);
            ctx.fillRect(fx, 0, w, th);
            if (w >= tw)
                return;

            fx += w;
        }
    }

    private drawTotalScoreBar(canvas: HTMLCanvasElement, totalScore: number) {
        let ctx = canvas.getContext('2d');
        if (!ctx)
            return;

        const tw = canvas.width;
        const th = canvas.height;

        ctx.clearRect(0, 0, tw, th);

        const gh = Math.round(0.8 * th);
        const grad = ctx.createLinearGradient(0, 0, tw, 0);
        grad.addColorStop(0.0, 'rgba(255,   0,   0, 1.0)');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 1.0)');
        grad.addColorStop(1.0, 'rgba(0,     0, 255, 1.0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, (th - gh) / 2.0, tw, gh);

        const mx = tw * totalScore / 100.0;
        const mwx = Math.round(MarkerWidthRatio * tw);
        const fx = Math.round(mx - MarkerWidthRatio / 2.0);

        /* Firefox refuses to change fillStyle from CanvasGradient to rgba color
         * specified by rgba() string. Encode the color differently. */
        ctx.fillStyle = '#000000';
        ctx.fillRect(fx, 0, mwx, th);
    }

    private drawBars() {
        const modelIdx = this.props.structureSelection.modelIndex;

        const stepsBarRef = this.stepRatiosBarRef.current;
        if (stepsBarRef)
            this.drawStepRmdsStats(stepsBarRef, this.props.dnatcofication.data.stepRmsdStats[modelIdx]);

        const tsBarRef = this.totalScoreBar.current;
        if (tsBarRef)
            this.drawTotalScoreBar(tsBarRef, this.props.dnatcofication.data.averageConfals[modelIdx]);
    }

    private makeTableModel(selectedModelNum: number, selectedChain?: string) {
        const steps = this.props.dnatcofication.table(NdbStructNtcStep);
        const summary = this.props.dnatcofication.table(NdbStructNtcStepSummary);
        const params = this.props.dnatcofication.table(NdbStructNtcStepParameters);

        const { PDB_model_number, label_asym_id_1, name } = steps;
        const { assigned_NtC, assigned_CANA, closest_NtC, closest_CANA } = summary;
        const {
            tor_delta_1, tor_epsilon_1, tor_zeta_1,
            tor_alpha_2, tor_beta_2, tor_gamma_2,
            tor_delta_2, tor_chi_1, tor_chi_2,
            tor_NCCN, dist_CC, dist_NN
        } = params;

        const chainColumn: DynamicTable.Column<string> = {
            name: 'Chain', cells: new Array<DynamicTable.Cell<string>>(), alignment: 'center',
            tooltip: <div>PDB chain ID (author)</div>,
        };
        const stepColumn: DynamicTable.Column<string> = {
            name: 'Step', cells: new Array<DynamicTable.Cell<string>>(), alignment: 'center',
            notSortable: true,
            tooltip: <div>Dinucleotide step identifier</div>,
        };
        const ntcColumn: DynamicTable.Column<string> = {
            name: 'NtC', cells: new Array<DynamicTable.Cell<string>>(), alignment: 'center',
            tooltip: <div>Di<span className='rdo-emphasize'>N</span>ucleotide <span className='rdo-emphasize'>C</span>onformational class</div>,
        };
        const canaColumn: DynamicTable.Column<string> = {
            name: 'CANA', cells: new Array<DynamicTable.Cell<string>>(), alignment: 'center',
            tooltip: <div><span className='rdo-emphasize'>C</span>onformational <span className='rdo-emphasize'>A</span>lphabet of <span className='rdo-emphasize'>N</span>ucleic <span className='rdo-emphasize'>A</span>cids</div>,
        };
        const torsionsColumn: DynamicTable.Column<string> = {
            name: '?', cells: new Array<DynamicTable.Cell<string>>(), alignment: 'center', notSortable: true, noData: true,
            tooltip: <div>Hover over the <span className='rdo-emphasize'>[?]</span> to get details about torsions and distances.</div>
        };

        for (let row = 0; row < steps._rowCount; row++) {
            const modelNum = Cif.Column.value(PDB_model_number, row)!;
            if (selectedModelNum !== -1 && selectedModelNum !== modelNum)
                continue;

            const chain = Cif.Column.value(label_asym_id_1, row)!;
            if (selectedChain && selectedChain !== chain)
                continue;

            const tag = Cif.Column.value(name, row)!;
            const NtC = Cif.Column.value(assigned_NtC, row)!;

            chainColumn.cells.push({ data: chain, tag });
            stepColumn.cells.push({ data: tag, tag });
            ntcColumn.cells.push({
                data: Cif.Column.value(assigned_NtC, row)!,
                elem: (() => {
                    const assigned = Cif.Column.value(assigned_NtC, row)!;
                    return assigned === 'NANT'
                        ?
                            <Tooltip
                                tag={<span className='rdo-unassigned-ntc'>{Cif.Column.value(closest_NtC, row)!}</span>}
                                delayMsec={300}
                            >
                                This step is unassigned. Closest NtC is shown instead.
                            </Tooltip>
                        : <span>{assigned}</span>;
                })(),
                tag
            });
            canaColumn.cells.push({
                data: Cif.Column.value(assigned_CANA, row)!,
                elem: (() => {
                    const assigned = Cif.Column.value(assigned_CANA, row)!;
                    return assigned === 'NAN'
                        ?
                            <Tooltip
                                tag={<span className='rdo-unassigned-ntc'>{Cif.Column.value(closest_CANA, row)!}</span>}
                                delayMsec={300}
                            >
                                This step is unassigned. Closest CANA is shown instead.
                            </Tooltip>
                        : <span>{assigned}</span>;
                })(),
                tag
            });
            torsionsColumn.cells.push({
                data: '',
                tag,
                tooltip:
                    <Tooltip
                        tag='[?]'
                        delayMsec={300}
                    >
                        <SingleStepInfo
                            NtC={NtC}
                            delta1={Cif.Column.value(tor_delta_1, row)!}
                            epsilon1={Cif.Column.value(tor_epsilon_1, row)!}
                            zeta1={Cif.Column.value(tor_zeta_1, row)!}
                            alpha2={Cif.Column.value(tor_alpha_2, row)!}
                            beta2={Cif.Column.value(tor_beta_2, row)!}
                            gamma2={Cif.Column.value(tor_gamma_2, row)!}
                            delta2={Cif.Column.value(tor_delta_2, row)!}
                            chi1={Cif.Column.value(tor_chi_1, row)!}
                            chi2={Cif.Column.value(tor_chi_2, row)!}
                            mu={Cif.Column.value(tor_NCCN, row)!}
                            CC={Cif.Column.value(dist_CC, row)!}
                            NN={Cif.Column.value(dist_NN, row)!}
                        />
                    </Tooltip>,
            });
        }

        return new DynamicTable.Model([chainColumn, stepColumn, ntcColumn, canaColumn, torsionsColumn]);
    }

    private renderAverageConfal(mdx: number) {
        const { name, avg } = mdx === InvalidModelIndex
            ? {
                name: this.props.dnatcofication.data.structures[0].models[0].num.toString(),
                avg: Math.round(this.props.dnatcofication.data.averageConfals[0]) }
            : {
                name: this.props.dnatcofication.data.structures[0].models[mdx].num.toString(),
                avg: Math.round(this.props.dnatcofication.data.averageConfals[mdx]) };

        if (Dnatcofication.Structure.numberOfModels(this.props.dnatcofication) === 1)
            return `${avg}`;
        else
            return `${avg} (model ${name})`;
    }

    private renderNucleicAcidChains() {
        if (this.props.structureSelection.modelIndex === InvalidModelIndex) {
            const list: JSX.Element[] = [];
            for (let idx = 0; idx < this.props.dnatcofication.data.structures[0].models.length; idx++) {
                const chains = Dnatcofication.Structure.nucleicAcidChains(this.props.dnatcofication, idx);

                list.push(
                    <div key={idx}>
                        {chains.length}
                        <div>({chains.join(', ')})</div>
                    </div>
                );
            }

            return list;
        } else {
            const chains = Dnatcofication.Structure.nucleicAcidChains(this.props.dnatcofication, this.props.structureSelection.modelIndex);

            return (
                <div>
                    {chains.length}
                    <div>({chains.join(', ')})</div>
                </div>
            );
        }
    }

    private renderStepRmsdStats(stats: { rmsdThreshold: number, count: number }[]) {
        if (stats.length < 2)
            return void 0;

        const green = stats[0].rmsdThreshold;
        const red = stats[stats.length - 2].rmsdThreshold;
        const headers = [<th className='rdo-data-table-small'>RMSD {'\u212B'}</th>];
        let idx = 0;
        for (;idx < stats.length - 1; idx++) {
            const s = stats[idx];
            const thrPrev = stats[idx - 1]?.rmsdThreshold ?? 0;
            const v = s.rmsdThreshold === -1 ? red + 0.1 : thrPrev + (s.rmsdThreshold - thrPrev) / 2.0;
            headers.push(
                <th
                    className='rdo-data-table-small'
                    style={{ color: rgbToHex(valueToSemaphore(v, green, red)) }}
                >
                    {`< ${s.rmsdThreshold.toFixed(1)}`}
                </th>
            );
        }
        headers.push(<th className='rdo-data-table-small' style={{ color: rgbToHex({ r: 255, g: 0, b: 0}) }}>{`> ${stats[stats.length - 2].rmsdThreshold.toFixed(1)}`}</th>);

        const nums = [
            <td className='rdo-numeric-table-small'></td>,
            ...stats.map(x => <td className='rdo-numeric-table-small'>{x.count}</td>)
        ];

        return (
            <table className='rdo-data-table-small' style={ StyleTableSameColumnWidth }>
                <thead>
                    <tr>{headers}</tr>
                </thead>
                <tbody>
                    <tr>{nums}</tr>
                </tbody>
            </table>
        );
    }

    private renderStepsTable() {
        const modelNum = this.props.structureSelection.modelIndex !== InvalidModelIndex
            ? this.props.dnatcofication.data.structures[0].models[this.props.structureSelection.modelIndex].num
            : InvalidModelIndex;
        this.tableModel = this.makeTableModel(modelNum, this.props.structureSelection.chain === InvalidChain ? void 0 : this.props.structureSelection.chain);
        const stepName = this.props.structureSelection.stepId === InvalidStepId ? '' : StepsMapper.byId(this.props.dnatcofication, this.props.structureSelection.stepId).name;

        return (
            <div>
                <DynamicTableDownloadBar
                    filenameCsv={`${this.props.dnatcofication.identifyingName}_assigned_ntcs.csv`}
                    filenameJson={`${this.props.dnatcofication.identifyingName}_assigned_ntcs.json`}
                    model={this.tableModel}
                />

                <DynamicTable
                    model={this.tableModel}
                    onCellClicked={(row, col, item) => {
                        if (col === 'Step') {
                            const stepId = StepsMapper.byName(this.props.dnatcofication, item)?.id ?? InvalidStepId;
                            if (stepId !== InvalidStepId)
                                this.props.switching.switchStepId(stepId);
                        }
                    }}
                    highlightedTag={stepName}
                    scrollTainer={this.props.scrollableParent}
                    style='wide'
                />
            </div>
        );
    }

    componentDidMount() {
        this.drawBars();
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        const overall = this.props.dnatcofication.table(NdbStructNtcOverall);
        const numModels = Dnatcofication.Structure.numberOfModels(this.props.dnatcofication);
        const modelIdx = this.props.structureSelection.modelIndex === InvalidModelIndex ? 0 : this.props.structureSelection.modelIndex;

        return (
            <div>
                <NamedList>
                {
                    numModels > 1
                        ? <NamedListItem name='Models'>
                            {Dnatcofication.Structure.numberOfModels(this.props.dnatcofication)}
                        </NamedListItem>
                        : undefined
                }
                    <NamedListItem name='NA chains'>
                        {this.renderNucleicAcidChains()}
                    </NamedListItem>
                    <NamedListItem
                        name='Analyzed steps'
                        tooltip={
                            <ul className='rdo-list'>
                                <li>Average confal is a geometric mean of confals of all steps in the model.</li>
                            </ul>
                        }
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--v-gap)' }}>
                            <table className='rdo-data-table-small' style={ StyleTableSameColumnWidth }>
                                <thead>
                                    <tr>
                                        <th className='rdo-data-table-small'>
                                            Assigned
                                        </th>
                                        <th className='rdo-data-table-small'>
                                            Close
                                        </th>
                                        <th className='rdo-data-table-small'>
                                            Unassigned
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className='rdo-numeric-table-small'>
                                            {Cif.Column.value(overall.num_classified, 0)}
                                        </td>
                                        <td className='rdo-numeric-table-small'>
                                            {Cif.Column.value(overall.num_unclassified_rmsd_close, 0)}
                                        </td>
                                        <td className='rdo-numeric-table-small'>
                                            {Cif.Column.value(overall.num_unclassified, 0)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {this.renderStepRmsdStats(this.props.dnatcofication.data.stepRmsdStats[modelIdx])}
                            <canvas width={300} height={1} style={ ScoreBarStyle } ref={this.stepRatiosBarRef} />

                            <div style={{ display: 'flex', gap: 'var(--h-gap)' }}>
                                <div>
                                    <span className='rdo-named-list-name'>Avg. confal: </span>{this.renderAverageConfal(modelIdx)}
                                </div>
                                <div>
                                    <span className='rdo-named-list-name'>Percentile: </span>{percentile(this.props.dnatcofication.data.averageConfals[modelIdx]).toFixed(0)}
                                </div>
                            </div>
                            <canvas width={300} height={30} style={{ ...ScoreBarStyle, height: `${BarHeightEm / MarkerOverdrawRatio}em` }} ref={this.totalScoreBar} />
                        </div>
                    </NamedListItem>
                {
                    numModels > 1
                        ? <NamedListItem name='Model'>
                                <ModelSelect
                                    dnatcofication={this.props.dnatcofication}
                                    structureSelection={this.props.structureSelection}
                                    onChange={this.props.switching.switchModel}
                                />
                            </NamedListItem>
                        : undefined
                }
                    <NamedListItem name='Chain'>
                        <ChainSelect
                            dnatcofication={this.props.dnatcofication}
                            structureSelection={this.props.structureSelection}
                            onChange={this.props.switching.switchChain}
                        />
                    </NamedListItem>
                </NamedList>
                <div className='rdo-line-spacer' />
                {this.renderStepsTable()}
            </div>
        );
    }
}

export namespace AssignedNtCs {
    export const StepSwitcher = Annotation.switchStep;
}
