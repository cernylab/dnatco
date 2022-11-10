import * as React from 'react';
import { BigLogo } from './big-logo';
import { ComboBox } from './common/combo-box';
import { Popup } from './common/popup';
import { DummyButton, PushButton } from './common/push-button';
import { ShadowedBox } from './common/shadowed-box';
import { SupportedRemoteDatabases } from '../dnatco/remote-databases';
import { Search } from '../search/search';
import { isPdbId } from '../util';

const DatabaseOptions = [
    { value: 'rcsb', caption: 'RSCB-PDB' },
    { value: 'redo', caption: 'PDB-REDO' },
];

interface State {
    coordsFile: File|null;
    densityMapFile: File|null;
    database: SupportedRemoteDatabases;
    pdbId: string;
}

export class StartTab extends React.Component<StartTab.Props, State> {
    constructor(props: StartTab.Props) {
        super(props);

        this.state = {
            coordsFile: null,
            database: 'rcsb',
            densityMapFile: null,
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
                                        if (this.props.dnatcofierReady)
                                            this.props.onDoPdbId('1bna', 'rcsb')}
                                    }>1bna</span>)
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
                                        options={DatabaseOptions}
                                        value={this.state.database}
                                        onChange={v => this.setState({ ...this.state, database: v as SupportedRemoteDatabases })}
                                    />
                                    <PushButton
                                        caption='Proceed'
                                        onClick={() => this.actionPdbId()}
                                        enabled={this.props.dnatcofierReady}
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
                                        enabled={this.state.coordsFile !== null && this.props.dnatcofierReady}
                                        onClick={() => {
                                            if (this.state.coordsFile)
                                                this.props.onDoCustomStructure(this.state.coordsFile, this.state.densityMapFile);
                                        }}
                                    />
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
        onDoPdbId: (pdbId: string, db: SupportedRemoteDatabases) => void,
        onDoCustomStructure: (coordsFile: File, densityMapFile: File|null) => void,
        onDoRawLink: (link: string) => void,
        onDoSearchConformers: (options: Search.Criteria) => void,
        dnatcofierReady: boolean;
    }
}
