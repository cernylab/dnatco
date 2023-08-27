import { Net } from './net';
import { FileType } from '../util/file-type';

export type Downloader<T> = {
    caption: string,
    download: (fileNameStem: string, data: T) => void,
    fileType: FileType,
};

export function doDownload(fileNameStem: string, data: string|Uint8Array, fileType: FileType) {
    const fileName = fullFileName(fileNameStem, fileType);

    if (typeof data === 'string')
        Net.serveFile(fileType.mimeType, data, fileName);
    else
        Net.serveFileRaw(fileType.mimeType, data, fileName);
}

export function fullFileName(stem: string, fileType: FileType) {
    return `${stem}.${fileType.suffix}`;
}
