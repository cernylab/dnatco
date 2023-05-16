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
    jpeg: { suffix: 'jpg', mimeType: 'image/jpeg' },
    json: { suffix: 'json', mimeType: 'application/json' },
    pdf: { suffix: 'pdf', mimeType: 'application/pdf' },
    png: { suffix: 'png', mimeType: 'image/png' },
    svgXml: { suffix: 'svg', mimeType: 'image/svg+xml' },
    text: { suffix: 'txt', mimeType: 'text/plain;charset=UTF-8' },
    webp: { suffix: 'webp', mimeType: 'image/webp' },
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
