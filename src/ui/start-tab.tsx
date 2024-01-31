import React from 'react';
import { ComboBox } from './common/combo-box';
import { DummyIconTextButton, IconButton, IconTextButton } from './common/push-button';
import { Popup } from './common/popup';
import { Tooltip } from './common/tooltip';
import { Common } from './dnatco/common';
import { MagnifyingGlassImg, MediaPlayImg, XImg, DnaLeft, DnaRight, Density, NavalAform, Contacts } from '../assets/images';
import { DensityMap, DensityMapKinds } from '../dnatco/density-map';
import { Logger } from '../log/logger';
import { BuiltInRemoteDatabases, UserRemoteDatabases } from '../remote/db/register';
import { copyString, isPdbId, toPdbId } from '../util';
import { GlobalConfig, GlobalConfigData } from '../global-config';
import { ComboBoxHome } from './common/combo-box-home';

const AllowedDensityMapKinds = [...DensityMapKinds, 'coefficients'] as const;
type AllowedDensityMapKinds = typeof AllowedDensityMapKinds[number];
type DensityMapFile = { file: File, kind: AllowedDensityMapKinds };

function listOfValidExamples(examples: GlobalConfigData['exampleStructures']) {
    const dbIds = UserRemoteDatabases.list().map(x => x.id);

    for (const id in BuiltInRemoteDatabases) {
        dbIds.push(id);
    }

    const valid = new Array<GlobalConfigData['exampleStructures'][0]>();
    for (const ex of examples) {
        if (dbIds.includes(ex.db) && isPdbId(ex.pdbId, true))
            valid.push(ex);
        else
            Logger.log(Logger.Severity.Warning, `Example structure entry "${ex.pdbId}" from DB "${ex.db}" is invalid. Check the PDB ID is valid and that it references a valid database.`);
    }

    return valid;
}

function makeExample(db: string, pdbId: string, name: string | undefined, handler: (db: string, pdbId: string) => void) {
    const _db = copyString(db);
    const _pdbId = copyString(pdbId);
    return <div key={`${_db}${_pdbId}`} className='rdo-example-structure' onClick={() => handler(_db, _pdbId)}>{name ?? _pdbId}</div>
}

const NiceMapKinds: Record<AllowedDensityMapKinds, string> = {
    'fo-fc': 'Fo-Fc',
    '2fo-fc': '2Fo-Fc',
    'em': 'EM',
    'coefficients': 'Map coefficients',
} 

class AnalyzeButton extends React.Component<{ ready: boolean, onClick: () => void }> {
    render() {
        return (
            <IconTextButton
                src={MediaPlayImg}
                caption='Analyze'
                onClick={() => this.props.onClick()}
                disabled={!this.props.ready}
                className='items-center flex justify-center transition-all ease-in-out w-full bg-primary-first text-16px text-secondary-first rounded-standart p-2 hover:bg-secondary-second'
                classNameDisabled='items-center flex justify-center rounded-standart w-full p-2 text-16px bg-primary-first-disabled text-white'
            />
        );
    }
}

