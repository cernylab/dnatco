/*
 * NOTE:
 * As of time of writing of this code, typescript type definitions
 * for "dom" and "webworkers" library collide. Including both
 * of these libraries in tsconfig.json leads to build errors.
 * To work around the problem, we give up on some type safety
 * any grab the global object that is needed to access some
 * of the API functions manually.
 * See https://github.com/microsoft/TypeScript/issues/20595 for more details.
 */

/*
 * From https://github.com/microsoft/TypeScript/issues/20595#issuecomment-351030256
 * This function gets the correct type of the global object depending on whether
 * we are running in a Worker or in the main thread
 */
export const globalObject: any = (function (): any {
	if (typeof global !== 'undefined') {
		// global spec defines a reference to the global object called 'global'
		// https://github.com/tc39/proposal-global
		// `global` is also defined in NodeJS
		return global;
	}
	else if (typeof window !== 'undefined') {
		// window is defined in browsers
		return window;
	}
	else if (typeof self !== 'undefined') {
		// self is defined in WebWorkers
		return self;
	}
})();
