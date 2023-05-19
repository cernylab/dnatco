import { type PlotData } from 'plotly.js';
import React from 'react';
import { Common, DownloadButton } from './common';
import { Downloads as _Downloads } from './downloads-common';
import { RsccPlot } from './rscc-plot';
import { modelOptions } from './views/structure-selectors';
import { ComboBox } from '../common/combo-box';
import { EquiBox } from '../common/equibox';
import { InProgressSpinner } from '../common/in-progress-spinner';
import { Popup } from '../common/popup';
import { ShadowedBox } from '../common/shadowed-box';
import { toComboBoxOptions } from '../util';
import { SerializeByCompound, SerializeByResidue } from '../../dnatco/angles-lengths/serialize';
import { isOk } from '../../dnatco';
import { Summarize } from '../../dnatco/angles-lengths/summarize';
import { Dnatcofication } from '../../dnatco/dnatcofication';
import { Naval } from '../../dnatco/naval';
import { Rscc } from '../../dnatco/rscc';
import { Report } from '../../report';
import { objKeys } from '../../util';
import { doDownload, FileTypes } from '../../util/downloader';
import { Net } from '../../util/net';
import { ImageSerialization } from '../../util/image-serialization';
import { Serialization } from '../../util/serialization';
import { GlobalConfig } from '../../global-config';

async function checkRsccRmsdAvailability(d: Dnatcofication) {
    const availability = new Array<{ assigned: boolean, unassigned: boolean }>();

    for (let mIdx = 0; mIdx < d.data.structures[0].models.length; mIdx++) {
        // Hopefully the browser will cache the RsccList that may have
        // to be fetched from a remote source.

        const res = await Rscc.structureRscc(d, mIdx);
        if (!isOk(res)) {
            availability.push({ assigned: false, unassigned: false });
        } else {
            availability.push({ assigned: res.data.assigned.length > 0, unassigned: res.data.unassigned.length > 0})
        }
    }

    return availability;
}

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

