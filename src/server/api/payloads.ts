export namespace Payloads {
    export type FoundStep = {
        name: string,
        NtC: string,
        nearestNtC: string,
        CANA: string,
        confal: number,
        delta1: number,
        epsilon1: number,
        zeta1: number,
        alpha2: number,
        beta2: number,
        gamma2: number,
        delta2: number,
        chi1: number,
        chi2: number,
        resolution: number,
        numsteps: number,
        rmsd: number
    }
    export type FoundSteps = FoundStep[];

    export type RsccElement = [atomId: number, rscc: number];
    export type Rscc = RsccElement[];

    export type Payload = FoundSteps | Rscc;
}
