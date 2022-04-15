ReDNATCO frontend
===

Build instructions
---
```
npm install
npm run build
```

Build instructions (for development purposes)
---
```
npm install
npm run build-dev
```

Use `npm run watch` for continuously updated development builds

Built project is copied into the `dist` directory

ReDNATCO frontend requires Molstar plugin from [this repository](https://github.com/MadCatX/molstar.git) to function. Copy the `molstar.js` and `molstar.css` files from the `rednatco` Molstar plugin to the `assets` directory of this project and run build.
