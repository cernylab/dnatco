DNATCO Standalone Tool
===

This is the standalone Node.js version of DNATCO - a nucleic acid analyzing tool for offline use. The main DNATCO web application is available at [dnatco.datmos.org](https://dnatco.datmos.org).

The standalone tool can be run with Node.js and does not require a graphical user interface. Its purpose is to produce structural analysis reports from given coordinate and density map files.

**NOTE:** The standalone tool is __not__ a complete offline replacement for the DNATCO web application. It does not have a graphical user interface and is focused on producing validation reports and restraints files.

Prerequisites
---

The standalone tool requires [Node.js](https://nodejs.org) __version 18__ or above.

Build Instructions
---

As the very first step, use `git clone` to clone the main repository from [https://github.com/cernylab/dnatco](https://github.com/cernylab/dnatco). Once done, `cd` into the project's directory.

Then make sure that you have also pulled all the submodules:
```
git submodule update --init --recursive --checkout
```

Install dependencies and build the standalone tool:

```
npm install
npm run build-lib
```

**Note:** The Molstar viewer is only required for the web application build, not for the standalone tool.

Setting up `node-canvas` module (Optional)
---

The [node-canvas](https://www.npmjs.com/package/canvas) module is an optional dependency required only for PDF report generation. All other features (CSV/JSON export, restraints generation, etc.) work without it.

The `node-canvas` module may require additional setup steps. While the module provides pre-built native binaries for all major platforms, there is no guarantee that they will work on your particular system. Especially on Linux-based systems, this might be a problem.

To install canvas for PDF report support:

```
cd bin
npm install canvas
```

If you are unable to build or run with canvas, you can try building the binary manually:

```
cd bin
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

For detailed installation instructions, see:
- [https://github.com/cernylab/dnatco/blob/new-style/README.md#tool-for-offline-use](https://github.com/cernylab/dnatco/blob/new-style/README.md#tool-for-offline-use)
- [https://github.com/Automattic/node-canvas#installation](https://github.com/Automattic/node-canvas#installation)

Running the Tool
---

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

By default (when no output options are specified), the tool will produce a mmCIF file with additional DNATCO categories and, if canvas is available, a validation report as a PDF file.

**NOTE:** The standalone tool relies on the entire content of the `bin` directory. If you wish to move the standalone tool to a different directory, make sure that you copy the entire `bin` directory and that its contents remain unchanged.

Citation and License
---

If you use this Software in a scientific or academic work, you must cite the paper(s) listed in the `CITATION.txt` file from the [https://github.com/cernylab/dnatco](https://github.com/cernylab/dnatco) repository. The citation(s) should be included in all academic and scientific publications, presentations, or derivative works that make use of this Software.

This software is distributed under the terms specified in:
- `LICENSE.txt` - Main software license
- `assets/LICENSE.txt` - Assets license

Both files are available in the [https://github.com/cernylab/dnatco](https://github.com/cernylab/dnatco) repository.
