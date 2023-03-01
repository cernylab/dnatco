import type { StandardLonghandProperties } from 'csstype';
import React from 'react';
import { Validation } from './common';
import { ChainSelect, ModelSelect } from '../structure-selectors';
import { EmptyStructureSelection, InvalidChain, InvalidModelIndex, InvalidStepId, StructureSelection } from '../../structure-selection';
import { View } from '../view';
import { confalPercentile, niceStepName, Common } from '../../common';
import { SingleStepInfo } from '../../single-step-info';
import { Constants } from '../../constants';
import { valueToSemaphore, GappedSemaphore } from '../../util';
import { Icon } from '../../../common/icon';
import { rgbToHex } from '../../../util';
import { DynamicTable } from '../../../common/dynamic-table';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { Tooltip } from '../../../common/tooltip';
import { Cif } from '../../../../cif';
import {
    NdbStructNtcOverall, NdbStructNtcStep, NdbStructNtcStepSummary,
    NdbStructNtcStepParameters
} from '../../../../cif/categories/ndb-struct-ntc';
import { Dnatcofication, StepRmsdStats as DnatcoStepRmsdStats } from '../../../../dnatco/dnatcofication';
import { StepsMapper } from '../../../../dnatco/steps-mapper';
import { GlobalConfig } from '../../../../global-config';
import { doDownload, FileTypes } from '../../../../util/downloader';
import { Serialization } from '../../../../util/serialization';
import 'assets/imgs/info.svg';
import 'assets/imgs/info-inverse.svg';

const CellBgAlpha = 0.5;

function confalToColor(rmsd: number): React.CSSProperties {
    const clr = valueToSemaphore(rmsd, Constants.GreenConfal, Constants.GreenRMSD);
    return { backgroundColor: `rgba(${clr.r},${clr.g},${clr.b},${CellBgAlpha})` };
}

function rmsdToColor(rmsd: number): React.CSSProperties {
    const clr = valueToSemaphore(rmsd, Constants.GreenRMSD, Constants.RedRMSD);
    return { backgroundColor: `rgba(${clr.r},${clr.g},${clr.b},${CellBgAlpha})` };
}

const GSMapping = GappedSemaphore.makeMapping([
    { from: 0, to: 0.3 }, { from: 0.6, to: 1.0 },
]);

class ConfalPercentileStatsBar extends React.Component<{ percentile: number }> {
    private readonly MarkerWidthRatio = 0.005;
    private readonly MarkerOverdrawRatio = 0.8; // How much smaller is the background gradient than the marker.
    private barRef = React.createRef<HTMLCanvasElement>();

    private drawBar(canvas: HTMLCanvasElement, perc: number) {
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

        const mx = tw * perc / 100.0;
        const mwx = Math.round(this.MarkerWidthRatio * tw);
        const fx = Math.round(mx - this.MarkerWidthRatio / 2.0);

        /* Firefox refuses to change fillStyle from CanvasGradient to rgba color
         * specified by rgba() string. Encode the color differently. */
        ctx.fillStyle = '#000000';
        ctx.fillRect(fx, 0, mwx, th);
    }

    private tryDrawBar() {
        const ref = this.barRef.current;
        if (ref)
            this.drawBar(ref, this.props.percentile);
    }

    componentDidMount() {
        this.tryDrawBar();
    }

    componentDidUpdate() {
        this.tryDrawBar();
    }

    render() {
        return <canvas width={300} height={30} style={{ ...Common.StyleScoreBar, height: `${Common.BarHeightEm / this.MarkerOverdrawRatio}em` }} ref={this.barRef} />;
    }
}

class StepRmsdStatsBar extends React.Component<{ stats: DnatcoStepRmsdStats[] }> {
    private barRef = React.createRef<HTMLCanvasElement>();

    private drawBar(canvas: HTMLCanvasElement, stats: DnatcoStepRmsdStats[]) {
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
            const rgb = GappedSemaphore.toSemaphore(v, green, red, GSMapping);

            ctx.fillStyle = rgbToHex(rgb);
            ctx.fillRect(fx, 0, w, th);
            if (w >= tw)
                return;

            fx += w;
        }
    }

    private tryDrawBar() {
        const ref = this.barRef.current;
        if (ref)
            this.drawBar(ref, this.props.stats);
    }

    componentDidMount() {
        this.tryDrawBar();
    }

    componentDidUpdate() {
        this.tryDrawBar();
    }

    render() {
        const stats = this.props.stats;

        if (stats.length < 2)
            return void 0;

        return <canvas width={300} height={1} style={ Common.StyleScoreBar } ref={this.barRef} />;
    }
}

