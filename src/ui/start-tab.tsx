import React from 'react';
import { BigLogo } from './big-logo';
import { ComboBox } from './common/combo-box';
import { IconButton } from './common/push-button';
import { InProgressSpinner } from './common/in-progress-spinner';
import { Popup } from './common/popup';
import { DummyButton, PushButton } from './common/push-button';
import { QuestionDialog } from './common/question-dialog';
import { ShadowedBox } from './common/shadowed-box';
import { DensityMap } from '../dnatco/density-map';
import { BuiltInRemoteDatabases, UserRemoteDatabases } from '../remote/db/register';
import { Search } from '../remote/search';
import { isPdbId } from '../util';
import 'assets/imgs/x.svg';

interface State {
    coordsFile: File|null;
    densityMaps: { file: File, kind: (DensityMap['kind'] | 'coefficients') }[];
    remainingDensityMapKinds: (DensityMap['kind'] | 'coefficients')[],
    selectedDensityMapKind: (DensityMap['kind'] | 'coefficients') | null,
    currentDensityMapFile: File|null,
    database: string;
    pdbId: string;
}
const KnownDensityMapKinds: (DensityMap['kind'] | 'coefficients')[] = [ 'fo-fc', '2fo-fc', 'em', 'coefficients' ];

const NiceMapKinds: Record<DensityMap['kind'] | 'coefficients', string> = {
    'fo-fc': 'Fo-Fc',
    '2fo-fc': '2Fo-Fc',
    'em': 'EM',
    'coefficients': 'Map coefficients',
}

export class StartTab extends React.Component<StartTab.Props, State> {
    private readonly DatabaseOptions = (() => {
        const opts = UserRemoteDatabases.list().map(x => ({ caption: x.name, value: x.id }));

        for (const id in BuiltInRemoteDatabases) {
            opts.push({ caption: BuiltInRemoteDatabases[id as keyof typeof BuiltInRemoteDatabases].name, value: id });
        }

        return opts;
    })();

    constructor(props: StartTab.Props) {
        super(props);

        this.state = {
            coordsFile: null,
            database: this.DatabaseOptions[0].value,
            densityMaps: [],
            remainingDensityMapKinds: [...KnownDensityMapKinds],
            selectedDensityMapKind: KnownDensityMapKinds[0],
            currentDensityMapFile: null,
            pdbId: '',
        };
    }

    private actionPdbId() {
        if (isPdbId(this.state.pdbId))
            this.props.onDoPdbId(this.state.pdbId, this.state.database);
        else if (this.state.pdbId.length === 0) {
            Popup.create(
                <div className='rdo-error-text'>Please enter a valid PDB ID</div>
            );
        } else {
            Popup.create(
                <div className='rdo-error-text'>{`${this.state.pdbId} is not a valid PDB ID`}</div>
            );
        }
    }

    componentDidUpdate(prevProps: Readonly<StartTab.Props>, prevState: Readonly<State>) {
        if (this.state.densityMaps.length !== prevState.densityMaps.length) {
            const remaining = KnownDensityMapKinds.filter(kind => !this.state.densityMaps.find(x => x.kind === kind));

            this.setState({
                ...this.state,
                remainingDensityMapKinds: remaining,
                selectedDensityMapKind: remaining[0] ?? null,
                currentDensityMapFile: null,
            });
        }
    }

