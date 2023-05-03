import Plotly, { type PlotData, type Layout } from 'plotly.js';

const JpegPayloadIndicator = new RegExp('^data:image/jpeg;base64,');
const PngPayloadIndicator = new RegExp('^data:image/png;base64,');
const SvgPayloadIndicator = new RegExp('^data:image/svg\\+xml,');
const WebpPayloadIndicator = new RegExp('^data:image/webp;base64,');

const Enc = new TextEncoder();

export namespace ImageSerialization {
    function imageDataToArray(data: string, format: Format) {
        switch (format) {
            case 'jpeg':
                return Uint8Array.from(Buffer.from(data.replace(JpegPayloadIndicator, ''), 'base64'));
            case 'png':
                return Uint8Array.from(Buffer.from(data.replace(PngPayloadIndicator, ''), 'base64'));
            case 'svg':
                return Enc.encode(decodeURIComponent(data.replace(SvgPayloadIndicator, '')));
            case 'webp':
                return Uint8Array.from(Buffer.from(data.replace(WebpPayloadIndicator, ''), 'base64'));
        }
    }

    export type Format = 'jpeg' | 'png' | 'svg' | 'webp';

    export async function toImage(data: PlotData[], layout: Partial<Layout>, width: number, height: number, format: Format) {

        const imgData = await Plotly.toImage({ data, layout }, { format, width, height });
        return imageDataToArray(imgData, format);
    }
}
