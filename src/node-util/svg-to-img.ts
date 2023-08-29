import { createCanvas, loadImage } from 'canvas';

export async function svgToImg(svg: string | Buffer, width: number, height: number, format: 'jpeg' | 'png', dx?: number, dy?: number) {
    const img = await loadImage(svg);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, dx ?? 0, dy ?? 0);

    // @ts-ignore
    return canvas.toBuffer(format === 'jpeg' ? 'image/jpeg' : 'image/png');
}
