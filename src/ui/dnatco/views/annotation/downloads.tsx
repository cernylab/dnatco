import React from 'react';
import { View } from '../view';
import { Common, DownloadButton } from '../../common';
import { Downloads as _Downloads } from '../../downloads-common';
import { Net } from '../../../../browser-util/net';
import { FileTypes } from '../../../../util/file-type';
import { Serialization } from '../../../../util/serialization';

export function Downloads(props: View.Props) {
    return (
        <div style={ Common.VScrollJail }>
            <div className='rdo-scroll-vertically'>
                <div className='mb-2'>
                    <_Downloads.Title title='Extended mmCIF file' />
                    <div className='mb-4 font-din-2014'>
                        mmCIF file extended with additional DNATCO categories.
                    </div>
                    <_Downloads.DownloadBox>
                        <DownloadButton
                            caption='Download'
                            onClick={() => _Downloads.serveMmCif(props.dnatcofication)}
                        />
                    </_Downloads.DownloadBox>
                </div>

                <div className='mb-2'>
                    <_Downloads.Title title='Table of assigned NtCs' />
                    <div style={ _Downloads.DownloadItemDescription }>
                        Table of assigned NtCs.
                    </div>
                    <_Downloads.DownloadBox>
                        <DownloadButton
                            caption='CSV'
                            onClick={() => {
                                const t = _Downloads.assignmentTable(props.dnatcofication, false);
                                const text = Serialization.table(t, 'csv');
                                Net.serveFile(FileTypes.csv.mimeType, text, `${props.dnatcofication.identifyingName}_assigned_ntcs.${FileTypes.csv.suffix}`);
                            }}
                        />
                        <DownloadButton
                            caption='JSON'
                            onClick={() => {
                                const t = _Downloads.assignmentTable(props.dnatcofication, false);
                                const text = Serialization.table(t, 'json');
                                Net.serveFile(FileTypes.json.mimeType, text, `${props.dnatcofication.identifyingName}_assigned_ntcs.${FileTypes.json.suffix}`);
                            }}
                        />
                    </_Downloads.DownloadBox>
                </div>
            </div>
        </div>
    );
}

export namespace Downloads {
    export const StepSwitcher = () => {}
}
