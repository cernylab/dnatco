import React from 'react';
import { BigLogo } from './big-logo';
import { ComboBox } from './common/combo-box';
import { DummyIconTextButton, IconButton, IconTextButton } from './common/push-button';
import { InProgressSpinner } from './common/in-progress-spinner';
import { Popup } from './common/popup';
import { ShadowedBox } from './common/shadowed-box';
import { DensityMap, DensityMapKinds } from '../dnatco/density-map';
import { BuiltInRemoteDatabases, UserRemoteDatabases } from '../remote/db/register';
import { Search } from '../remote/search';
import { copyString, isPdbId } from '../util';
import { GlobalConfig, GlobalConfigData } from '../global-config';
import 'assets/imgs/magnifying-glass.svg';
import 'assets/imgs/media-play.svg';
import 'assets/imgs/x.svg';

const AllowedDensityMapKinds = [...DensityMapKinds, 'coefficients'] as const;
type AllowedDensityMapKinds = typeof AllowedDensityMapKinds[number];
type DensityMapFile = { file: File, kind: AllowedDensityMapKinds };

const CoordsItemProps = {
    alignItems: 'center',
    display: 'flex',
    height: '32px', // This needs to be in pixels because ems are relative to font size and things then get misaligned
    fontSize: 'var(--font-large)'
};

function listOfValidExamples(examples: GlobalConfigData['exampleStructures']) {
    const dbIds = UserRemoteDatabases.list().map(x => x.id);

    for (const id in BuiltInRemoteDatabases) {
        dbIds.push(id);
    }

    const valid = new Array<GlobalConfigData['exampleStructures'][0]>();
    for (const ex of examples) {
        if (dbIds.includes(ex.db) && isPdbId(ex.pdbId))
            valid.push(ex);
        else
            console.warn(`Example structure entry "${ex.pdbId}" from DB "${ex.db}" is invalid. Check the PDB ID and that it references a valid database.`);
    }

    return valid;
}

function makeExample(db: string, pdbId: string, handler: (db: string, pdbId: string) => void) {
    const _db = copyString(db);
    const _pdbId = copyString(pdbId);
    return <div key={`${_db}${_pdbId}`} className='rdo-example-structure' onClick={() => handler(_db, _pdbId)}>{_pdbId}</div>
}

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
                disabled={!this.props.ready}
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
        const examples = listOfValidExamples(GlobalConfig.data().exampleStructures);

        return (
            <div className='rdo-start-input-section'>
                <div className='rdo-start-input-section-caption'>Coordinates</div>

                <div
                    className='rdo-start-input-block'
                    style={{ gridTemplateColumns: '6em 1fr' }}
                >
                    <div className='rdo-strong rdo-talgn-right' style={ CoordsItemProps }>Source</div>
                    <div style={{ width: '100%' }}>
                        <ComboBox
                            value={this.props.database}
                            options={this.props.databaseOptions}
                            onChange={(db) => this.props.onDatabaseChange(db)}
                            innerStyle={{ fontSize: CoordsItemProps.fontSize, height: CoordsItemProps.height }}
                            sizing='auto'
                        />
                    </div>

                    {customFile
                        ? <>
                            <div style={ CoordsItemProps }>
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
                            <div style={{ fontSize: 'var(--font-large)', width: '100%', overflow: 'hidden', whiteSpace: 'nowrap' }}>{this.props.coordsFile?.name ?? '(Select mmCif/PDB file)'}</div>
                        </>
                        : <>
                            <div className='rdo-strong rdo-talgn-right' style={ CoordsItemProps }>PDB ID</div>
                            <PdbIdInput
                                pdbId={this.props.pdbId}
                                onChange={(v) => this.props.onPdbIdChange(v)}
                                onExecute={() => this.props.onRun()}
                            />
                        </>
                    }
                </div>

                {examples.length > 0
                    ? <div className='rdo-example-structures-list'>
                        <div className='rdo-strong'>Examples:</div>
                        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', columnGap: '1ex' }}>
                            {examples.map(x => makeExample(x.db, x.pdbId, this.props.onRunExample))}
                        </div>
                    </div>
                    : undefined
                }
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

        onRun: () => void;
        onRunExample: (db: string, pdbId: string) => void;
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

    private addedFiles(fillToRows: number) {
        const prefix = GlobalConfig.data().pathPrefix;
        const elems = new Array<JSX.Element>();
        const textCls = this.props.disabled ? 'rdo-text-disabled' : '';

        let idx = 0;
        for (; idx < this.props.files.length; idx++) {
            const f = this.props.files[idx];
            const _idx = idx;

            elems.push(
                <React.Fragment key={idx}>
                    <div className={textCls} style={{
                        fontSize: 'var(--font-large)',
                        overflow: 'hidden',
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                    }}>{f.file.name}</div>
                    <div style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
                        <div className={textCls} style={{ flex: 1, fontSize: 'var(--font-large)' }}>{NiceMapKinds[f.kind]}</div>
                        <div style={{ width: '2em' }}>
                            <IconButton
                                src={`${prefix}/imgs/x.svg`}
                                onClick={() => this.props.onRemoveFile(_idx)}
                                className='rdo-remove-icon-button'
                                classNameDisabled='rdo-remove-icon-button-disabled'
                                disabled={this.props.disabled}
                            />
                        </div>
                    </div>
                </React.Fragment>
            );
        }

        for (; idx < fillToRows; idx++) {
            elems.push(
                <React.Fragment key={idx}>
                    <div style={{ fontSize: 'var(--font-large)' }}>{'\u00A0'}</div>
                    <div style={{ fontSize: 'var(--font-large)' }}>{'\u00A0'}</div>
                </React.Fragment>
            );
        }

        return elems;
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
        const opts = this.fileTypeOptions();

        return (
            <div className='rdo-start-input-section'>
                <div className='rdo-start-input-section-caption'>Density maps</div>

                <FileInput
                    id='upload-density-map'
                    onChange={(e) => {
                        const file = e?.[0];
                        if (file && opts.length > 0) {
                            const df: DensityMapFile = { file, kind: this.state.selectedKind };
                            this.props.onAddFile(df);
                        }
                    }}
                    disabled={this.props.disabled}
                />
                <div
                    className='rdo-start-input-block'
                    style={{ gridTemplateColumns: '1fr 12em' }}
                >
                    {opts.length > 0
                        ? <label htmlFor='upload-density-map' style={{ display: 'flex', justifyContent: 'end', height: '100%' }}>
                            <DummyIconTextButton
                                src={`${prefix}/imgs/magnifying-glass.svg`}
                                caption='Browse'
                                disabled={this.props.disabled}
                            />
                        </label>
                        : <div />
                    }
                    <ComboBox
                        value={this.state.selectedKind}
                        options={opts}
                        onChange={(v) => this.setState({ ...this.state, selectedKind: v as AllowedDensityMapKinds })}
                        innerStyle={{ fontSize: 'var(--font-large)' }}
                        sizing='auto'
                        disabled={this.props.disabled}
                    />
                    {this.addedFiles(AllowedDensityMapKinds.length)}
                </div>
            </div>
        );
    }
}
namespace DensityMapFiles {
    export interface Props {
        disabled: boolean,
        files: DensityMapFile[],
        onAddFile: (file: DensityMapFile) => void,
        onRemoveFile: (idx: number) => void,
    }
}

