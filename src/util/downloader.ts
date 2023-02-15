import { Net } from '../util/net';

export type Downloader<T> = {
    caption: string,
    download: (fileNameStem: string, data: T) => void,
    fileType: FileType,
};

export type FileType = {
    suffix: string,
    mimeType: string,
}
export const FileTypes: Record<string, FileType> = {
    csv: { suffix: 'csv', mimeType: 'text/csv' },
    json: { suffix: 'json', mimeType: 'application/json' },
};

export function doDownload(fileNameStem: string, data: string|Uint8Array, fileType: FileType) {
    const fileName = fullFileName(fileNameStem, fileType);

    if (typeof data === 'string')
        Net.serveFile(fileType.mimeType, data, fileName);
    else
        console.warn('Unimplemented');
}

export function fullFileName(stem: string, fileType: FileType) {
    return `${stem}.${fileType.suffix}`;
}
