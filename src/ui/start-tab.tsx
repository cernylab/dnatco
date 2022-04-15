import * as React from 'react';
import { BigLogo } from './big-logo';
import { ComboBox } from './common/combo-box';
import { Popup } from './common/popup';
import { DummyButton, PushButton } from './common/push-button';
import { ShadowedBox } from './common/shadowed-box';
import { SpinBox } from './common/spin-box';
import { NtC } from '../dnatco/ntc';
import { isPdbId } from '../util';

type Databases = 'RCSB-PDB' | 'PDB-REDO';
type SearchRedundacy = 'non-redundant' | 'all';

const DatabaseOptions = [
    { value: 'RCSB-PDB', caption: 'RSCB-PDB' },
    { value: 'PDB-REDO', caption: 'PDB-REDO' },
];
const NtCOptions = NtC.Conformers.map(cfrm => { return { value: cfrm, caption: cfrm } });
const SearchLimitHard = 500;
const SearchRedundancyOptions = [
    { value: 'non-redundant', caption: 'Non-redundant' },
    { value: 'all', caption: 'All' },
];

interface State {
    coordsFile: File|null;
    densityMapFile: File|null;
    database: Databases;
    pdbId: string;
    searchLargeStructures: boolean;
    searchLimit: number;
    searchNtC: NtC.Conformer;
    searchRedundany: SearchRedundacy;
}

export class StartTab extends React.Component<StartTab.Props, State> {
    constructor(props: StartTab.Props) {
        super(props);

        this.state = {
            coordsFile: null,
            database: 'RCSB-PDB',
            densityMapFile: null,
            pdbId: '',
            searchLimit: 200,
            searchLargeStructures: false,
            searchNtC: 'AA00',
            searchRedundany: 'non-redundant',
        };
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
                                    Enter PDB ID (e. g. 1bna)
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
                                    />
                                    <ComboBox
                                        options={DatabaseOptions}
                                        value={this.state.database}
                                        onChange={v => this.setState({ ...this.state, database: v as Databases })}
                                    />
                                    <PushButton
                                        caption='Proceed'
                                            onClick={() => {
                                                if (isPdbId(this.state.pdbId)) {
                                                    Popup.create(
                                                        <div className='rdo-error-text'>This function is currently unavailable</div>
                                                    );
                                                    //this.props.onDoPdbId(this.state.pdbId);
                                                } else if (this.state.pdbId.length === 0) {
                                                    Popup.create(
                                                        <div className='rdo-error-text'>Please enter a valid PDB ID</div>
                                                    );
                                                } else {
                                                    Popup.create(
                                                        <div className='rdo-error-text'>{`${this.state.pdbId} is not a valid PDB ID`}</div>
                                                    );
                                                }
                                        }}
                                    />
                                    <div></div>
                                </div>
                            </div>
                        </ShadowedBox>
                        <ShadowedBox>
                            <div className='rdo-offset'>
                                <div className='rdo-section-caption'>
                                    Custom structure
                                </div>
                                <div style={{ alignItems: 'center', display: 'flex', gap: 'var(--h-gap)', justifyContent: 'center' }}>
                                    <div style={{
                                        alignItems: 'center',
                                        columnGap: 'var(--h-gap)',
                                        display: 'grid',
                                        gridTemplateColumns: 'auto auto',
                                        rowGap: 'var(--v-gap)',
                                    }}>
                                        <div>Coordinates (PDB or CIF)</div>
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

                                        <div>Electron density map (optional)</div>
                                        <div style={{ alignItems: 'center', display: 'flex', gap: 'var(--h-gap)' }}>
                                            <label className='rdo-file-upload' htmlFor='upload-density-map-file'>
                                                <DummyButton caption='Browse...' />
                                            </label>
                                            <div>{this.state.densityMapFile!== null ? this.state.densityMapFile.name : 'No file selected'}</div>
                                            <input
                                                id='upload-density-map-file'
                                                className='rdo-input-file'
                                                type='file'
                                                onChange={e => {
                                                    const file = (e.currentTarget.files ? e.currentTarget.files[0] : null);
                                                    this.setState({ ...this.state, densityMapFile: file });
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <PushButton
                                        caption='Proceed'
                                        enabled={this.state.coordsFile !== null}
                                        onClick={() => {
                                            if (this.state.coordsFile) {
                                                this.props.onDoCustomStructure(this.state.coordsFile, this.state.densityMapFile).then(error => {
                                                    if (error !== undefined) {
                                                        Popup.create(
                                                            <>
                                                                <div className='rdo-error-text'>Cannot process custom structure</div>
                                                                <div className='rdo-error-text'>{error}</div>
                                                             </>
                                                        );
                                                    }
                                                });
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </ShadowedBox>
                    </div>
                    <div style={{ display: 'flex' }}>
                        <ShadowedBox>
                            <div className='rdo-offset' style={{ alignItems: 'center', display: 'flex', justifyContent: 'center' }}>
                                Return up to{'\u00A0'}
                                <SpinBox
                                    min={1}
                                    max={SearchLimitHard}
                                    step={1}
                                    onChange={v => this.setState({ ...this.state, searchLimit: v })}
                                    value={this.state.searchLimit}
                                />{'\u00A0'}
                                random{'\u00A0'}
                                <ComboBox
                                    options={NtCOptions}
                                    value={this.state.searchNtC}
                                    onChange={v => this.setState({ ...this.state, searchNtC: v })}
                                />{'\u00A0'}
                                steps
                                in{'\u00A0'}
                                <ComboBox
                                    options={SearchRedundancyOptions}
                                    value={this.state.searchRedundany}
                                    onChange={v => this.setState({ ...this.state, searchRedundany: v as SearchRedundacy })}
                                />{'\u00A0'}
                                PDB structures
                                (<input
                                    id='search-large-structures'
                                    className='rdo-input-checkbox'
                                    type='checkbox'
                                    checked={this.state.searchLargeStructures}
                                    onChange={e => this.setState({ ...this.state, searchLargeStructures: e.currentTarget.checked })}
                                 />
                                 <label htmlFor='search-large-structures'>include large structures</label>)
                                {'\u00A0'}
                                <PushButton
                                    caption='Search'
                                    onClick={() => {}}
                                />
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
        onDoPdbId: (pdbId: string) => Promise<string|undefined>;
        onDoCustomStructure: (coordsFile: File, densityMapFile: File|null) => Promise<string|undefined>;
        onDoRawLink: (link: string) => Promise<string|undefined>;
    }
}