class FileInput extends React.Component<{ id: string, onChange: (f: FileList | null) => void, disabled: boolean }> {
    static defaultProps = {
        disabled: false,
    };

    render() {
        return (
            <input
                id={this.props.id}
                className='rdo-input-file'
                type='file'
                onChange={(e) => this.props.onChange(e.currentTarget.files)}
                disabled={this.props.disabled}
            />
        );
    }
}

class PdbIdInput extends React.Component<{ pdbId: string, onChange: (v: string) => void, onExecute: () => void }> {
    render() {
        return (
            <input
                className='rdo-input-text'
                style={{ fontSize: CoordsItemProps.fontSize, height: CoordsItemProps.height, width: '100%', ...(!isPdbId(this.props.pdbId) ? { color: 'red' } : {})}}
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

    private actionPdbId(db: string, pdbId: string) {
        if (isPdbId(pdbId) && !!db)
            this.props.onDoPdbId(pdbId, db);
        else if (pdbId.length === 0) {
            Popup.create(
                <div className='rdo-error-text'>Please enter a valid PDB ID</div>
            );
        } else {
            Popup.create(
                <div className='rdo-error-text'>{`${pdbId} is not a valid PDB ID`}</div>
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
        const prefix = GlobalConfig.data().pathPrefix;

        return (
            <div className='rdo-section-column' style={{ height: '100%' }}>
                <BigLogo />
                <div className='rdo-offset' style={{ flex: 1 }}>
                    <ShadowedBox>
                        <div className='rdo-start-container'>
                            <div className='rdo-hflex' style={{ gap: 'var(--h-gap)' }}>
                                <div style={{ flex: 1 }}>
                                    <Coordinates
                                        coordsFile={this.state.coordsFile}
                                        database={this.state.database}
                                        databaseOptions={this.DatabaseOptions}
                                        pdbId={this.state.pdbId}
                                        onCoordsFileChange={(f) => this.setState({ ...this.state, coordsFile: f })}
                                        onDatabaseChange={(db) => this.setState({ ...this.state, database: db })}
                                        onPdbIdChange={(id) => this.setState({ ...this.state, pdbId: id })}
                                        onRun={() => this.actionPdbId(this.state.database, this.state.pdbId)}
                                        onRunExample={(db, pdbId) => this.actionPdbId(db, pdbId)}
                                    />
                                </div>

                                <div style={{ flex: 1 }}>
                                    <DensityMapFiles
                                        disabled={this.state.database !== ''}
                                        files={this.state.densityMaps}
                                        onAddFile={file => {
                                            this.state.densityMaps.push(file);
                                            this.setState({ ...this.state });
                                        }}
                                        onRemoveFile={idx => {
                                            this.state.densityMaps.splice(idx, 1);
                                            this.setState({ ...this.state });
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 128px 128px 1fr', gap: 'var(--h-gap)' }}>
                                <div />
                                <AnalyzeButton
                                    ready={this.props.dnatcofierState === 'ready'}
                                    onClick={() => {
                                        if (this.state.database)
                                            this.actionPdbId(this.state.database, this.state.pdbId)
                                        else
                                            this.actionCustomStructure();
                                    }}
                                />
                                <IconTextButton
                                    src={`${prefix}/imgs/reload.svg`}
                                    caption='Reset'
                                    onClick={() => this.setState({ ...this.defaultState() })}
                                    className='rdo-pushbutton rdo-pushbutton-border rdo-start-reset-button'
                                />
                                <div />
                            </div>
                            {this.props.dnatcofierState === 'initializing'
                                ? <div className='rdo-rednatco-state'>Please wait for {GlobalConfig.data().displayedProductName} to initialize...<InProgressSpinner /></div>
                                : this.props.dnatcofierState === 'failed'
                                    ? <div className='rdo-rednatco-state rdo-error-text' style={{ display: 'flex', gap: '1ex' }}>{GlobalConfig.data().displayedProductName} failed to initialize</div>
                                    : undefined
                            }
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
