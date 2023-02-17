export namespace M {
    /* Degrees to radians */
    export function d2r(angle: number) {
        return angle * Math.PI / 180.0;
    }

    /* Radians to degrees */
    export function r2d(angle: number) {
        return angle * 180.0 / Math.PI;
    }

    /* Angle in <-PI; PI > range to <0; 2PI> range */
    export function aXf(angle: number) {
        const neg = (angle < 0.0) ? 1 : 0;

        return neg * ((2.0*Math.PI) + angle) + (1.0 - neg) * angle;
    }

    export function firstValidDecimalDigit(n: number) {
        const an = Math.abs(n);
        if (an > 1.0)
            return 0;

        const ani = Math.floor(an);
        const and = an - ani;
        return and <= 0 ? 0 : -Math.log10(and);
    }

    export function fuzzyCompare(a: number, b: number, prec = 1.0e-7) {
        const c = (a / b) - 1.0;
        return Math.abs(c) < prec;
    }

    export function toDecimals(n: number, decimals: number) {
        const scale = Math.pow(10, decimals);
        return Math.round(n * scale) / scale;
    }
}
