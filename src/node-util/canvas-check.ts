/**
 * Checks if the 'canvas' package is available at runtime.
 * This is an optional dependency needed only for PDF report generation.
 */
export function isCanvasAvailable(): boolean {
    try {
        require.resolve('canvas');
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Gets a helpful error message when canvas is not available
 */
export function getCanvasInstallMessage(): string {
    return `
The 'canvas' package is required for PDF report generation but is not installed.

To enable PDF report generation, install the canvas package i.e. run:
    npm install canvas
(in the dnatco/bin directory)

Note: The canvas package is platform-specific and requires native dependencies.
For installation instructions, see: 
    https://github.com/cernylab/dnatco/blob/new-style/README.md#tool-for-offline-use
and/or
    https://github.com/Automattic/node-canvas#installation

You can still use DNATCO without canvas for all other features.
`.trim();
}
