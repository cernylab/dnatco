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