async function downloadRsccPlot(kind: 'assigned' | 'unassinged', structureName: string, modelIndex: number, d: Dnatcofication) {
    const rqKinds = RsccPlot.requestedKinds(modelIndex, d);

    const struRsccReq = Rscc.structureRscc(d, modelIndex);
    const backdropReq = kind === 'assigned' ? Rscc.backdropRscc(rqKinds.assigned) : Rscc.backdropRscc(rqKinds.unassigned);

    const struRsccRes = await struRsccReq;
    const backdropRes = await backdropReq;

    if (!isOk(struRsccRes)) {
        Popup.create(
            <div>
                <div className='rdo-error-text'>Cannot fetch RSCC data for the structure</div>
                <div className='rdo-error-text'>{struRsccRes.message}</div>
            </div>
        );
        return;
    }
    if (!isOk(backdropRes)) {
        Popup.create(
            <div>
                <div className='rdo-error-text'>Cannot fetch RSCC backdrop for the structure</div>
                <div className='rdo-error-text'>{backdropRes.message}</div>
            </div>
        );
        return;
    }

    const struData = kind === 'assigned' ? struRsccRes.data.assigned : struRsccRes.data.unassigned;
    const backdropData = backdropRes.data;
    const plotData = RsccPlot.makeData(struData, backdropData, void 0, d);

    if (RsccPlot.isPlotEmpty(plotData)) {
        Popup.create(
            <div className='rdo-error-text'>{`No ${kind} RSCC data is available for this structure`}</div>
        );
        return;
    }

    const layout = {
        title: `${structureName} ${kind}`,
        xaxis: { title: 'RSCC', automargin: true },
        yaxis: { title: 'RMSD [Å]', automargin: true },
        plot_bgcolor: 'white',
        paper_bgcolor: 'white',
    };

    const plotlyData = RsccPlot.makePlotlyData(plotData.xy, plotData.contour, true, false) as PlotData[];
    const img = await ImageSerialization.toImage(plotlyData, layout, 1000, 1000, 'svg');
    doDownload(`${structureName}_rscc_rmsd_${kind}`, img, FileTypes.svgXml);
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

function RsccRmsdDownload(props: { d: Dnatcofication, structureName: string }) {
    const [availability, setAvailability] = React.useState<Array<{ assigned: boolean, unassigned: boolean }>>([]);
    const [modelIndex, setModelIndex] = React.useState('0');

    React.useEffect(() => {
        checkRsccRmsdAvailability(props.d).then((avail) => {
            setAvailability(avail);
        });
    }, []);

    if (availability.length === 0) {
        return <div style={{ alignContent: 'center', display: 'flex', flexDirection: 'row', gap: 'var(--h-gap)' }}>Checking availability... <InProgressSpinner /> </div>;
    } else {
        const mIdx = parseInt(modelIndex);
        const haveAssigned = availability[mIdx].assigned;
        const haveUnassigned = availability[mIdx].unassigned;

        return (
            <DownloadBox>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                    <div className='rdo-strong'>Model</div>
                </div>
                <ComboBox
                    options={toComboBoxOptions(
                        modelOptions(props.d, true),
                        (o) => ({ caption: o.name, value: o.index.toString() })
                    )}
                    value={modelIndex}
                    onChange={(v) => setModelIndex(v)}
            />
            {
                haveAssigned
                    ? <DownloadButton
                        caption='Assigned NtCs'
                        onClick={() => downloadRsccPlot('assigned', props.structureName, parseInt(modelIndex), props.d)}
                        />
                    : <div style={{ whiteSpace: 'nowrap' }}>(No assigned NtCs)</div>
            }
            {
                haveUnassigned
                    ? <DownloadButton
                        caption='Unassigned NtCs'
                        onClick={() => downloadRsccPlot('unassinged', props.structureName, parseInt(modelIndex), props.d)}
                    />
                    : <div style={{ whiteSpace: 'nowrap' }}>(No unassigned NtCs)</div>
            }
            </DownloadBox>
        );
    }
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
                <div style={ Common.VScrollJail }>
                    <div style={{
                        fontSize: 'var(--font-xxlarge)',
                        fontWeight: 'bold',
                        textAlign: 'center',
                    }}>
                        Download of data computed for {structureName}
                    </div>
                    <div className='rdo-scroll-vertically' style={{ margin: 'auto', maxWidth: '60em', padding: 'var(--h-gap)' }}>

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
                                        `${structureName}_naval_bonds_report.${FileTypes.csv.suffix}`
                                    )}
                                />
                                <DownloadButton
                                    caption='Bond angles'
                                    onClick={() => Net.serveFile(
                                        FileTypes.csv.mimeType,
                                        Naval.anglesAsCsv(props.dnatcofication.data.naval.angles, ','),
                                        `${structureName}_naval_angles_report.${FileTypes.csv.suffix}`
                                    )}
                                />
                                <DownloadButton
                                    caption='Geometry'
                                    onClick={() => Net.serveFile(
                                        FileTypes.csv.mimeType,
                                        Naval.geometryAsCsv(props.dnatcofication.data.naval.geometry, ','),
                                        `${structureName}_naval_geometry_report.${FileTypes.csv.suffix}`
                                    )}
                                />
                            </DownloadBox>
                        </div>

                        <div className='rdo-download-item'>
                            <Title title='RSCC vs. RMSD plots' />
                            <div>
                                RSCC vs. RMSD plots
                            </div>
                            <RsccRmsdDownload
                                structureName={structureName}
                                d={props.dnatcofication}
                            />
                        </div>

                        <div className='rdo-download-item'>
                            <Title title={`${GlobalConfig.data().displayedProductName} structure validation report`} />
                            <div>
                                Comprehensive structure validation report
                            </div>
                            <DownloadBox>
                                <DownloadButton
                                    caption='Download (PDF)'
                                    onClick={() => {
                                        Report.pdf(props.dnatcofication).then((report) => {
                                            Net.serveFileRaw(FileTypes.pdf.mimeType, report, `validation_report.${FileTypes.pdf.suffix}`);
                                        }).catch(e => {
                                            Popup.create(
                                                <div className='rdo-error-text'>
                                                    Could not create validation report: {(e as Error).message}
                                                </div>
                                            );
                                        })
                                    }}
                                />
                                <DownloadButton
                                    caption='Download (Plain text)'
                                    onClick={() => {
                                        Report.text(props.dnatcofication).then((report) => {
                                            Net.serveFile(FileTypes.text.mimeType, report, `validation_report.${FileTypes.text.suffix}`);
                                        }).catch(e => {
                                            Popup.create(
                                                <div className='rdo-error-text'>
                                                    Could not create validation report: {(e as Error).message}
                                                </div>
                                            );
                                        });
                                    }}
                                />
                            </DownloadBox>
                        </div>
                    </div>
                </div>
            </ShadowedBox>
        </div>
    );
}
