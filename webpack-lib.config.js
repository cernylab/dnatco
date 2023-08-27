// vim: set sw=4 ts=4 sts=4 expandtab :

const { createLib } = require('./webpack.common.js');

module.exports = (env, argv) => {
    const productionBuild = argv.mode === 'production';

    return createLib('rednatco', productionBuild);
}
