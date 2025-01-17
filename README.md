ReDNATCO
===

The main component of the ReDNATCO nucleic acid analyzing tool.

Prerequisites
---
ReDNATCO is a Single Page Application written in [Typescript](https://www.typescriptlang.org/) and [React](https://react.dev/). ReDNATCO is mostly self-sufficient and implements majority of the required data processing functionality.

Some additional functionality requires support from the [ReDNATCO server]() tool. It is recommended that you set up ReDNATCO server first before you set up ReDNATCO itself.

ReDNATCO requires [Node.js](https://nodejs.org) __version 18__ or above to build and run.

Build instructions
---
As the very first step, use `git clone` to clone this repository. Once done, `cd` into the project's directory. Unless you told `git` otherwise, the project will be cloned into directory `rednatco`.


Then make sure that you have also pulled all the submodules. Run
```
git submodule update --init --recursive --checkout
```

ReDNATCO relies on [Molstar](https://molstar.org/) Viewer for visualisation. To avoid any potential issues during the build process, it is highly recommended that you build the Molstar viewer first.
To do so, run
```
node build_molstar.js
```

The script does not produce any output if it succeeds. When Molstar finishes building, run

```
npm install
npm run build
```

Alternatively, you can run
```
npm run build-dev
```

By default, ReDNATCO will be built into the `dist` subdirectory.

#### Continuous incremental builds

This will produce an unoptimized build of ReDNATCO. Unoptimized build has a considerably larger size but the generated code is more readable and it takes less time to build. It is highly recommended to use `build-dev` for development purposes.

If the code build successfully, you may also run
```
npm run watch
```

This will start a watcher that will rebuild ReDNATCO incrementally whenever a project file gets changed. Note that some more invasive changes or changes to the Webpack configuration may require a full rebuild with `npm run build-dev`.

#### Development with internal web server

You may also use the `webpack-dev-server` plugin for local development. Webpack will start its own web server that will serve ReDNATCO and incrementally rebuild ReDNATCO in the same fashion as `npm run watch`.
To use Webpack internal server, run
```
npm run serve-dev
```

and navigate to [http://localhost:8118](http://localhost:8118) in your browser. Webpack internal server provides additional development conveniences such as hot reloading and nicer error reporting. Please see the notes below if you wish to use Webpack internal server for development.


**NOTE:** Make sure that you have `useHashRouter` set to `true` in ReDNATCO configuration if you use Webpack internal server. Otherwise the navigation will not work correctly.

**NOTE 2:** Webpack server does not provide the full functionality of ReDNATCO server. It is intended for development purposes only.

### Tool for offline use

ReDNATCO provides a standalone tool that can be run with Node.js. Since ReDNATCO is primarily intended to run in a browser, it relies on additional modules that emulate functionality that is available in a browser but not in Node.js environment to make the standalone tool work.

Note that the offline tool is __not__ a complete offline replacement for ReDNATCO. It does not have any graphical user interface and its purpose is to produce the structural analysis report from the given coordinates and density map files.

#### Setting up `node-canvas` module

The [node-canvas](https://www.npmjs.com/package/canvas) module may require additional setup steps. While the `node-canvas` module provides pre-built native binaries for all major platforms, there is no guarantee that they will work on your particular system. Especially on Linux-based systems, this might be a problem. If you are unable to build or run the standalone tool, you can try to fix the problem by building the `node-canvas` binary manually:


```
rm -rf node_modules/canvas
npm install --build-from-source canvas
```

On a Linux system, the approximate list of packages necessary to build the binary is:
- gcc-c++
- cairo-devel
- pango-devel
- libjpeg8-devel
- librsvg-devel
- nodejs22-devel

Keep in mind that the precise names of these packages will likely be different on your Linux distribution of choice and the version of Node.js. If in doubt, consult [node-canvas README](https://github.com/Automattic/node-canvas) for more information.

Once the `node-canvas` module is set up, execute
```
npm run build-lib
```


#### Running the tool

To run the tool from the ReDNATCO root directory, execute the following command:

```
node ./bin/rednatco.js <output_directory> <coordinates_file> <density_map (optional)>
```

or, on a Windows system:

```
node bin\rednatco.js <output_directory> <coordinates_file> <density_map (optional)>
```

The tool will produce a mmCIF file with additional categories and a validation report as a PDF file.

**NOTE:** The standalone tool relies on the entire content of the `bin` directory. If you wish to move the standalone tool to a different directory, make sure that you copy the entire `bin` directory and that its contents remain unchanged.

Configuration
---
ReDNATCO can be configured with a JSON configuration file. The file must be named `config.json` and it must be placed in the site's root directory. Annotated configuration file is listed below

```
{
    // --- General configuration ---

    // Color of the reference structure of the previous step. Used in the Viewer, plots and tables.
    "previousStepColor": "#f0f",

    // Color of the reference structure of the currently selected step. Used in the Viewer, plots and tables.
    "currentStepColor": "#2f2",

    // Color of the reference structure of the next step. Used in the Viewer, plots and tables.
    "nextStepColor": "#a0a",

    // Color of the reference structure of the previous step. Used in the Viewer, plots and tables.
    previousStepColor: '#0000ff',

    // Color of structures highlighted in the Viewer
    "highlightColor": "#ee0011",

    // Inner color of the violin plot marker
    "violinPlotMarkerColorA": "#fffb7b",
    // Outline color of the violin plot marker
    "violinPlotMarkerColorB": "#000",

    // Whether to show hydrogens in overlaid reference dinucleoties
    showHydrogensInReferences: false,

    // Structures to list as examples on the home page
    "exampleStructures": [
        // "db" - Internal ID of the database the structure will be fetched from
        // "pdbId" - PDB ID of the structure
        // "name" - (Optional) Text to display instead of the examples's PDB ID
        { "db": "test-local", "pdbId": "1bna" },
        { "db": "rcsb", "pdbId": "4qvi", "name": "Quadruplex" }
    ],

    // If set to true, ReDNATCO will calculate connectivities and similarities for the entire structure
    // during the initial processing. Otherwise, connectivities and similarities will be calculated
    // only as required.
    "precalculateConnectivitiesAndSimilarities": false,

    // --- Configuration for the bond lengths and angles statistics module ---

    "anglesLengths": {
        // Color of the vertical marker that denotes the actual measured value of a given bond
        // length or angle.
        "chartMarkerColor": "#000000",

        // Color of outliers. An outlier is a value that does not fall within any of the probability
        // groups listed below
        "outlierColor": "#ff0000",

        // Probability groups.
        // Probability group is defined by a "threshold" and "color".
        // The "threshold" is effectively the statistical percentile. The higher the value,
        // the greater the likelihood that a concrete value will fall within a specific interval of values.
        // The higher the percentile, the wider the interval needs to be.
        // Note that since the values of bond lengths and angles do not follow any particular statistical
        // distribution, a given percentile may be composed of multiple intervals with gaps between them.
        // Value of "threshold" must be within (0; 100).
        // Value of "color" sets the color used in graphical representations of the probability groups.
        "pGroups": [
            { "threshold": 80, "color": "#006eee" },
            { "threshold": 95, "color": "#00ff00" },
            { "threshold": 99, "color": "#ffff00" },
            { "threshold": 99.9, "color": "#ffaa00" }
        ]
    },

    // --- Configuration of user databases ---

    // ReDNATCO has built-in support of "RCSB" and "PDB-REDO" databases of structures.
    // Additional used-defined databases of structures may be added as follows:
    "userDatabases": [
        {
            // Internal ID of the database. Must be unique.
            // Values "rcsb" and "pdb-redo" are already used internally.
            "id": "my-special-db",

            // Readable name/description of the database.
            "name": "My special DB",

            // How to get coordinates.
            "coords": {
                // URL to the resource that provides coordinates file. Must be in a valid URI format.
                // All occurrences of "${pdbId}$ token will be replaced by the structure's PDB ID
                "link": "/db/coordinates/${pdbId}.cif",

                // Type of the cooridnates file. Must be either "cif" or "pdb",
                "type": "cif",

                // Whether the coordinates file is GZipped
                "gzipped": false,

                // Transformation to apply on the "pdbId" string passed as argument to the
                // function that constructs the URL to the coordinates file.
                // Only "lower-case" and "upper-case" are currently supported.
                // If not set, no transformation will be applied.
                "idTransformation": "lower-case"
            },

            // How to get density maps
            "densityMaps": [
                {
                    // URL to the resource that provides coordinates file. Must be in a valid URI format.
                    // In case of user databases, all occurrences the "${id}" token will be replaced
                    // by the structure's PDB ID
                    "link": "/db/density_maps/2fofc/${id}_2fofc.dsn6",

                    // Type of the density map file format. Must be one of "ccp4", "dsn6" or "ds"
                    "type": "dsn6",

                    // Kind of the density map provided in the structure. Must be one of "fo-fc", "2fo-fc" or "em"
                    "kind": "2fo-fc",

                    // Transformation to apply on the "id" string passed as argument to the
                    // function that constructs the URL to the density map file.
                    // Only "lower-case" and "upper-case" are currently supported.
                    // If not set, no transformation will be applied.
                    "idTransformation": "lower-case"
                },
                {
                    "link": "/db/density_maps/fofc/${id}_fofc.dsn6",
                    "type": "dsn6",
                    "kind": "fo-fc"
                }
            ]
        },
    ],

    // Internal ID of the database to use as the primary resource of structure data
    "primaryDatabase": "rcsb",

    // Expected fingerprint of NtC assignment parametrization data
    "expectedParametersFingerprint": "466a5115d59a4b1cd691d7e8f4f7b0aa8a39879fb048f2368692c54935ab2912",

    // Set to true only for development builds of ReDNATCO
    "isDevel": true,

    // Set to true if you do not intend to serve ReDNATCO with rednatco-server
    // This will replace default application routing
    //
    //   somewhere.net/app/something
    //
    //   with
    //
    //   somewhere.net/#/app/something
    //
    // Use of hash routing avoid issues when the browser tries to use the actual URL in the address bar,
    // i. e. when the user refreshes the page. Unless the server knows how to deal with the /app
    // endpoint correctly, this would result in 404s.
    "useHashRouter": true

    //
    // Options used only by the Node.js binaries
    //

    // URL to use in places where the value for "window.location" would have been used in browser environment
    "referenceUrl": "http://somewhere.net",

    // Information how to launch Phenix binaries
    "phenix": {
        // Path to Phenix's "phenix.real_space_correlation" binary
        "rsccExec": "/path/to/a/binary",
    }
}
```
#### Note about configuration
Mind that the JSON format **does not** support comments and the annotated example above **is not** a valid JSON file. Unless specifically overridden in the configuration file,
ReDNATCO will use sensible defaults for all configuration options. It is not necessary to list every single option in your configuration file, override only the options that you need.