    render() {
        return (
            <div className='rdo-section-column'>
                <BigLogo />
                <div className='rdo-section-column' style={{ margin: 'var(--x-gap)' }}>
                    <div style={{
                        columnGap: 'var(--h-gap)',
                        display: 'grid',
                        gridTemplateColumns: '0.5fr 0.5fr',
                    }}>
                        <ShadowedBox>
                            <div className='rdo-offset'>
                                <div className='rdo-section-caption'>
                                    Enter PDB ID (e. g. <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => {
                                        if (this.props.dnatcofierState === 'ready')
                                            this.props.onDoPdbId('1ehz', 'rcsb')}
                                    }>1ehz</span>)
                                </div>
                                <div style={{
                                    columnGap: 'var(--h-gap)',
                                    display: 'grid',
                                    gridTemplateColumns: '0.5fr 6em auto auto 0.5fr',
                                    rowGap: 'var(--v-gap)',
                                }}>
                                    <div></div>
                                    <input
                                        type='text'
                                        className='rdo-input-text'
                                        value={this.state.pdbId}
                                        onChange={e => {
                                            const v = e.currentTarget.value;
                                            if (v.length < 5)
                                                this.setState({ ...this.state, pdbId: v });
                                        }}
                                        onKeyDown={e => {
                                            if (e.code === 'Enter') {
                                                e.currentTarget.blur();
                                                this.actionPdbId();
                                            }
                                        }}
                                    />
                                    <ComboBox
                                        options={this.DatabaseOptions}
                                        value={this.state.database}
                                        onChange={v => this.setState({ ...this.state, database: v })}
                                    />
                                    <PushButton
                                        caption='Proceed'
                                        onClick={() => this.actionPdbId()}
                                        enabled={this.props.dnatcofierState === 'ready'}
                                    />
                                    <div></div>
                                </div>
                                { this.props.dnatcofierState === 'initializing'
                                    ? <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'center', marginLeft: 'auto', marginRight: 'auto', marginTop: 'var(--v-gap)', width: 'fit-content' }}>
                                        <span>ReDNATCO is initializing...{'\u000A'}</span>
                                        <span style={{ display: 'inline-block', height: 'inherit', width: 'fit-content' }}>
                                            <InProgressSpinner />
                                        </span>
                                     </div>
                                    : undefined
                                }
                            </div>
                        </ShadowedBox>
                        <ShadowedBox>
                            <div className='rdo-offset'>
                                <div style={{ alignItems: 'center', display: 'flex', gap: 'var(--h-gap)', justifyContent: 'center', marginBottom: 'var(--v-gap)' }}>
                                    <div className='rdo-text-large'>
                                        Custom structure
                                    </div>
                                    <PushButton
                                        caption='Proceed'
                                        enabled={this.state.coordsFile !== null && this.props.dnatcofierState === 'ready'}
                                        onClick={() => {
                                            if (this.state.coordsFile) {
                                                const densityMaps = this.state.densityMaps.filter(x => x.kind !== 'coefficients') as { file: File, kind: DensityMap['kind'] }[];
                                                const densityMapCoeffs = this.state.densityMaps.find(x => x.kind === 'coefficients')?.file ?? null;

                                                if (this.state.currentDensityMapFile) {
                                                    QuestionDialog.create({
                                                        caption: 'Confirm action',
                                                        text: 'You have selected a density map file but you did not add the file to the list of density map files. Was that intentional?',
                                                        answers: [{ code: 0, text: 'Yes' }, { code: 1, text: 'No' }],
                                                        onAnswered: (code) => {
                                                            if (code === 0)
                                                                this.props.onDoCustomStructure(this.state.coordsFile!, densityMaps, densityMapCoeffs);
                                                        }
                                                    });
                                                } else
                                                    this.props.onDoCustomStructure(this.state.coordsFile, densityMaps, densityMapCoeffs);
                                            }
                                        }}
                                    />
                                </div>
                                <div style={{ alignItems: 'center', display: 'flex', gap: 'var(--h-gap)', justifyContent: 'center' }}>
                                    <div style={{
                                        alignItems: 'center',
                                        columnGap: 'var(--h-gap)',
                                        display: 'grid',
                                        gridTemplateColumns: 'auto auto auto auto',
                                        rowGap: 'var(--v-gap)',
                                    }}>
                                        <div className='rdo-strong'>Coordinates (PDB or CIF)</div>
                                        <div style={{ alignItems: 'center', display: 'flex', gap: 'var(--h-gap)' }}>
                                            <label className='rdo-file-upload' htmlFor='upload-coords-file'>
                                                <DummyButton caption='Browse...' />
                                            </label>
                                            <div>{this.state.coordsFile !== null ? this.state.coordsFile.name : 'No file selected'}</div>
                                            <input
                                                id='upload-coords-file'
                                                className='rdo-input-file'
                                                type='file'
                                                onChange={e => {
                                                    const file = (e.currentTarget.files ? e.currentTarget.files[0] : null);
                                                    this.setState({ ...this.state, coordsFile: file });
                                                }}
                                            />
                                        </div>
                                        <div />
                                        <div />

                                        <div className='rdo-line-spacer' style={{ gridColumnStart: 'span 4' }} />

                                        <div className='rdo-strong'>Density maps</div>
                                        <div className='rdo-strong'>File</div>
                                        <div className='rdo-strong'>Kind</div>
                                        <div />
                                        {
                                            this.state.densityMaps.length === 0
                                                ? <div style={{ gridColumnStart: 'span 4', textAlign: 'center' }}>(No density map files)</div>
                                                : this.state.densityMaps.map((m, idx) => {
                                                    return (
                                                        <>
                                                            <div />
                                                            <div>{m.file.name}</div>
                                                            <div>{NiceMapKinds[m.kind]}</div>
                                                            <IconButton
                                                                src={`imgs/x.svg`}
                                                                onClick={() => {
                                                                    const dms = [...this.state.densityMaps];
                                                                    dms.splice(idx, 1);
                                                                    this.setState({ ...this.state, densityMaps: dms });
                                                                }}
                                                                className='rdo-icon-text-button'
                                                            />
                                                        </>
                                                    );
                                                })
                                        }

                                        <div style={{ marginTop: 'calc(var(--v-gap) / 2', gridColumnStart: 'span 4' }} />

                                        {
                                            this.state.remainingDensityMapKinds.length > 0
                                                ? <>
                                                    <PushButton
                                                        caption='Add density map'
                                                        onClick={() => {
                                                            if (this.state.currentDensityMapFile) {
                                                                this.setState({
                                                                    ...this.state,
                                                                    densityMaps: [
                                                                        ...this.state.densityMaps,
                                                                        ({ file: this.state.currentDensityMapFile, kind: this.state.selectedDensityMapKind! })
                                                                    ]
                                                                });
                                                            }
                                                        }}
                                                    />
                                                    <div style={{ alignItems: 'center', display: 'flex', gap: 'var(--h-gap)' }}>
                                                        <label className='rdo-file-upload' htmlFor='upload-density-map'>
                                                            <DummyButton caption='Browse...' />
                                                        </label>
                                                        <input
                                                            id='upload-density-map'
                                                            className='rdo-input-file'
                                                            type='file'
                                                            onChange={e => {
                                                                const file = (e.currentTarget.files ? e.currentTarget.files[0] : null);
                                                                this.setState({ ...this.state, currentDensityMapFile: file });
                                                            }}
                                                        />
                                                        <div>
                                                            {this.state.currentDensityMapFile ? this.state.currentDensityMapFile.name : 'No file selected'}
                                                        </div>
                                                    </div>
                                                    <ComboBox
                                                        options={this.state.remainingDensityMapKinds.map(x => ({ caption: NiceMapKinds[x], value: x }))}
                                                        value={this.state.selectedDensityMapKind ?? ''}
                                                        onChange={value => this.setState({ ...this.state, selectedDensityMapKind: value as State['selectedDensityMapKind'] })}
                                                    />
                                                    <div />
                                                </>
                                                : <div style={{ gridColumnStart: 'span 4' }} />
                                        }
                                    </div>
                                </div>
                            </div>
                        </ShadowedBox>
                    </div>
                </div>
            </div>
        );
    }
}

export namespace StartTab {
    export interface Props {
        onDoPdbId: (pdbId: string, db: string) => void,
        onDoCustomStructure: (coordsFile: File, densityMaps: { file: File, kind: DensityMap['kind'] }[], densityMapCoeffs: File|null) => void,
        onDoRawLink: (link: string) => void,
        onDoSearchConformers: (options: Search.Criteria) => void,
        dnatcofierState: 'ready' | 'initializing' | 'failed';
    }
}
