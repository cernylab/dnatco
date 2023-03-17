import React from 'react';
import { BigLogo } from './big-logo';
import { ComboBox } from './common/combo-box';
import { DummyIconTextButton, IconButton, IconTextButton } from './common/push-button';
import { InProgressSpinner } from './common/in-progress-spinner';
import { Popup } from './common/popup';
//import { QuestionDialog } from './common/question-dialog';
import { ShadowedBox } from './common/shadowed-box';
import { DensityMap, DensityMapKinds } from '../dnatco/density-map';
import { BuiltInRemoteDatabases, UserRemoteDatabases } from '../remote/db/register';
import { Search } from '../remote/search';
import { isPdbId } from '../util';
import { GlobalConfig } from '../global-config';
import 'assets/imgs/magnifying-glass.svg';
import 'assets/imgs/media-play.svg';
import 'assets/imgs/x.svg';

const AllowedDensityMapKinds = [...DensityMapKinds, 'coefficients'] as const;
type AllowedDensityMapKinds = typeof AllowedDensityMapKinds[number];
type DensityMapFile = { file: File, kind: AllowedDensityMapKinds };

const NiceMapKinds: Record<AllowedDensityMapKinds, string> = {
    'fo-fc': 'Fo-Fc',
    '2fo-fc': '2Fo-Fc',
    'em': 'EM',
    'coefficients': 'Map coefficients',
}

class AnalyzeButton extends React.Component<{ ready: boolean, onClick: () => void }> {
    render() {
        const prefix = GlobalConfig.data().pathPrefix;

        return (
            <IconTextButton
                src={`${prefix}/imgs/media-play.svg`}
                caption='Analyze'
                onClick={() => this.props.onClick()}
                enabled={this.props.ready}
                className='rdo-pushbutton rdo-pushbutton-border rdo-start-analyze-button'
                classNameDisabled='rdo-pushbutton rdo-pushbutton-border rdo-start-analyze-button-disabled'
            />
        );
    }
}

class Coordinates extends React.Component<Coordinates.Props> {
    render() {
        const prefix = GlobalConfig.data().pathPrefix;
        const customFile = !this.props.database;

        return (
            <div className='rdo-start-input-section'>
                <div className='rdo-start-input-section-caption'>Coordinates</div>

                <div style={{ display: 'grid', gridTemplateColumns: '6em 1fr', gap: 'var(--x-gap)', alignItems: 'center', justifyItems: 'end', minWidth: '30em' }}>
                    <div className='rdo-strong rdo-talgn-right' style={{ fontSize: 'var(--font-large)' }}>Source</div>
                    <div style={{ width: '100%' }}>
                        <ComboBox
                            value={this.props.database}
                            options={this.props.databaseOptions}
                            onChange={(db) => this.props.onDatabaseChange(db)}
                            innerStyle={{ fontSize: 'var(--font-large)' }}
                            sizing='auto'
                        />
                    </div>

                    {customFile
                        ? <>
                            <div>
                                <label htmlFor='upload-coords-file'>
                                    <DummyIconTextButton
                                        src={`${prefix}/imgs/magnifying-glass.svg`}
                                        caption='Browse'
                                    />
                                </label>
                                <FileInput
                                    id='upload-coords-file'
                                    onChange={fileList => {
                                        const file = fileList ? fileList.item(0) : null;
                                        if (file)
                                            this.props.onCoordsFileChange(file);

                                    }}
                                />
                            </div>
                            <div style={{ fontSize: 'var(--font-large)', width: '100%' }}>{this.props.coordsFile?.name ?? '(Select mmCif/PDB file)'}</div>
                        </>
                        : <>
                            <div className='rdo-strong rdo-talgn-right' style={{ fontSize: 'var(--font-large)' }}>PDB ID</div>
                            <PdbIdInput
                                pdbId={this.props.pdbId}
                                onChange={(v) => this.props.onPdbIdChange(v)}
                                onExecute={() => this.props.onExecute()}
                            />
                        </>
                    }
                </div>
            </div>
        );
    }
}
namespace Coordinates {
    export interface Props {
        coordsFile: File|null,
        database: string;
        databaseOptions: ComboBox.Option[];
        pdbId: string;

