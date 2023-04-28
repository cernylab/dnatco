import React from 'react';
import { DownloadButton } from './common';
import { Downloads as _Downloads } from './downloads-common';
import { EquiBox } from '../common/equibox';
import { ShadowedBox } from '../common/shadowed-box';
import { SerializeByCompound, SerializeByResidue } from '../../dnatco/angles-lengths/serialize';
import { Summarize } from '../../dnatco/angles-lengths/summarize';
import { Dnatcofication } from '../../dnatco/dnatcofication';
import { Naval } from '../../dnatco/naval';
import { objKeys } from '../../util';
import { doDownload, FileTypes } from '../../util/downloader';
import { Net } from '../../util/net';
import { Serialization } from '../../util/serialization';

function downloadAnglesLengthsByCompound(structureName: string, fileType: keyof typeof FileTypes, d: Dnatcofication) {
    const multipleModels = Dnatcofication.Structure.numberOfModels(d) > 1;
    const data = d.data.almByCompound.models.get(multipleModels ? -1 : d.data.structures[0].models[0].num);
    if (!data)
        return;

    const countsAngles = Summarize.countsInGroups(data.overallAngles);
    const countsLengths = Summarize.countsInGroups(data.overallLengths);

    const angles = objKeys(data.angles).flatMap((k) => Array.from(data.angles[k].byMetric.values()).map((x) => x.individual));
    const lengths = objKeys(data.lengths).flatMap((k) => Array.from(data.lengths[k].byMetric.values()).map((x) => x.individual));

    const text = fileType === 'csv'
        ? SerializeByCompound.toCsv(angles, countsAngles, lengths, countsLengths)
        : SerializeByCompound.toJson(angles, countsAngles, lengths, countsLengths);

    doDownload(`${structureName}_angles_lengths_by_compound`, text, FileTypes[fileType]);
}

function downloadAnglesLengthsByResidue(structureName: string, fileType: keyof typeof FileTypes, d: Dnatcofication) {
    const residues = d.data.almByResidue.residues;
    const summary = Summarize.substructure(residues);

    const countsAngles = Summarize.countsInGroups(summary.angles);
    const countsLenghts = Summarize.countsInGroups(summary.lengths);
    const text = fileType === 'csv'
        ? SerializeByResidue.toCsv(countsAngles, countsLenghts, residues, d.data.almByResidue.stats)
        : SerializeByResidue.toJson(countsAngles, countsLenghts, residues, d.data.almByResidue.stats);

    doDownload(`${structureName}_angles_lengths_by_residue`, text, FileTypes[fileType]);
}

function DownloadBox(props: { children: JSX.Element[] | JSX.Element }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'row', height: '2em' }}>
            <EquiBox
                padding={0}
                orientation='row'
                gap='var(--h2-gap)'
            >
                {props.children}
            </EquiBox>
            <div style={{ flex: 1 }} />
        </div>
    );
}

function Title(props: { title: string }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'row', gap: 'var(--h-gap)' }}>
            <div className='rdo-download-item-caption'>{props.title}</div>
        </div>
    );
}

export function Downloads(props: { dnatcofication: Dnatcofication }) {
    const structureName = props.dnatcofication.identifyingName ?? props.dnatcofication.pdbId;

    return (
        <div className='rdo-offset'>
            <ShadowedBox>
                <div style={{
                    fontSize: 'var(--font-xxlarge)',
                    fontWeight: 'bold',
                    textAlign: 'center',
                }}>
                    Download of data computed for {structureName}
                </div>
                <div style={{ margin: 'auto', maxWidth: '60em' }}>

                    <div className='rdo-line-spacer' />

                    <div className='rdo-download-item'>
                        <Title title='Extended mmCIF file' />
                        <div>
                            mmCIF file extended with additional DNATCO categories.
                        </div>
                        <DownloadBox>
                            <DownloadButton
                                caption='Download'
                                onClick={() => _Downloads.serveMmCif(props.dnatcofication)}
                            />
                        </DownloadBox>
                    </div>

                    <div className='rdo-download-item'>
                        <Title title='Table of assigned NtCs' />
                        <div>
                            Table of assigned NtCs.
                        </div>
                        <DownloadBox>
                            <DownloadButton
                                caption='CSV'
                                onClick={() => {
                                    const t = _Downloads.assignmentTable(props.dnatcofication);
                                    const text = Serialization.table(t, 'csv');
                                    Net.serveFile(FileTypes.csv.mimeType, text, `${props.dnatcofication.identifyingName}_assigned_ntcs.${FileTypes.csv.suffix}`);
                                }}
                            />
                            <DownloadButton
                                caption='JSON'
                                onClick={() => {
                                    const t = _Downloads.assignmentTable(props.dnatcofication);
                                    const text = Serialization.table(t, 'json');
                                    Net.serveFile(FileTypes.json.mimeType, text, `${props.dnatcofication.identifyingName}_assigned_ntcs.${FileTypes.json.suffix}`);
                                }}
                            />
                        </DownloadBox>
                    </div>

                    <div className='rdo-download-item'>
                        <Title title='List of bond lengths and angles (grouped by residues)' />
                        <div>
                            A list of measured bond lengths and bond angles measured for nucleic acid backbone and base atoms. Grouped by residue. Only residues with standard bases are measured.
                        </div>
                        <DownloadBox>
                            <DownloadButton
                                caption='CSV'
                                onClick={() => downloadAnglesLengthsByResidue(structureName, 'csv', props.dnatcofication)}
                            />
                            <DownloadButton
                                caption='JSON'
                                onClick={() => downloadAnglesLengthsByResidue(structureName, 'json', props.dnatcofication)}
                            />
                        </DownloadBox>
                    </div>

                    <div className='rdo-download-item'>
                        <Title title='List of bond lengths and angles (grouped by bases)' />
                        <div>
                            A list of measured bond lengths and bond angles measured for nucleic acid backbone and base atoms. Grouped by bases. Only residues with standard bases are measured.
                        </div>
                        <DownloadBox>
                            <DownloadButton
                                caption='CSV'
                                onClick={() => downloadAnglesLengthsByCompound(structureName, 'csv', props.dnatcofication)}
                            />
                            <DownloadButton
                                caption='JSON'
                                onClick={() => downloadAnglesLengthsByCompound(structureName, 'json', props.dnatcofication)}
                            />
                        </DownloadBox>
                    </div>

                    <div className='rdo-download-item'>
                        <Title title='Naval validation reports' />
                        <div>
                            Naval validation reports of nucleic acid structure quality
                        </div>
                        <DownloadBox>
                            <DownloadButton
                                caption='Bond lengths'
                                onClick={() => Net.serveFile(
                                    FileTypes.csv.mimeType,
                                    Naval.bondsAsCsv(props.dnatcofication.data.naval.bonds, ','),
                                    `${structureName}_naval_bonds_report.csv`
                                )}
                            />
                            <DownloadButton
                                caption='Bond angles'
                                onClick={() => Net.serveFile(
                                    FileTypes.csv.mimeType,
                                    Naval.anglesAsCsv(props.dnatcofication.data.naval.angles, ','),
                                    `${structureName}_naval_angles_report.csv`
                                )}
                            />
                            <DownloadButton
                                caption='Geometry'
                                onClick={() => Net.serveFile(
                                    FileTypes.csv.mimeType,
                                    Naval.geometryAsCsv(props.dnatcofication.data.naval.geometry, ','),
                                    `${structureName}_naval_geometry_report.csv`
                                )}
                            />
                        </DownloadBox>
                    </div>
                </div>
            </ShadowedBox>
        </div>
    );
}
