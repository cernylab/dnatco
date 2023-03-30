import React from 'react';
import { Validation } from './common';
import { ChainSelect, ModelSelect, StepSelect } from '../structure-selectors';
import { InvalidResidue } from '../../structure-selection';
import { View } from '../view';
import { Common as C } from '../../common';
import { NamedList, NamedListItem } from '../../../common/named-list';
import { Tooltip } from '../../../common/tooltip';
import { colorToRgb, rgbToHex } from '../../../util';
import { Cif } from '../../../../cif';
import {
    NdbStructNtcStepParameters, NdbStructNtcStepParameters_Schema,
    NdbStructNtcStepSummary, NdbStructNtcStepSummary_Schema,
    NdbStructSugarStepParameters, NdbStructSugarStepParameters_Schema,
} from '../../../../cif/categories/ndb-struct-ntc';
import { Dnatcofication } from '../../../../dnatco/dnatcofication';
import { Step } from '../../../../dnatco/step';
import { htmlColorAsNumber, toFixed } from '../../../../util';
import { GlobalConfig } from '../../../../global-config';

const TorsionsDisplayOrder: Step.Torsion[] = ['delta1', 'epsilon1', 'zeta1', 'alpha2', 'beta2', 'gamma2', 'delta2', 'chi1', 'chi2', 'nccn'];
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

const DistancesDisplayOrder: Step.Distance[] = ['nn', 'cc'];
const DistancesCaptions = {
    cc: 'CC',
    nn: 'NN',
};

function distanceColumn(table: Cif.Table<NdbStructNtcStepParameters_Schema>, dist: Step.Distance) {
    switch (dist) {
    case 'cc': return table.dist_CC;
    case 'nn': return table.dist_NN
    }
}

function distanceConfalColumn(table: Cif.Table<NdbStructNtcStepParameters_Schema>, dist: Step.Distance) {
    switch (dist) {
    case 'cc': return table.confal_dist_CC;
    case 'nn': return table.confal_dist_NN
    }
}

function distanceDiffColumn(table: Cif.Table<NdbStructNtcStepParameters_Schema>, dist: Step.Distance) {
    switch (dist) {
    case 'cc': return table.diff_dist_CC;
    case 'nn': return table.diff_dist_NN
    }
}