class Stats extends React.Component<{
    assigned: number,
    close: number,
    unassigned: number
    rmsdStats: DnatcoStepRmsdStats[]
    confalAverage: number,
    confalPercentile: number,
}>{
    private readonly ValuesCell = { display: 'flex', flexDirection: 'row', width: '100%' } as StandardLonghandProperties;
    private readonly Value = { flex: 1, textAlign: 'center' } as StandardLonghandProperties;
    render() {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 'var(--h-gap)', rowGap: 'calc(var(--v-gap) / 2)' }}>
                <div className='rdo-strong'>NtC</div>
                <div style={this.ValuesCell}>
                    <div style={this.Value}>{`Assigned:\u00A0${this.props.assigned}`}</div>
                    <div style={this.Value}>{`Close:\u00A0${this.props.close}`}</div>
                    <div style={this.Value}>{`Unassigned:\u00A0${this.props.unassigned}`}</div>
                </div>

                <div className='rdo-strong'>RMSD [{'\u212B'}]</div>
                <div style={this.ValuesCell}>
                    {this.props.rmsdStats.slice(0, this.props.rmsdStats.length - 1).map((s, idx, stats) => {
                        const green = stats[0].rmsdThreshold; // First
                        const red = stats[stats.length - 1].rmsdThreshold; // Last (mind that we sliced off the last element of the original array)
                        const tprev = stats[idx - 1]?.rmsdThreshold ?? 0;
                        const v = s.rmsdThreshold === -1 ? red + 0.1 : tprev + (s.rmsdThreshold - tprev) / 2.0;
                        const clr = GappedSemaphore.toSemaphore(v, green, red, GSMapping);

                        return (
                            <div
                                key={idx}
                                style={{
                                    color: rgbToHex(clr),
                                    ...this.Value
                                }}
                            >
                                {`<\u00A0${s.rmsdThreshold.toFixed(1)}:\u00A0${s.count}`}
                            </div>
                        );
                    })}
                    <div
                        style={{ color: rgbToHex({ r: 255, g: 0, b: 0}), ...this.Value }}
                    >
                        {`>\u00A0${this.props.rmsdStats[this.props.rmsdStats.length - 2].rmsdThreshold.toFixed(1)}:\u00A0${this.props.rmsdStats[this.props.rmsdStats.length - 1].count}`}
                    </div>
                </div>
                <div />
                <StepRmsdStatsBar stats={this.props.rmsdStats} />

                <div className='rdo-strong'>Confal score</div>
                <div style={this.ValuesCell}>
                    <div style={this.Value}>{`Average value:\u00A0${this.props.confalAverage.toFixed(0)}`}</div>
                    <div style={this.Value}>{`Percentile:\u00A0${this.props.confalPercentile.toFixed(0)}`}</div>
                </div>
                <div />
                <ConfalPercentileStatsBar percentile={this.props.confalPercentile} />
            </div>
        );
    }
}

export class ConfalsRmsds extends View<View.Props> {
    static readonly unscrollableContainer = true;
    private tableModel: DynamicTable.Model = new DynamicTable.Model([]);

    constructor(props: View.Props) {
        super(props);

        this.setTableModel(EmptyStructureSelection(props.dnatcofication));
    }

