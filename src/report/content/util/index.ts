export function niceStepName(
    modelNo: number,
    hasMultipleModels: boolean,
    compOne: string, seqIdOne: number, altIdOne: string, insCodeOne: string,
    compTwo: string, seqIdTwo: number, altIdTwo: string, insCodeTwo: string
) {
    let name = hasMultipleModels ? `M${modelNo} ` : '';

    name += `${compOne}${seqIdOne}`;
    if (insCodeOne !== '')
        name += `.${insCodeOne}`;
    if (altIdOne !== '')
        name += ` (alt. ${altIdOne})`;

    name += ' ';

    name += `${compTwo}${seqIdTwo}`;
    if (insCodeTwo !== '')
        name += `.${insCodeTwo}`;
    if (altIdTwo !== '')
        name += ` (alt. ${altIdTwo})`;

    return name;
}


