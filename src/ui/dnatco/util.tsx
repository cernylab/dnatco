export function rmsdToSemaphore(rmsd: number) {
    const MinRmsd = 0.0
    const MaxRmsd = 1.0;
    const Half = MaxRmsd / 2.0;

    let normalized = (rmsd + MinRmsd) / MaxRmsd;
    if (normalized > MaxRmsd)
        normalized = MaxRmsd;
    const r = Math.round(255 * (2 * normalized < 1 ? 2 * normalized : 1));
    const g = Math.round(255 * (1 - 2 * (normalized - Half > 0 ? normalized - Half : 0)));

    return { r, g, b: 0 };
}
