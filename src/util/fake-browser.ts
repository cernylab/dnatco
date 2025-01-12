//
// This code is an adaptation of the 'browser-env' module
// written by Luke Childs (https://github.com/lukechilds/browser-env/)
//
// Since the 'browser-env' module is no longer maintained and depends or
// quite outdated packages, this is a simplified adaptation that is
// good enough to run ReDNATCO inside Node.js and works with recent
// versions of the 'jsdom' package.
//
// Note that this code modifies the global Node.js namespace!
// This was a bad idea back then and it still is!!
// Just keep this in mind!!!
//

import * as JsDom from 'jsdom';

export function createFakeBrowserWindow(jsdomConfig: JsDom.ResourceLoaderConstructorOptions & JsDom.ConstructorOptions) {
    const resourceLoader = new JsDom.ResourceLoader({
        proxy: jsdomConfig.proxy,
        strictSSL: jsdomConfig.strictSSL,
        userAgent: jsdomConfig.userAgent
    });
    const jsdom = new JsDom.JSDOM('', Object.assign(jsdomConfig, { resources: resourceLoader }));

    return jsdom.window;
}

export function createFakeBrowserEnv() {
    const window = createFakeBrowserWindow({});

    Object.getOwnPropertyNames(window)
        .forEach((prop) => { // Add the browser-specific props to Node.js' global namespace
            if (typeof (global as any)[prop] === 'undefined' && prop !== 'undefined') {
                Object.defineProperty(
                    global,
                    prop,
                    {
                        configurable: true,
                        get: () => window[prop]
                    }
                );
            }
        });

    return window;
}
