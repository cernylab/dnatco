import CryptoJS from "crypto-js";
import { Csv } from '../util/csv';

function numberAsWord(n: number) {
    let word = 0;
    for (let idx = 0; idx < 4; idx++)
        word |= (0xFF & (n >> idx * 8)) << ((3 - idx) * 8);

    return word;
}

function sortGoldenSteps(goldenSteps: Fingerprint.GoldenStep[], order: string[]) {
    const orderedSteps = [];

    for (const stepName of order) {
        const gs = goldenSteps.find((gs) => gs.name === stepName);
        if (!gs)
            throw new Error(`Step '${stepName}' is not present in the set of golden steps`);

        orderedSteps.push(gs);
    }

    return orderedSteps;
}

export namespace Fingerprint {
    export const GoldenStep = {
        delta_1: '',
        epsilon_1: '',
        zeta_1: '',
        alpha_2: '',
        beta_2: '',
        gamma_2: '',
        delta_2: '',
        chi_1: '',
        chi_2: '',
        CC: '',
        NN: '',
        mu: '',
        clusterNumber: 0,
        name: '',
    };
    export type GoldenStep = Readonly<typeof GoldenStep>;

    const HashingOrder = [
        'delta_1',
        'epsilon_1',
        'zeta_1',
        'alpha_2',
        'beta_2',
        'gamma_2',
        'delta_2',
        'chi_1',
        'chi_2',
        'CC',
        'NN',
        'mu',
    ] as const;

    export function fingerprint(goldenSteps: GoldenStep[], order: string[]) {
        const sortedGoldenSteps = sortGoldenSteps(goldenSteps, order);

        const hasher = CryptoJS.algo.SHA256.create();
        const wordArray = CryptoJS.lib.WordArray.create([0]);
        for (const step of sortedGoldenSteps) {
            for (const k of HashingOrder) {
                const bytes = CryptoJS.enc.Utf8.parse(step[k]);
                hasher.update(bytes);
            }
            wordArray.words[0] = numberAsWord(step.clusterNumber);
            hasher.update(wordArray);
        }

        const hash = hasher.finalize();
        return CryptoJS.enc.Hex.stringify(hash);
    }

    export async function fingerprintFromUrls(goldenStepsUrl: string, orderUrl: string) {
        const goldenStepsCsvReq = await fetch(goldenStepsUrl);
        if (!goldenStepsCsvReq.ok)
            throw new Error(`Failed to download set of golden steps: ${goldenStepsCsvReq.status} - ${goldenStepsCsvReq.statusText}`);
        const goldenStepsCsv = await goldenStepsCsvReq.text();

        const orderReq = await fetch(orderUrl);
        if (!orderReq.ok)
            throw new Error(`Failed to download list of golden steps: ${orderReq.status} - ${orderReq.statusText}`);
        const order = await orderReq.text();

        const goldenSteps = Csv.read(goldenStepsCsv, ';', '"', GoldenStep);
        return fingerprint(goldenSteps, order.split('\n').map((s) => s.trim()).filter((s) => s.length > 0));
    }
}
