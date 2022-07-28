export namespace ClassificationResources {
    export const Data = {
        clusters: '',
        confals: '',
        goldenSteps: '',
        nuAngles: '',
    };
    export type Data = typeof Data;

    export async function load(clustersPath: string, confalsPath: string, goldenStepsPath: string, nuAnglesPath: string): Promise<Data> {
        const clustersResp = fetch(clustersPath);
        const confalsResp = fetch(confalsPath);
        const goldenStepsResp = fetch(goldenStepsPath);
        const nuAnglesResp = fetch(nuAnglesPath);

        let r = await clustersResp;
        if (!r.ok)
            throw new Error(`Failed to download clusters definitions: ${r.status} ${r.statusText}`);
        const clustersText = r.text();

        r = await confalsResp;
        if (!r.ok)
            throw new Error(`Failed to download confals definitions: ${r.status} ${r.statusText}`);
        const confalsText = r.text();

        r = await goldenStepsResp;
        if (!r.ok)
            throw new Error(`Failed to download golden steps definitions: ${r.status} ${r.statusText}`);
        const goldenStepsText = r.text();

        r = await nuAnglesResp;
        if (!r.ok)
            throw new Error(`Failed to download average Nu angles definitions: ${r.status} ${r.statusText}`);
        const nuAnglesText = r.text();

        return {
            clusters: await clustersText,
            confals: await confalsText,
            goldenSteps: await goldenStepsText,
            nuAngles: await nuAnglesText
        };
    }
}
