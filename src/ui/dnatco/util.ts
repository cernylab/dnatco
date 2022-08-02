import { Dnatcofication } from '../../dnatco/dnatcofication';
import { StepsMapper } from '../../dnatco/steps-mapper';

function componentToHex(c: number) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

export function makeStepSelection(dnatcofication: Dnatcofication, stepName: string): { prev?: string, current: string, next?: string }|undefined {
    const stepId = StepsMapper.byName(dnatcofication, stepName)?.id ?? -1;
    if (stepId === -1)
        return undefined;

    const { previous, next } = StepsMapper.previousNextById(dnatcofication, stepId);
    const prevName = previous === -1 ? undefined : StepsMapper.byId(dnatcofication, previous).name;
    const nextName = next === -1 ? undefined : StepsMapper.byId(dnatcofication, next).name;

    return { prev: prevName, current: stepName, next: nextName };
}

export function rgbToHex(rgb: { r: number, g: number, b: number }) {
  return "#" + componentToHex(rgb.r) + componentToHex(rgb.g) + componentToHex(rgb.b);
}

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
