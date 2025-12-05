import { GlobalConfig } from './global-config';

export namespace Version {
    export const Major = 5;
    export const Minor = 0;

    export function tag() {
        return `${Major}.${Minor}${GlobalConfig.data().isDevel ? '-devel' : ''}`;
    }
}