    private makeTableModel(selectedModelNum: number, selectedChain?: string) {
        const pathPrefix = GlobalConfig.data().pathPrefix;
        const steps = this.props.dnatcofication.table(NdbStructNtcStep);
        const summary = this.props.dnatcofication.table(NdbStructNtcStepSummary);
        const params = this.props.dnatcofication.table(NdbStructNtcStepParameters);

        const { PDB_model_number, label_asym_id_1, name } = steps;
        const {
            assigned_NtC, assigned_CANA, closest_NtC, closest_CANA,
            confal_score, cartesian_rmsd_closest_NtC_representative
        } = summary;
        const {
            tor_delta_1, tor_epsilon_1, tor_zeta_1,
            tor_alpha_2, tor_beta_2, tor_gamma_2,
            tor_delta_2, tor_chi_1, tor_chi_2,
            tor_NCCN, dist_CC, dist_NN
        } = params;

        const stepColumn: DynamicTable.Column<string> = {
            name: 'Step', cells: new Array<DynamicTable.Cell<string>>(), alignment: 'center', notSortable: true,
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
        const confalColumn: DynamicTable.Column<number> = {
            name: 'CS', cells: new Array<DynamicTable.Cell<number>>(), alignment: 'center', cellStyle: confalToColor,
            tooltip: <div>Confal Score: Score of similarity between the analyzed step and the assigned NtC class; values between 0 (no match) to 100 (perfect match)</div>,
        };
        const rmsdColumn: DynamicTable.Column<number> = {
            name: 'RMSD', cells: new Array<DynamicTable.Cell<number>>(), alignment: 'center', cellStyle: rmsdToColor,
            tooltip: <div>RMSD between the analyzed step and the closest NtC representative.</div>
        };
        const torsionsColumn: DynamicTable.Column<string> = {
            name: '?', cells: new Array<DynamicTable.Cell<string>>(), alignment: 'center', notSortable: true, noData: true,
            tooltip: <div>Hover over the <Icon img={`${pathPrefix}/imgs/info.svg`} size='text' /> to get details about torsions and distances.</div>,
            elem: <Icon img={`${pathPrefix}/imgs/info.svg`} size='text' />
        };

        for (let row = 0; row < steps._rowCount; row++) {
            const modelNum = Cif.Column.value(PDB_model_number, row);
            if (selectedModelNum !== -1 && selectedModelNum !== modelNum)
                continue;

            const chain = Cif.Column.value(label_asym_id_1, row)!;
            if (selectedChain !== undefined && selectedChain !== chain)
                continue;

            const tag = Cif.Column.value(name, row)!;
            const NtC = Cif.Column.value(assigned_NtC, row)!;
            const _step = StepsMapper.byName(this.props.dnatcofication, tag)!; // tag is the internal step name

            stepColumn.cells.push({
                data: tag,
                elem: niceStepName(_step, selectedModelNum === InvalidModelIndex),
                tag
            });
            ntcColumn.cells.push({
                data :Cif.Column.value(assigned_NtC, row)!,
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
                tag,
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
                tag,
            });
            confalColumn.cells.push({ data: Cif.Column.value(confal_score, row)!, tag });
            rmsdColumn.cells.push({
                data: Cif.Column.value(cartesian_rmsd_closest_NtC_representative, row)!,
                elem: <span>{Cif.Column.value(cartesian_rmsd_closest_NtC_representative, row)!.toFixed(3)}</span>,
                tag
            });
            torsionsColumn.cells.push({
                data: '',
                tag,
                tooltip:
                    <Tooltip
                        tag={
                            <Icon img={`${pathPrefix}/imgs/info-inverse.svg`} size='text' />
                        }
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

        return new DynamicTable.Model([stepColumn, ntcColumn, canaColumn, confalColumn, rmsdColumn, torsionsColumn]);
    }

    private renderStepsTable() {
        const stepName = this.props.structureSelection.stepId === InvalidStepId ? '' : StepsMapper.byId(this.props.dnatcofication, this.props.structureSelection.stepId).name;

        return (
            <DynamicTable
                model={this.tableModel}
                onCellClicked={(data, row, colName) => {
                    const cIdx = this.tableModel.columnNames.findIndex(cn => cn === 'Step');
                    if (cIdx === -1)
                        return;

                    const stepName = row[cIdx].data;
                    const stepId = StepsMapper.byName(this.props.dnatcofication, stepName)?.id ?? InvalidStepId;
                    if (stepId !== InvalidStepId)
                        this.props.switching.switchStepId(stepId);
                }}
                highlightedTag={stepName}
                scrollTainer={this.props.scrollableParent}
                style='wide'
                download={{
                    downloaders: [
                        {
                            caption: 'CSV',
                            download: function(fileNameStem, model) {
                                const text = Serialization.dynamicTable(model, 'csv');
                                doDownload(fileNameStem, text, this.fileType);
                            },
                            fileType: FileTypes.csv,
                        },
                        {
                            caption: 'JSON',
                            download: function(fileNameStem, model) {
                                const text = Serialization.dynamicTable(model, 'json');
                                doDownload(fileNameStem, text, this.fileType);
                            },
                            fileType: FileTypes.json,
                        },
                    ],
                    fileName: `${this.props.dnatcofication.identifyingName}_confals_rmsds`
                }}
            />
        );
    }

    private setTableModel(sel: StructureSelection) {
        const modelNum = sel.modelIndex !== InvalidModelIndex
            ? this.props.dnatcofication.data.structures[0].models[this.props.structureSelection.modelIndex].num
            : -1;
        this.tableModel = this.makeTableModel(modelNum, sel.chain === InvalidChain ? void 0 : sel.chain);
    }

    componentDidMount() {
        this.subscribe(this.props.dnatcofication.events.structureChanged, () => this.setTableModel(EmptyStructureSelection(this.props.dnatcofication)));
        this.subscribe(this.props.switching.events.modelSwitched, (sel) =>  this.setTableModel(sel));
        this.subscribe(this.props.switching.events.chainSwitched, (sel) =>  this.setTableModel(sel));
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        const overall = this.props.dnatcofication.table(NdbStructNtcOverall);
        const numModels = Dnatcofication.Structure.numberOfModels(this.props.dnatcofication);
        const modelIdx = this.props.structureSelection.modelIndex === InvalidModelIndex ? 0 : this.props.structureSelection.modelIndex;
        const confalAverage = this.props.dnatcofication.data.averageConfals[modelIdx];

        return (
            <div style={ Common.VScrollJail }>
                <div className='rdo-view-caption'>Overall structure quality</div>

                <Stats
                    assigned={Cif.Column.value(overall.num_classified, 0)!}
                    close={Cif.Column.value(overall.num_unclassified_rmsd_close, 0)!}
                    unassigned={Cif.Column.value(overall.num_unclassified, 0)!}
                    rmsdStats={this.props.dnatcofication.data.stepRmsdStats[modelIdx]}
                    confalAverage={confalAverage}
                    confalPercentile={confalPercentile(confalAverage)}
                />

                <div className='rdo-line-spacer' />
                <NamedList sizing='min-content' rowSpacing='half'>
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
                <div style={ Common.VScrollElement }>
                    <div className='rdo-scroll-vertically'>
                        {this.renderStepsTable()}
                    </div>
                </div>
            </div>
        );
    }
}

export namespace ConfalsRmsds {
    export const StepSwitcher = Validation.switchStep;
}
