const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MOLSTAR_DIR = 'molstar';

function copyDist(src, dst) {
    const distDir = path.join(src, 'build', 'rednatco');
    if (!isDir(distDir))
        throw new Error(`${distDir} does not exist or it is not a directory`);

    const assetsDir = path.join(dst, 'assets');
    if (!isDir(assetsDir))
        throw new Error(`${assetsDir} does not exist or it is not a directory`);

    for (const asset of ['molstar.js', 'molstar.css']) {
        const assetSrcPath = path.join(distDir, asset);
        const assetDstPath = path.join(assetsDir, asset);
        if (!isFile(assetSrcPath))
            throw new Error(`${assetSrcPath} is not a file`);

        fs.copyFileSync(assetSrcPath, assetDstPath);
    }
}

function isFile(path) {
    try {
        const st = fs.statSync(path);
        return st.isFile();
    } catch (e) {
        return false;
    }
}

function isDir(path) {
    try {
        const st = fs.statSync(path);
        return st.isDirectory();
    } catch (e) {
        return false;
    }
}

function runProcess(cmd, args, cwd) {
    const proc = spawnSync(cmd, args, { cwd: cwd });

    if (proc.error)
        throw new Error(`Command '${cmd} ${args.join(' ')} did not finish successfully: ${proc.error}\n${proc.stdout}`);
    if (proc.status !== 0)
        throw new Error(`Command '${cmd} ${args.join(' ')}' failed with exit code ${proc.status}\n${proc.stdout}`);
}

function build_molstar(args) {
    const baseDir = __dirname;

    if (isDir(path.join(baseDir, 'node_modules'))) {
        console.warn(
            '"node_modules" is present in the ReDNATCO directory. This may cause Molstar build to fail. Consider deleting the directory before you try to build the Molstar plugin.\n' +
            'You can run "npm install" to get the Node modules back once the Molstar plugin is built.\n\n' +
            'To override this check, run the script with argument --ignore-node-modules'
        );
        if (args[0] !== '--ignore-node-modules')
            process.exit(1);
    }

    const molstarDir = path.join(baseDir, MOLSTAR_DIR);
    if (!isDir(molstarDir))
        throw new Error(`${molstarDir} is does not exist or it is not a directory`);

    runProcess('npm', ['install'], molstarDir);
    runProcess('npm', ['run', 'build'], molstarDir);
    copyDist(molstarDir, baseDir);
}

build_molstar(process.argv.slice(2));
