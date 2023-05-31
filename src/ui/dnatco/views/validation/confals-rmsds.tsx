import type { StandardLonghandProperties } from 'csstype';
import React from 'react';
import { Validation } from './common';
import { ChainSelect, ModelSelect } from '../structure-selectors';
import {
    EmptyStructureSelection,
    InvalidAtom, InvalidChain, InvalidModelIndex, InvalidResidue, InvalidStepId,
    StructureSelection
} from '../../structure-selection';
import { View } from '../view';
import { confalPercentile, niceStepName, Common } from '../../common';
import { Colors } from '../../colors';
import { Constants } from '../../constants';
import { SearchBox } from '../../search-box';
import { StatsBar } from '../../stats-bar';
import { SingleStepInfo } from '../../single-step-info';
import { setDynamicTableModelColumns } from '../../util';
import { valueToSemaphore, GappedSemaphore } from '../../util';
import { Icon } from '../../../common/icon';
import { rgbToHex } from '../../../util';
import { DynamicTable } from '../../../common/dynamic-table';
import { IconButton } from '../../../common/push-button';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { Tooltip } from '../../../common/tooltip';
import { Cif } from '../../../../cif';
import {
    NdbStructNtcOverall, NdbStructNtcStep, NdbStructNtcStepSummary,
    NdbStructNtcStepParameters
} from '../../../../cif/categories/ndb-struct-ntc';
import { Dnatcofication, StepRmsdStats as DnatcoStepRmsdStats } from '../../../../dnatco/dnatcofication';
import { Step } from '../../../../dnatco/step';
import { StepsMapper } from '../../../../dnatco/steps-mapper';
import { parseIntStrict } from '../../../../util';
import { doDownload, FileTypes } from '../../../../util/downloader';
import { Serialization } from '../../../../util/serialization';
import 'assets/imgs/info.svg';
import 'assets/imgs/magnifying-glass.svg';

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
    render() {
        return (
            <div
                style={{
                    alignItems: 'center',
                    background: 'linear-gradient(90deg, rgba(255,0,0,1) 0%, rgba(255,255,255,1) 50%, rgba(0,0,255,1) 100%)',
                        height: `${Common.BarHeightEm}em`,
                        position: 'relative',
                }}
            >
                <div style={{
                        backgroundColor: 'black',
                        left: `${this.props.percentile}%`,
                        height: '133%',
                        position: 'absolute',
                        width: '8px',
                        top: '-16%',
                    }}
                />
            </div>
        );
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
        const _stats = this.props.rmsdStats;
        const rmsdCounts = _stats.map(x => x.count);
        const rmsdGreen = _stats[0].rmsdThreshold;
        const rmsdRed = _stats[this.props.rmsdStats.length - 2]?.rmsdThreshold ?? (rmsdGreen * 2);
        const rmsdColors = _stats.map((x, idx) => {
            const thrPrev = _stats[idx - 1]?.rmsdThreshold ?? 0;
            const v = x.rmsdThreshold === -1 ? rmsdRed + 0.1 : thrPrev + (x.rmsdThreshold - thrPrev) / 2.0;
            const rgb = GappedSemaphore.toSemaphore(v, rmsdGreen, rmsdRed, GSMapping);

            return rgbToHex(rgb);
        });

        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 'var(--h-gap)', rowGap: 'calc(var(--v-gap) / 2)' }}>
                <div className='rdo-strong'>NtC</div>
                <div style={this.ValuesCell}>
                    <div style={this.Value}>{`Assigned:\u00A0${this.props.assigned}`}</div>
                    <div style={this.Value}>{`Close:\u00A0${this.props.close}`}</div>
                    <div style={this.Value}>{`Unassigned:\u00A0${this.props.unassigned}`}</div>
                </div>

                <div className='rdo-strong'>RMSD [{'\u00C5'}]</div>
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
                <div style={{ height: `${Common.BarHeightEm}em` }}>
                    <StatsBar counts={rmsdCounts} colors={rmsdColors} />
                </div>

                <div className='rdo-strong'>Overall CS</div>
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
    private tableTainer = React.createRef<HTMLDivElement>();
    private searchBoxOpen = false;

    private readonly Searching: SearchBox.Searching<Step> = {
        onRenderResult: (step) => <div>{step.chainAuth} - {niceStepName(step, this.props.structureSelection.modelIndex === InvalidModelIndex)}</div>,
        onSearch: (prompt) => {
            const toks = prompt.split(' ').slice(0, 2);
            const resNoAuth = parseIntStrict(toks.length === 2 ? toks[1] : toks[0]);
            const chainAuth = toks.length === 2 ? toks[0] : void 0;

            if (isNaN(resNoAuth))
                return [];

            const modelIndex = this.props.structureSelection.modelIndex;
            const modelNum = this.modelNumFromIndex(modelIndex);
            const chain = this.props.structureSelection.chain;
            const filterFunc = (step: Step) => {
                return (modelIndex === InvalidModelIndex || step.model === modelNum) && (chain === InvalidChain || chain === step.chain);
            }

            const results = [];
            for (const step of this.props.dnatcofication.data.steps.steps.filter(x => filterFunc(x))) {
                if (step.resNo1Auth === resNoAuth) {
                    if (chainAuth) {
                        if (chainAuth === step.chain)
                            results.push(step);
                    } else
                        results.push(step);
                }
            }

            return results;
        },
        onUseResult: (step) => {
            const sel = ConfalsRmsds.SelectionMaker(step.id, InvalidResidue, InvalidAtom, this.props.structureSelection.steps, this.props.structureSelection.residues, this.props.structureSelection.atoms, this.props.dnatcofication);
            this.props.switching.changeSelection(sel, ConfalsRmsds.SelectionDisplayer);
        }
    }

    private readonly SearchBoxProps: SearchBox.Props<Step> = {
        anchor: 'bottom-right',
        xOffset: 32,
        yOffset: 32,
        caption: 'Enter chain and residue no.',
        onClose: () => this.searchBoxOpen = false,
        searching: this.Searching,
    }

    constructor(props: View.Props) {
        super(props);

        this.setTableModel(EmptyStructureSelection(props.dnatcofication));
    }

    private makeTableModel(selectedModelNum: number, selectedChain?: string) {
        const steps = this.props.dnatcofication.table(NdbStructNtcStep);
        const summary = this.props.dnatcofication.table(NdbStructNtcStepSummary);
        const params = this.props.dnatcofication.table(NdbStructNtcStepParameters);

        const { PDB_model_number, label_asym_id_1, auth_asym_id_1, name } = steps;
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

        const chainColumn: DynamicTable.Column<string> = {
            name: 'Chain', cells: new Array<DynamicTable.Cell<string>>(), alignment: 'center',
            tooltip: <div>PDB chain ID (author)</div>,
        };
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
            tooltip: <div>Hover over the <Icon img='imgs/info.svg' size='text' /> to get details about torsions and distances.</div>,
            elem: <Icon img='imgs/info.svg' size='0.75em' />,
            cellStyle: () => ({ padding: '0' }),
            headerStyle: { padding: '0' }
        };

        const columns = [chainColumn, stepColumn, ntcColumn, canaColumn, confalColumn, rmsdColumn, torsionsColumn];

        for (let row = 0; row < steps._rowCount; row++) {
            const modelNum = Cif.Column.value(PDB_model_number, row);
            if (selectedModelNum !== -1 && selectedModelNum !== modelNum)
                continue;

            const chain = Cif.Column.value(label_asym_id_1, row)!;
            if (selectedChain !== undefined && selectedChain !== chain)
                continue;

            const tag = Cif.Column.value(name, row)!;
            const tags = [tag, tag, tag, tag, void 0, void 0, tag];
            const confalScore = Cif.Column.value(confal_score, row)!;
            const assignedNtC = Cif.Column.value(assigned_NtC, row)!;
            const assignedCANA = Cif.Column.value(assigned_CANA, row)!;
            const _step = StepsMapper.byName(this.props.dnatcofication, tag)!; // tag is the internal step name

            setDynamicTableModelColumns(
                this.tableModel,
                row,
                columns,
                tags,
                [
                    Cif.Column.value(auth_asym_id_1, row)!,
                    tag,
                    assignedNtC,
                    assignedCANA,
                    confalScore,
                    Cif.Column.value(cartesian_rmsd_closest_NtC_representative, row)!,
                    '',
                ],
                [
                    void 0,
                    () => niceStepName(_step, selectedModelNum === InvalidModelIndex),
                    () => (
                        assignedNtC === 'NANT'
                            ?
                                <Tooltip
                                    tag={<span className='rdo-unassigned-ntc'>{Cif.Column.value(closest_NtC, row)!}</span>}
                                    delayMsec={300}
                                >
                                    This step is unassigned. Closest NtC is shown instead.
                                </Tooltip>
                            : <span>{assignedNtC}</span>
                    ),
                    () => (
                        assignedCANA === 'NAN'
                            ?
                                <Tooltip
                                    tag={<span className='rdo-unassigned-ntc'>{Cif.Column.value(closest_CANA, row)!}</span>}
                                    delayMsec={300}
                                >
                                    This step is unassigned. Closest CANA is shown instead.
                                </Tooltip>
                            : <span>{assignedCANA}</span>
                    ),
                    () => <span>{confalScore.toFixed(0)}</span>,
                    () => <span>{Cif.Column.value(cartesian_rmsd_closest_NtC_representative, row)!.toFixed(3)}</span>,
                    () => (
                        <Tooltip
                            tag={
                                <Icon img='imgs/info.svg' size='0.75em' />
                            }
                            delayMsec={300}
                        >
                            <SingleStepInfo
                                NtC={assignedNtC}
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
                        </Tooltip>
                    )
                ]
            );
        }

        return new DynamicTable.Model(columns);
    }

    private modelNumFromIndex(modelIndex: number) {
        return modelIndex !== InvalidModelIndex
            ? this.props.dnatcofication.data.structures[0].models[modelIndex].num
            : InvalidModelIndex;
    }

    private renderStepsTable() {
        const stepName = this.props.structureSelection.steps.length === 0 ? '' : StepsMapper.byId(this.props.dnatcofication, this.props.structureSelection.steps[0]).name;

        return (
            <DynamicTable
                model={this.tableModel}
                onCellClicked={(data, row, colName) => {
                    const cIdx = this.tableModel.columnNames.findIndex(cn => cn === 'Step');
                    if (cIdx === -1)
                        return;

                    const stepName = row[cIdx].data;
                    const stepId = StepsMapper.byName(this.props.dnatcofication, stepName)?.id ?? InvalidStepId;
                    if (stepId !== InvalidStepId) {
                        const sel = ConfalsRmsds.SelectionMaker(stepId, InvalidResidue, InvalidAtom, this.props.structureSelection.steps, this.props.structureSelection.residues, this.props.structureSelection.atoms, this.props.dnatcofication);
                        this.props.switching.changeSelection(sel, ConfalsRmsds.SelectionDisplayer);
                    }
                }}
                highlightedTag={stepName}
                highlightColor={Colors.CurrentStep()}
                scrollTainer={this.tableTainer.current ?? void 0}
                style='wide'
                download={{
                    downloaders: [
                        {
                            caption: 'CSV',
                            download: function(fileNameStem, model, sorting) {
                                const text = Serialization.dynamicTable(model, 'csv', sorting);
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
        const modelNum = this.modelNumFromIndex(sel.modelIndex);
        this.tableModel = this.makeTableModel(modelNum, sel.chain === InvalidChain ? void 0 : sel.chain);
    }

    componentDidMount() {
        this.subscribe(this.props.dnatcofication.events.structureChanged, () => this.setTableModel(EmptyStructureSelection(this.props.dnatcofication)));
        this.subscribe(this.props.switching.events.modelSwitched, (sel) => {
            this.setTableModel(sel);
            this.forceUpdate();
        });
        this.subscribe(this.props.switching.events.chainSwitched, (sel) => {
            this.setTableModel(sel);
            this.forceUpdate();
        });
        this.subscribe(this.props.switching.events.selectionChanged, (sel) => {
            this.setTableModel(sel);
            this.forceUpdate();
        });
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        const overall = this.props.dnatcofication.table(NdbStructNtcOverall);
        const numModels = Dnatcofication.Structure.numberOfModels(this.props.dnatcofication);
        const modelIdx = this.props.structureSelection.modelIndex === InvalidModelIndex ? 0 : this.props.structureSelection.modelIndex;
        const confalAverage = this.props.dnatcofication.data.averageConfals[modelIdx];
        const selfRef = React.createRef<HTMLDivElement>();

        return (
            <div style={{ ...Common.VScrollJail, position: 'relative' }} ref={selfRef}>
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
                                    switching={this.props.switching}
                                />
                            </NamedListItem>
                        : undefined
                }
                    <NamedListItem name='Chain'>
                        <ChainSelect
                            dnatcofication={this.props.dnatcofication}
                            structureSelection={this.props.structureSelection}
                            switching={this.props.switching}
                        />
                    </NamedListItem>
                </NamedList>

                <div className='rdo-line-spacer' />
                <div style={ Common.VScrollElement } ref={this.tableTainer}>
                    <div className='rdo-scroll-vertically-with-scrollbar'>
                        {this.renderStepsTable()}
                    </div>
                </div>

                <div className='rdo-floating-search-icon-tainer' style={{ bottom: 'var(--x-gap)', right: 'var(--x-gap)' }}>
                    <IconButton
                        src='imgs/magnifying-glass.svg'
                        className='rdo-floating-search-icon rdo-pushbutton-border'
                        onClick={() => {
                            const tainer = selfRef.current;
                            if (!tainer || this.searchBoxOpen)
                                return;

                            this.searchBoxOpen = true;
                            SearchBox.create(tainer, this.SearchBoxProps);
                        }}
                    />
                </div>
            </div>
        );
    }
}

export namespace ConfalsRmsds {
    export const SelectionDisplayer = Validation.selectionDisplayer;
    export const SelectionMaker = Validation.selectionMaker;
}
