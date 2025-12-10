export async function svgToImg(svg: string | Buffer, width: number, height: number, format: 'jpeg' | 'png', dx?: number, dy?: number) {
    try {
        const { createCanvas, loadImage } = require('canvas');

        const img = await loadImage(svg);

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, dx ?? 0, dy ?? 0);

        // @ts-ignore
        return canvas.toBuffer(format === 'jpeg' ? 'image/jpeg' : 'image/png');
    } catch (e) {
        throw new Error(`Canvas package is not available. This is required for PDF report generation. Install it with: npm install canvas`);
    }
}
