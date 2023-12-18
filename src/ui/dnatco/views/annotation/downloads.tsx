import React from 'react';
import { View } from '../view';
import { DownloadButtonComponent } from '../../common';
import { Downloads as _Downloads } from '../../downloads-common';
import { Net } from '../../../../browser-util/net';
import { FileTypes } from '../../../../util/file-type';
import { Serialization } from '../../../../util/serialization';
import { arrowDown, arrowDownHover } from '../../../../assets/images';

export function Downloads(props: View.Props) {
    return (
        <div className='overflow-hidden h-full flex flex-col'>
            <div className='rdo-scroll-vertically'>
                <div className='flex justify-between border-t-secondary-second border-t mt-4 pt-3 mb-8'>
                    <div>
                        <_Downloads.Title title='Extended mmCIF file' />
                        <div className='mb-4 font-din-2014'>
                            mmCIF file extended with additional DNATCO categories.
                        </div>
                    </div>
                    <DownloadButtonComponent
                        title='Download'
                        defaultImage={arrowDown as string} 
                        hoverImage={arrowDownHover as string}
                        onClick={() => _Downloads.serveMmCif(props.dnatcofication)}
                    />
                </div>
                <div className='flex justify-between border-t-secondary-second border-t pt-3 mb-8'>
                    <div>
                        <_Downloads.Title title='Table of assigned NtCs' />
                        <div className='mb-4 font-din-2014'>
                            Table of assigned NtCs.
                        </div>
                    </div>
                    <div className='flex'>
                        <DownloadButtonComponent
                            title='CSV'
                            defaultImage={arrowDown as string} 
                            hoverImage={arrowDownHover as string}
                            onClick={() => {
                                const t = _Downloads.assignmentTable(props.dnatcofication, false);
                                const text = Serialization.table(t, 'csv');
                                Net.serveFile(FileTypes.csv.mimeType, text, `${props.dnatcofication.identifyingName}_assigned_ntcs.${FileTypes.csv.suffix}`);
                            }}
                        />
                        <DownloadButtonComponent
                            title='JSON'
                            defaultImage={arrowDown as string} 
                            hoverImage={arrowDownHover as string}
                            onClick={() => {
                                const t = _Downloads.assignmentTable(props.dnatcofication, false);
                                const text = Serialization.table(t, 'json');
                                Net.serveFile(FileTypes.json.mimeType, text, `${props.dnatcofication.identifyingName}_assigned_ntcs.${FileTypes.json.suffix}`);
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export namespace Downloads {
    export const StepSwitcher = () => {}
}
