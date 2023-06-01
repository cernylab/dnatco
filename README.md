ReDNATCO frontend
===

Frontend part of the ReDNATCO nucleic acid analyzing tool.

Prerequisites
---
ReDNATCO frontend is a Single Page Application written in [Typescript](https://www.typescriptlang.org/) and [React](https://react.dev/). The frontend is mostly self-sufficient and implements majority of the required data processing functionality.

Some additional functionality requires support from the [ReDNATCO server]() tool. It is recommended that you set up ReDNATCO server first before you set up the frontend.

Build instructions
---
As the very first step, clone this repository by running
```
git clone https://gitlab.cesnet.cz/madcatxster/rednatco-frontend
```

Once done, `cd` into the directory.


Then make sure that you have also pulled all the submodules. Run
```
git submodule update --init --recursive
```

ReDNATCO frontend relies on [Molstar](https://molstar.org/) Viewer of visualisation. To avoid any potential issues during the build process, it is highly recommended that you build the Molstar viewer first.
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

this will produce an unoptimized build of the ReDNATCO frontend. Unoptimized build has a considerably larger size but the generated code is more readable and it takes less time to build. It is highly recommended to use `build-dev` for development purposes.

If the code build successfully, you may also run
```
npm run watch
```

This will start a watcher that will rebuild the frontend incrementally whenver a project file gets changed. Note that some more invasive changes or changes to the Webpack configuration may require a full rebuild.