function torsionColumn(table: Cif.Table<NdbStructNtcStepParameters_Schema>, torsion: Step.Torsion) {
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

function torsionConfalColumn(table: Cif.Table<NdbStructNtcStepParameters_Schema>, torsion: Step.Torsion) {
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

function torsionDiffColumn(table: Cif.Table<NdbStructNtcStepParameters_Schema>, torsion: Step.Torsion) {
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
    actual: Record<Step.Distance, number>,
    confal: Record<Step.Distance, number>,
    diff: Record<Step.Distance, number>,
    reference: Record<Step.Distance, number>,
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
    NtC: C.NA,
    confal: 0,
    p1: 0,
    tau1: 0,
    pn1: C.NA,
    p2: 0,
    tau2: 0,
    pn2: C.NA,
    details: ''
};

type TorsionInfo = {
    actual: Record<Step.Torsion, number>,
    confal: Record<Step.Torsion, number>,
    diff: Record<Step.Torsion, number>,
    reference: Record<Step.Torsion, number>,
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
    { tag: 'mu', name: 'μ' },
];
function mkViolationDetailsToolip(details: string|null) {
    if (details === null)
        return [];

    const elems: JSX.Element[] = [];
    const items = details.split(';');

    let keyIdx = 0;
    for (const it of items) {
        if (it.startsWith('cAn')) {
            const tor = TorsionNames.find(x => x.tag.endsWith(it.substring(3)));
            if (tor)
                elems.push(<div key={keyIdx++}>{`${tor.name} exceeded tolerance against the average of all nearest neighbors`}</div>);
        } else if (it.startsWith('cNn')) {
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

const ViolinBackdropWidth = 600;
const ViolinBackdropHeight = 509;

const ViolinBackdropTorXOffset = 78;
const ViolinBackdropTorXLength = 371;
const ViolinBackdropTorXScale = ViolinBackdropTorXLength / 9;
const ViolinBackdropDistXOffset = 513;

const ViolinBackdropTorYOffset = 93;
const ViolinBackdropTorYLength = 327;
const ViolinBackdropTorYScale = ViolinBackdropTorYLength / 360;
const ViolinBackdropDistYScale = ViolinBackdropTorYLength / 12;

const ViolinBackdropTickSize = 10;
const ViolinBackdropTickThickness = 2;
const ViolinMarkerDefaultColor = 16774924; // RGB 255, 247, 12

class ViolinPlot extends React.Component<{
    NtC: string,
    torsions: TorsionInfo['actual'],
    distances: DistanceInfo['actual'],
    maxWidth?: number,
}> {
    private canvasRef = React.createRef<HTMLCanvasElement>();

    private drawTick(ctx: CanvasRenderingContext2D, x: number, y: number, tickSize: number, tickThickness: number, colorA: string, colorB: string) {
        const Ext = 1;
        ctx.beginPath();
        ctx.strokeStyle = colorB;
        ctx.lineWidth = tickThickness + 2 * Ext;
        ctx.moveTo(x - tickSize - Ext, y);
        ctx.lineTo(x + tickSize + Ext, y);
        ctx.moveTo(x, y - tickSize - Ext);
        ctx.lineTo(x, y + tickSize + Ext);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = colorA;
        ctx.lineWidth = tickThickness;
        ctx.moveTo(x - tickSize, y);
        ctx.lineTo(x + tickSize, y);
        ctx.moveTo(x, y - tickSize);
        ctx.lineTo(x, y + tickSize);
        ctx.stroke();
    }

    private async draw() {
        const canvas = this.canvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;

        const markerColorA = colorToRgb(htmlColorAsNumber(GlobalConfig.data().violinPlotMarkerColorA) ?? ViolinMarkerDefaultColor);
        const markerColorB = colorToRgb(htmlColorAsNumber(GlobalConfig.data().violinPlotMarkerColorB) ?? 0);
        const w = canvas.width;
        const h = canvas.height;

        const xOffsetTor = ViolinBackdropTorXOffset * w / ViolinBackdropWidth;
        const xOffsetDist = ViolinBackdropDistXOffset * w / ViolinBackdropWidth;
        const xScale = ViolinBackdropTorXScale * w / ViolinBackdropWidth;

        const yOffset = ViolinBackdropTorYOffset * h / ViolinBackdropHeight;
        const yLength = ViolinBackdropTorYLength * h / ViolinBackdropHeight;
        const yScaleTor = ViolinBackdropTorYScale * h / ViolinBackdropHeight;
        const yScaleDist = ViolinBackdropDistYScale * h / ViolinBackdropHeight;
        const tickSize = ViolinBackdropTickSize * w / ViolinBackdropWidth;
        const tickThickness = ViolinBackdropTickThickness * w / ViolinBackdropWidth;

        const clrA = rgbToHex(markerColorA);
        const clrB = rgbToHex(markerColorB);

        try {
            const req = await fetch(`${GlobalConfig.data().pathPrefix}/violin_plots/${this.props.NtC}.png`);
            if (!req.ok)
                throw new Error('Cannot download plot');

            const imgBlob = await req.blob();
            const bitmap = await createImageBitmap(imgBlob);

            // Backdrop
            ctx.drawImage(bitmap, 0, 0, w, h);

            let x = xOffsetTor;
            let y = 0;
            for (const tor of ['delta1', 'epsilon1', 'zeta1', 'alpha2', 'beta2', 'gamma2', 'delta2', 'chi1', 'chi2', 'nccn'] as (keyof TorsionInfo['actual'])[]) {
                const v = this.props.torsions[tor];

                y = (yLength - v * yScaleTor) + yOffset;

                console.log(x, y, v);
                this.drawTick(ctx, x, y, tickSize, tickThickness, clrA, clrB);

                x += xScale;
            }

            x = xOffsetDist;
            for (const dist of ['nn', 'cc'] as (keyof DistanceInfo['actual'])[]) {
                const v = this.props.distances[dist];

                y = (yLength - v * yScaleDist) + yOffset;
                this.drawTick(ctx, x, y, tickSize, tickThickness, clrA, clrB);

                x += xScale;
            }
        } catch (e) {
            ctx.fillStyle = '#ff0000';
            ctx.font = '16pt monospace';
            ctx.fillText(`${e}`, 10, h / 2);
        }
    }

    componentDidMount() {
        this.draw();
    }

    componentDidUpdate() {
        this.draw();
    }

    render() {
        if (this.props.NtC === C.NA)
            return undefined;

        return (
            <canvas
                ref={this.canvasRef}
                width={1000}
                height={1000}
                style={{ width: '100%', maxWidth: `${this.props.maxWidth ? `${this.props.maxWidth}px` : 'auto'}`} }
            />
        );
    }
}

export class StepTorsions extends View<View.Props> {
    private stepParamsTable: Cif.Table<NdbStructNtcStepParameters_Schema>|null;
    private stepSumTable: Cif.Table<NdbStructNtcStepSummary_Schema>|null;
    private sugarStepParamsTable: Cif.Table<NdbStructSugarStepParameters_Schema>|null;
    private torDistTableRef = React.createRef<HTMLTableElement>(); // Nasty hack to limit the width of the violin plot to the tor/dist table

    constructor(props: View.Props) {
        super(props);

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
            info.actual[dist] = Cif.Column.value(distanceColumn(this.stepParamsTable, dist), idx)!;
        }
        for (const key in info.diff) {
            const dist = key as keyof DistanceInfo['diff'];
            info.diff[dist] = Cif.Column.value(distanceDiffColumn(this.stepParamsTable, dist), idx)!;
        }
        for (const key in info.reference) {
            const dist = key as keyof DistanceInfo['reference'];
            info.reference[dist] = info.actual[dist] - info.diff[dist];
        }
        for (const key in info.confal) {
            const dist = key as keyof DistanceInfo['confal'];
            info.confal[dist] = Cif.Column.value(distanceConfalColumn(this.stepParamsTable, dist), idx)!;
        }

        return info;
    }

    private stepInfo(stepId: number|undefined) {
        if (stepId === undefined)
            return StepInfo;

        if (!this.stepSumTable || !this.sugarStepParamsTable || !this.stepParamsTable)
            return StepInfo;

        const { assigned_NtC, cartesian_rmsd_closest_NtC_representative, confal_score } = this.stepSumTable;
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
            cartesianRmsd: Cif.Column.value(cartesian_rmsd_closest_NtC_representative, index),
            NtC: Cif.Column.value(assigned_NtC, index)!,
            confal: Cif.Column.value(confal_score, index)!,
            p1: Cif.Column.value(P_1, index)!,
            tau1: Cif.Column.value(tau_1, index)!,
            pn1: Cif.Column.value(Pn_1, index)!,
            p2: Cif.Column.value(P_2, index)!,
            tau2: Cif.Column.value(tau_2, index)!,
            pn2: Cif.Column.value(Pn_2, index)!,
            details: Cif.Column.value(details, index)!,
        };
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
            info.actual[tor] = Cif.Column.value(torsionColumn(this.stepParamsTable, tor), idx)!;
        }
        for (const key in info.diff) {
            const tor = key as keyof TorsionInfo['diff'];
            info.diff[tor] = Cif.Column.value(torsionDiffColumn(this.stepParamsTable, tor), idx)!;
        }
        for (const key in info.reference) {
            const tor = key as keyof TorsionInfo['reference'];
            info.reference[tor] = info.actual[tor] - info.diff[tor];
        }
        for (const key in info.confal) {
            const tor = key as keyof TorsionInfo['confal'];
            info.confal[tor] = Cif.Column.value(torsionConfalColumn(this.stepParamsTable, tor), idx)!;
        }

        return info;
    }

    componentDidMount() {
        this.subscribe(this.props.dnatcofication.events.structureChanged, () => {
            this.stepParamsTable = this.props.dnatcofication.hasTable(NdbStructNtcStepParameters) ? this.props.dnatcofication.table(NdbStructNtcStepParameters) : null;
            this.stepSumTable = this.props.dnatcofication.hasTable(NdbStructNtcStepSummary) ? this.props.dnatcofication.table(NdbStructNtcStepSummary) : null;
            this.sugarStepParamsTable = this.props.dnatcofication.hasTable(NdbStructSugarStepParameters) ? this.props.dnatcofication.table(NdbStructSugarStepParameters) : null;
        });

        this.subscribe(this.props.switching.events.modelSwitched, () => this.forceUpdate());
        this.subscribe(this.props.switching.events.chainSwitched, () => this.forceUpdate());
        this.subscribe(this.props.switching.events.selectionChanged, () => this.forceUpdate());
    }

    componentWillUnmount() {
        this.unsubscribeAll();
    }

    render() {
        const torsionInfo = this.torsionInfo(this.props.structureSelection.steps[0]);
        const distanceInfo = this.distanceInfo(this.props.structureSelection.steps[0]);
        const stepInfo = this.stepInfo(this.props.structureSelection.steps[0]);
        const numModels = Dnatcofication.Structure.numberOfModels(this.props.dnatcofication);

        return (
            <div>
                <div className='rdo-view-caption'>Torsions and distances for selected step</div>

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
                    <NamedListItem name='Step'>
                        <StepSelect
                            dnatcofication={this.props.dnatcofication}
                            structureSelection={this.props.structureSelection}
                            switching={this.props.switching}
                            onChange={(stepId) => {
                                const sel = stepId === -1
                                    ? { steps: [], residues: [], reconstruct: true }
                                    : StepTorsions.SelectionMaker(stepId, InvalidResidue, this.props.structureSelection.steps, this.props.structureSelection.residues);
                                this.props.switching.changeSelection(sel, StepTorsions.SelectionDisplayer);
                            }}
                        />
                    </NamedListItem>
                </NamedList>

                <div className='rdo-line-spacer' />
                <NamedList>
                    <NamedListItem name='Step NtC'>{stepInfo.NtC}</NamedListItem>
                    <NamedListItem name='Step confal'>{stepInfo.confal}</NamedListItem>
                    <NamedListItem name='Cartesian RMSD'>{`${stepInfo.cartesianRmsd!.toFixed(2)} Å`}</NamedListItem>
                    <NamedListItem name='Pseudorotation'>{`${stepInfo.p1}, ${stepInfo.tau1}, ${stepInfo.pn1} / ${stepInfo.p2}, ${stepInfo.tau2}, ${stepInfo.pn2}`}</NamedListItem>
                    <NamedListItem name='Details'>
                        <Tooltip
                            tag={stepInfo.details}
                        >
                            {mkViolationDetailsToolip(stepInfo.details)}
                        </Tooltip>
                    </NamedListItem>
                </NamedList>
                <div className='rdo-line-spacer' />

                <table className='rdo-data-table' ref={this.torDistTableRef}>
                    <thead>
                        <tr>
                            <th className='rdo-data-table'></th>
                            <th className='rdo-data-table'>Actual</th>
                            <th className='rdo-data-table'>{`Reference ${stepInfo.NtC}`}</th>
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

                <ViolinPlot
                    NtC={stepInfo.NtC}
                    torsions={torsionInfo.actual}
                    distances={distanceInfo.actual}
                    maxWidth={this.torDistTableRef.current?.clientWidth}
                />
            </div>
        );
    }
}

export namespace StepTorsions {
    export const SelectionDisplayer = Validation.selectionDisplayer;
    export const SelectionMaker = Validation.selectionMaker;
}
