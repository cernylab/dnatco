import { GlobalConfig } from './global-config';

export namespace Version {
    export const Major = 0;
    export const Minor = 1;

    export function tag() {
        return `${Major}.${Minor}${GlobalConfig.get('isDevel') ? '-devel' : ''}`;
    }
}