class Coordinates extends React.Component<Coordinates.Props> {
    render() {
        const customFile = !this.props.database;
        const examplesTab = !this.props.databaseOptions;
        const examples = listOfValidExamples(GlobalConfig.data().exampleStructures);

        return (
            <div className='mx-auto'>
                <div className='text-40px font-din-2014 text-center tracking-wider mb-4'>Analyze your structure</div>
                <div className='flex flex-col w-[430px] m-auto'>
                    <div className='flex mb-2'>
                        <div className='font-din-2014 text-24px text-primary-first w-[155px] my-auto'>Select</div>
                        <div className='w-300px rounded-standart'>
                            <ComboBoxHome
                                value={this.props.database}
                                options={this.props.databaseOptions}
                                onChange={(db) => this.props.onDatabaseChange(db)}
                            />
                        </div>
                    </div>

                    {customFile
                        ? <>
                            <div className='flex'>
                                <div className='flex flex-col mb-2'>
                                    <div className='flex'>
                                        <div className='font-din-2014 text-24px w-[147px] my-auto'>Coordinates</div>
                                        <label htmlFor='upload-coords-file' className='flex justify-end h-full'>
                                            <div className='w-[8.6rem]'>
                                                <DummyIconTextButton
                                                    src={MagnifyingGlassImg}
                                                    caption='Browse'
                                                />
                                            </div>
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
                                    </div>
                                    {this.props.coordsFile
                                        ? <LongFileName name={this.props.coordsFile.name} disabled={false} />
                                        : <></>
                                    }
                                </div>
                            </>
                            : <>
                            <div className='flex'>
                                <div className='font-din-2014 text-24px text-primary-first w-[155px] my-auto'>PDB ID</div>
                                <div className='w-300px rounded-standart'>
                                    <PdbIdInput
                                        pdbId={this.props.pdbId}
                                        onChange={(v) => this.props.onPdbIdChange(v)}
                                        onExecute={() => this.props.onRun()}
                                    />
                                </div>
                            </div>
                        </>
                    }
                    {examplesTab
                        ? 
                        <>
                            {examples.length > 0
                                    ? <div className='rdo-example-structures-list' style={{ gridColumn: '1 / span 2' }}>
                                    <div className='font-700'>Examples:</div>
                                    <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', columnGap: '1ex' }}>
                                        {examples.map(x => makeExample(x.db, x.pdbId, x.name, this.props.onRunExample))}
                                    </div>
                                </div>
                                : <div className='rdo-example-structures-list' style={{ gridColumn: '1 / span 2' }} />
                            }
                        </>
                        : null
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
        const elems = new Array<JSX.Element>();
        const textCls = this.props.disabled ? 'rdo-text-disabled' : '';

        let idx = 0;
        for (; idx < this.props.files.length; idx++) {
            const f = this.props.files[idx];
            const _idx = idx;

            elems.push(
                <React.Fragment key={idx}>
                    <LongFileName name={f.file.name} disabled={this.props.disabled} />
                    <div className='flex w-full'>
                        <div className={textCls} style={{ flex: 1, fontSize: 'var(--font-large)' }}>{NiceMapKinds[f.kind]}</div>
                        <div style={{ width: '2em' }}>
                            <IconButton
                                src={XImg}
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
        const opts = this.fileTypeOptions();
        const addedFiles = this.addedFiles(AllowedDensityMapKinds.length);

        return (
                <div className='flex'>
                    <div className='flex'>
                        <div className='font-din-2014 text-24px mb-4 w-[147px]'>Density maps</div>
                        <div>
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
                            <div className='flex'>
                                <div className='hidden'>
                                    {addedFiles}
                                </div>
                                {opts.length > 0
                                    ? <label htmlFor='upload-density-map' className='flex justify-end h-full'>
                                        <div className='w-[8.6rem] mr-2'>
                                            <DummyIconTextButton
                                                src={MagnifyingGlassImg}
                                                caption='Browse'
                                                disabled={this.props.disabled}
                                            />
                                        </div>
                                    </label>
                                    : <div />
                                }
                                <div className='w-[8.6rem]'>
                                    <ComboBox
                                        value={this.state.selectedKind}
                                        options={opts}
                                        onChange={(v) => this.setState({ ...this.state, selectedKind: v as AllowedDensityMapKinds })}
                                        innerStyle={{ fontSize: 'var(--font-large)' }}
                                        sizing='auto'
                                        disabled={this.props.disabled}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
            {this.props.files.length === 0 && this.props.disabled
                ? <div
                    className='rdo-text-disabled'
                    style={{
                        fontSize: 'var(--font-large)',
                        padding: '0 var(--h-gap) 0 var(--h-gap)',
                        position: 'absolute',
                        width: '100%',
                        textAlign: 'center',
                        top: '50%',
                    }}
                >
                    Density maps can be used only with structures from custom files
                </div>
                : undefined
            }
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

class LongFileName extends React.Component<{ name: string, disabled: boolean }> {
    render() {
        return (
            <Tooltip
                display='block'
                overflow='hidden'
                tag={
                    <span>
                        <span
                            className={this.props.disabled ? 'rdo-text-disabled' : '' }
                            style={{
                                fontSize: 'var(--font-large)',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                            }}
                        >{this.props.name}</span>
                        <div className='w-20 h-full'/>
                    </span>
                }
            >
                {this.props.name}
            </Tooltip>
        );
    }
}

class PdbIdInput extends React.Component<{ pdbId: string, onChange: (v: string) => void, onExecute: () => void }> {
    render() {
        return (
            <input
                className='bg-primary-first placeholder:text-white text-white rounded-standart p-4 w-full items-center flex'
                style={{
                    ...(!isPdbId(this.props.pdbId, true) && this.props.pdbId.length > 0 ? { color: '#FF7973' } : {})
                }}
                type='text'
                value={this.props.pdbId}
                onChange={(v) => {
                    const text = v.currentTarget.value;
                    if (text.length <= 12)
                        this.props.onChange(v.currentTarget.value);
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

        this.state = { 
            ...this.defaultState() 
        };
    }

    private actionCustomStructure() {
        if (!this.state.coordsFile) {
            Popup.create(
                <div className='text-secondary-third'>You have not set any coordinates file</div>
            );
            return;
        }

        const densityMaps = this.state.densityMaps.filter(x => x.kind !== 'coefficients') as { file: File, kind: DensityMap['kind'] }[];
        const densityMapCoeffs = this.state.densityMaps.find(x => x.kind === 'coefficients')?.file ?? null;

        this.props.onDoCustomStructure(this.state.coordsFile!, densityMaps, densityMapCoeffs);
    }

    private actionPdbId(db: string, pdbId: string) {
        if (!db) {
            Popup.create(
                <div className='text-secondary-third'>No database is selected</div>
            );
        }

        try {
            const _pdbId = toPdbId(pdbId);
            this.props.onDoPdbId(_pdbId, db);
        } catch (e) {
            if (pdbId.length === 0) {
                Popup.create(
                    <div className='text-secondary-third'>Please enter a valid PDB ID</div>
                );
            } else {
                Popup.create(
                    <div className='text-secondary-third'>{`${pdbId} is not a valid PDB ID`}</div>
                );
            }
        }
    }

    private defaultState(): State {
        return {
            coordsFile: null,
            database: this.DatabaseOptions.find(x => x.value === GlobalConfig.data().primaryDatabase)?.value ?? this.DatabaseOptions[0].value,
            densityMaps: [],
            pdbId: '',
        }
    }
      
      render() {

        return (
            <>
                <div className='flex flex-col h-full overflow-y-hidden'>
                    <div className='hidden select-none xl:block xl:absolute xl:top-[-1rem] xl:left-0 xl:w-[20%] xl:-z-[1]'>
                        <img src={DnaLeft} alt='DNA'/>
                    </div>
                    <div className='hidden select-none xl:block xl:absolute xl:top-14 xl:right-0 xl:w-[24%] xl:-z-[1]'>
                        <img src={DnaRight} alt='DNA'/>
                    </div>
                    <div>
                        <div className='hidden floating select-none xl:block xl:absolute xl:top-0 xl:right-0 xl:z-50 xl:w-[16%] xl:mt-[24%] xl:mr-[19%]'>
                            <img src={Density} alt='Density' />
                        </div>
                        <div className='hidden floating select-none xl:block xl:absolute xl:top-0 xl:left-0 xl:z-50 xl:w-[16%] xl:mt-[17%] xl:ml-[19%]'>
                            <img src={NavalAform} alt='Naval aform' />
                        </div>
                        <div className='hidden floating select-none xl:block xl:absolute xl:top-0 xl:left-0 xl:z-50 xl:w-[10%] xl:mt-[32%] xl:ml-[23%]'>
                            <img src={Contacts} alt='Contacts' />
                        </div>
                    </div>
                    <div style={ Common.VScrollJail }>
                        <div className='rdo-offset'>
                                <div className='mt-[7%]'>
                                    <div className='text-42px w-[720px] m-auto text-center leading-10 font-din-condensed font-regular'><span className='text-secondary-first uppercase text-42px stroke'>Dnatco</span> enables an in-depth analysis and validation of nucleic acid structures</div>
                                    <div className='mt-10 max-w-[850px] m-auto'>
                                        <div className='flex flex-col justify-center'>
                                            <div>
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

                                            {this.state.database === ''
                                                ?
                                                    <div className='mx-auto w-[430px]'>
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
                                                : undefined
                                            }
                                        </div>
                                        <div className='w-[430px] mx-auto'>
                                            <div className='flex mt-2'>
                                                <AnalyzeButton
                                                    ready={this.props.dnatcofierState === 'ready'}
                                                    onClick={() => {
                                                        if (this.state.database)
                                                            this.actionPdbId(this.state.database, this.state.pdbId)
                                                        else
                                                            this.actionCustomStructure();
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {this.props.dnatcofierState === 'initializing'
                                        ? <div className='flex flex-row items-center'>
                                            <div className='text-16px m-auto'>Please wait for {GlobalConfig.data().displayedProductName} to initialize...</div>
                                        </div>
                                        : this.props.dnatcofierState === 'failed'
                                            ? <div className='text-16px m-auto flex text-secondary-third'>{GlobalConfig.data().displayedProductName} failed to initialize</div>
                                            : undefined
                                    }
                                </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }
}

export namespace StartTab {
    export interface Props {
        onDoPdbId: (pdbId: string, db: string) => void,
        onDoCustomStructure: (coordsFile: File, densityMaps: { file: File, kind: DensityMap['kind'] }[], densityMapCoeffs: File|null) => void,
        onDoRawLink: (link: string) => void,
        dnatcofierState: 'ready' | 'initializing' | 'failed';
    }
}