        onCoordsFileChange: (file: File) => void;
        onDatabaseChange: (db: string) => void;
        onPdbIdChange: (id: string) => void;

        onExecute: () => void;
    }
}

class DensityMapFiles extends React.Component<
    DensityMapFiles.Props,
    { selectedKind: AllowedDensityMapKinds }
> {
    constructor(props: DensityMapFiles.Props) {
        super(props);

        this.state = {
            selectedKind: 'fo-fc',
        };
    }

    private fileTypeOptions() {
        const remaining = AllowedDensityMapKinds.filter(x => !this.props.files.find(f => f.kind === x) );
        return remaining.map(x => ({ caption: NiceMapKinds[x], value: x }));
    }

    componentDidUpdate() {
        const opts = this.fileTypeOptions();
        if (opts.length > 0 && !opts.find(x => x.value === this.state.selectedKind))
            this.setState({ ...this.state, selectedKind: opts[0].value});
    }

    render() {
        const prefix = GlobalConfig.data().pathPrefix;

        return (
            <div className='rdo-start-input-section'>
                <div className='rdo-start-input-section-caption'>Density maps</div>

                <FileInput
                    id='upload-density-map'
                    onChange={(e) => {
                        const file = e?.[0];
                        if (file && this.fileTypeOptions().length > 0) {
                            this.props.files.push({ file, kind: this.state.selectedKind });
                            this.props.onChange(this.props.files);
                        }
                    }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'var(--x-gap)', alignItems: 'center', justifyItems: 'end' }}>
                    <label htmlFor='upload-density-map' style={{ height: '100%' }}>
                        <DummyIconTextButton
                            src={`${prefix}/imgs/magnifying-glass.svg`}
                            caption='Browse'
                        />
                    </label>
                    <ComboBox
                        value={this.state.selectedKind}
                        options={this.fileTypeOptions()}
                        onChange={(v) => this.setState({ ...this.state, selectedKind: v as AllowedDensityMapKinds })}
                        innerStyle={{ fontSize: 'var(--font-large)' }}
                        sizing='maximum-available'
                    />

                    {this.props.files.map((f, idx) => (
                        <React.Fragment key={idx}>
                            <div style={{ fontSize: 'var(--font-large)' }}>{f.file.name}</div>
                            <div style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
                                <div style={{ flex: 1, fontSize: 'var(--font-large)' }}>{NiceMapKinds[f.kind]}</div>
                                <div style={{ width: '2em' }}>
                                    <IconButton
                                        src={`${prefix}/imgs/x.svg`}
                                        onClick={() => {
                                            this.props.files.splice(idx, 1);
                                            this.props.onChange(this.props.files);
                                        }}
                                        className='rdo-remove-icon-button'
                                    />
                                </div>
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            </div>
        );
    }
}
namespace DensityMapFiles {
    export interface Props {
        files: DensityMapFile[],
        onChange: (files: DensityMapFile[]) => void,
    }
}

class FileInput extends React.Component<{ id: string, onChange: (f: FileList | null) => void }> {
    render() {
        return (
            <input
                id={this.props.id}
                className='rdo-input-file'
                type='file'
                onChange={(e) => this.props.onChange(e.currentTarget.files)}
            />
        );
    }
}

class PdbIdInput extends React.Component<{ pdbId: string, onChange: (v: string) => void, onExecute: () => void }> {
    render() {
        return (
            <input
                className='rdo-input-text'
                style={{ fontSize: 'var(--font-large)', width: '100%', ...(!isPdbId(this.props.pdbId) ? { color: 'red' } : {})}}
                type='text'
                value={this.props.pdbId}
                onChange={(v) => {
                    const text = v.currentTarget.value;
                    if (text.length < 5)
                        this.props.onChange(v.currentTarget.value)
                }}
                onKeyDown={(ev) => {
                    const key = ev.key;

                    if (key === 'Enter') {
                        ev.currentTarget.blur();
                        this.props.onExecute();
                    }
                }}
                inputMode='text'
                placeholder='Enter PDB ID'
            />
        );
    }
}

interface State {
    coordsFile: File|null;
    densityMaps: DensityMapFile[];
    database: string;
    pdbId: string;
}
export class StartTab extends React.Component<StartTab.Props, State> {
    private readonly DatabaseOptions = (() => {
        const opts = UserRemoteDatabases.list().map(x => ({ caption: x.name, value: x.id }));

        for (const id in BuiltInRemoteDatabases) {
            opts.push({ caption: BuiltInRemoteDatabases[id as keyof typeof BuiltInRemoteDatabases].name, value: id });
        }

        opts.push({ caption: 'Custom file', value: '' });

        return opts;
    })();

    constructor(props: StartTab.Props) {
        super(props);

        this.state = { ...this.defaultState() };
    }

    private actionCustomStructure() {
        if (!this.state.coordsFile) {
            Popup.create(
                <div className='rdo-error-text'>You have not set any coordinates file</div>
            );
            return;
        }

        const densityMaps = this.state.densityMaps.filter(x => x.kind !== 'coefficients') as { file: File, kind: DensityMap['kind'] }[];
        const densityMapCoeffs = this.state.densityMaps.find(x => x.kind === 'coefficients')?.file ?? null;

        this.props.onDoCustomStructure(this.state.coordsFile!, densityMaps, densityMapCoeffs);
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

    private defaultState(): State {
        return {
            coordsFile: null,
            database: this.DatabaseOptions[0].value,
            densityMaps: [],
            pdbId: '',
        }
    }

    render() {
        const customFile = !this.state.database;
        const prefix = GlobalConfig.data().pathPrefix;

        return (
            <div className='rdo-section-column' style={{ height: '100%' }}>
                <BigLogo />
                <div className='rdo-offset' style={{ flex: 1 }}>
                    <ShadowedBox>
                        <div className='rdo-start-container'>
                            {this.props.dnatcofierState === 'initializing' ? <InProgressSpinner /> : <div />}

                            <Coordinates
                                coordsFile={this.state.coordsFile}
                                database={this.state.database}
                                databaseOptions={this.DatabaseOptions}
                                pdbId={this.state.pdbId}
                                onCoordsFileChange={(f) => this.setState({ ...this.state, coordsFile: f })}
                                onDatabaseChange={(db) => this.setState({ ...this.state, database: db })}
                                onPdbIdChange={(id) => this.setState({ ...this.state, pdbId: id })}
                                onExecute={() => this.actionPdbId()}
                            />

                            {customFile
                                ? <DensityMapFiles
                                    files={this.state.densityMaps}
                                    onChange={(files) => this.setState({ ...this.state, densityMaps: [...files] })}
                                    />
                                : undefined
                            }

                            <div style={{ display: 'flex', flexDirection: 'row', margin: 'auto', gap: 'var(--h-gap)' }}>
                                <div style={{ flex: 1 }}>
                                    <AnalyzeButton
                                        ready={this.props.dnatcofierState === 'ready'}
                                        onClick={() => {
                                            if (this.state.database)
                                                this.actionPdbId()
                                            else
                                                this.actionCustomStructure();
                                        }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <IconTextButton
                                        src={`${prefix}/imgs/reload.svg`}
                                        caption='Reset'
                                        onClick={() => this.setState({ ...this.defaultState() })}
                                        className='rdo-pushutton rdo-pushbutton-border rdo-start-reset-button'
                                    />
                                </div>
                            </div>
                            <div style={{ flex: 1 }} />
                        </div>
                    </ShadowedBox>
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
