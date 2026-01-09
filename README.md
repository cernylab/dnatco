DNATCO
===

The main component of the DNATCO nucleic acid analyzing tool available at the [dnatco.datmos.org](https://dnatco.datmos.org).

Prerequisites
---
DNATCO, also referred to as "ReDNATCO" during the major rewrite phase, is a Single Page Application written in [Typescript](https://www.typescriptlang.org/) and [React](https://react.dev/). DNATCO is mostly self-sufficient and implements majority of the required data processing functionality.

Some additional functionality requires support from the [DNATCO server](src/server) tool. It is recommended that you set up DNATCO server first before you set up DNATCO itself.

DNATCO requires [Node.js](https://nodejs.org) __version 18__ or above to build and run.

Build instructions
---
As the very first step, use `git clone` to clone this repository. Once done, `cd` into the project's directory. Unless you told `git` otherwise, the project will be cloned into directory `dnatco`.


Then make sure that you have also pulled all the submodules. Run
```
git submodule update --init --recursive --checkout
```

DNATCO relies on [Molstar](https://molstar.org/) Viewer for visualisation. To avoid any potential issues during the build process, it is highly recommended that you build the Molstar viewer first.
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

By default, DNATCO will be built into the `dist` subdirectory.

#### Continuous incremental builds

This will produce an unoptimized build of DNATCO. Unoptimized build has a considerably larger size but the generated code is more readable and it takes less time to build. It is highly recommended to use `build-dev` for development purposes.

If the code build successfully, you may also run
```
npm run watch
```

This will start a watcher that will rebuild DNATCO incrementally whenever a project file gets changed. Note that some more invasive changes or changes to the Webpack configuration may require a full rebuild with `npm run build-dev`.

#### Development with internal web server

You may also use the `webpack-dev-server` plugin for local development. Webpack will start its own web server that will serve DNATCO and incrementally rebuild DNATCO in the same fashion as `npm run watch`.
To use Webpack internal server, run
```
npm run serve-dev
```

and navigate to [http://localhost:8118](http://localhost:8118) in your browser. Webpack internal server provides additional development conveniences such as hot reloading and nicer error reporting. Please see the notes below if you wish to use Webpack internal server for development.

**NOTE:** Webpack server does not provide the full functionality of DNATCO server. It is intended for development purposes only.

### Tool for offline use

DNATCO provides a standalone tool that can be run with Node.js. Since DNATCO is primarily intended to run in a browser, it relies on additional modules that emulate functionality that is available in a browser but not in Node.js environment to make the standalone tool work.

Note that the offline tool is __not__ a complete offline replacement for DNATCO. It does not have any graphical user interface and its purpose is to produce the structural analysis report from the given coordinates and density map files.

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

To run the tool from the DNATCO root directory, execute:

```
node ./bin/dnatco.js --outputDir <path> --coords <path> [options]
```

or, on a Windows system:

```
node bin\dnatco.js --outputDir <path> --coords <path> [options]
```

**Command-line options:**

```
Usage: dnatco.js
  --help                                Print usage and exit
  --outputDir                           Path to output directory [VALUE] (REQUIRED)
  --coords                              Path to file with coordinates [VALUE] (REQUIRED)
  --reflns                              Path to file with reflections [VALUE]
  --prefix                              Prefix for output files [VALUE]
  --extendedCIF                         Generate mmCIF file extended with additional DNATCO categories
  --report                              Generate comprehensive DNATCO validation report (requires canvas)
  --reportText                          Generate text validation report
  --busterRestraints                    Generate file with NtC restraints for Buster
  --refmacRestraints                    Generate file with NtC restraints for Refmac/Servalcat
  --cootRestraints                      Generate file with NtC restraints for Coot
  --phenixRestraints                    Generate file with NtC restraints for Phenix
  --restraintsRmsd                      Maximum allowed NtC RMSD (default 0.5Å) [VALUE]
  --restraintsSigmaFactor               Restraints sigma factor (default 1.0) [VALUE]
  --ntcCsv                              Generate CSV file with assigned NtCs (summary table)
  --ntcJson                             Generate JSON file with assigned NtCs (summary table)
  --ntcFullCsv                          Generate CSV file with assigned NtCs including Confal Scores and RMSDs
  --ntcFullJson                         Generate JSON file with assigned NtCs including Confal Scores and RMSDs
  --anglesLengthsByCompoundCsv          Generate CSV file with bond angles and lengths statistics by nucleotide type
  --anglesLengthsByCompoundJson         Generate JSON file with bond angles and lengths statistics by nucleotide type
  --anglesLengthsByResidueCsv           Generate CSV file with bond angles and lengths by residue
  --anglesLengthsByResidueJson          Generate JSON file with bond angles and lengths by residue
  --rsccRmsdPlots                       Generate RSCC vs RMSD plots as SVG files (requires canvas)
  --log                                 Path to a log file [VALUE]
```

By default (when no output options are specified), the tool will produce a mmCIF file with additional DNATCO categories and a validation report as a PDF file.

**NOTE:** The standalone tool relies on the entire content of the `bin` directory. If you wish to move the standalone tool to a different directory, make sure that you copy the entire `bin` directory and that its contents remain unchanged.

Configuration
---
DNATCO can be configured with a JSON configuration file. The file must be named `config.json` and it must be placed in the site's root directory. Annotated configuration file is listed below

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

    // If set to true, DNATCO will calculate connectivities and similarities for the entire structure
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

        // Name of the interval(s) that does not belong to any ProSco probability group
        "outlierName": "Outlier",

        // ProSco classification groups
        // "name" - sets the displayed name of the group.
        // "color" - sets the color used in graphical representations of the probability groups.
        "pGroups": {
            "common": { "color": "#1a33ad", name: "Common" },
            "rare": { "color": "#737dad", name: "Rare" },
            "ambiguous": { "color": "#ad738a", name: "Ambiguous" },
            "unique": { "color": "#ad265a", name: "Unique" }
        },

        // Color of the marker that denotes the actual bond angle/length in the ProSco chart
        "chartMarkerColor": string,

        // Color of the "Preferred" NA-VAL interval
        "navalPreferredColor": "#00FF00",
        // Color of the "Allowed" NA-VAL interval
        "navalAllowedColor": "#FFFF00",
        // Color of the "Of Concern" NA-VAL interval
        "navalOfConcernColor": "#FF0000",
        // Color of the marker of the actual value on the NA-VAL bar
        "navalMarkerColor": "000000",

        // Whether to display summary information with NA-VAL or ProSco metrics
        "summaryMetrics": "naval" | "prosco"
    },

    // --- Configuration of user databases ---

    // DNATCO has built-in support of "RCSB" and "PDB-REDO" databases of structures.
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

    // Set to true only for development builds of DNATCO
    "isDevel": true,

    // Set to true if you do not intend to serve DNATCO with the DNATCO server (in src/server)
    // This will replace default application routing
    //
    //   somewhere.net/app/something
    //
    //   with
    //
    //   somewhere.net/#/app/something
    //

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
DNATCO will use sensible defaults for all configuration options. It is not necessary to list every single option in your configuration file, override only the options that you need.

Citation
---
If you use this Software in a scientific or academic work, you must cite the paper(s) listed in the "CITATION.txt" file that accompanies the Software. The citation(s) should be included in all academic and scientific publications, presentations, or derivative works that make use of this Software.
