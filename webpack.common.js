// vim: set sw=4 ts=4 sts=4 expandtab :
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');
////  const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

function removeContextFromPath(_path, ctx) {
    const pathToks = _path.split('/');
    const ctxToks = ctx.split('/');

    // The context in which this function is intended to be used requires
    // that the "path" contains at least a directory and a file name
    if (ctxToks.length - 1 >= pathToks)
        throw new Error('Context is too short for the given resourceUrl');

    let idx = 0;
    while (pathToks[idx] === ctxToks[idx]) idx++;

    return pathToks.slice(idx);
}

function simplifiedAssetPath(url, resourcePath, ctx) {
    let out = removeContextFromPath(resourcePath, ctx);
    out = out.slice(1, out.length - 1);

    return path.join(...out, url);
}

function sharedConfig(productionBuild, outDir, extraConfig) {
    return {
        externals: extraConfig?.externals ?? void 0,

        devServer: {
            client: {
                logging: 'warn',
                overlay: {
                    errors: true,
                    warnings: true,
                    runtimeErrors: true,
                },
                progress: true,
            },
            static: {
                directory: path.join(__dirname, outDir),
            },
            compress: false,
            port: 8118,
        },

        node: {
            // provides the global variable named "global"
            global: true,
        },

        mode: productionBuild ? 'production' : 'development',
        module: {
            rules: [
                {
                    test: /\.json$/,
                    type: 'javascript/auto',
                    include: [path.resolve(__dirname, 'assets')],
                    use: [{
                        loader: 'file-loader',
                        options: {
                            outputPath: simplifiedAssetPath,
                            name: '[contenthash].[ext]',
                            sourceMap: false,
                        }
                    }],
                },
                ...(extraConfig?.moduleRules ?? []),
                {
                    test: /molstar.js/,
                    use: [{
                        loader: 'file-loader',
                        options: {
                            name: '[contenthash].[ext]',
                            sourceMap: false,
                        },
                    }],
                },
                {
                    test: /\.(png|jpe?g)$/,
                    include: [path.resolve(__dirname, 'assets/violin_plots')],
                    use: [{
                        loader: 'file-loader',
                        options: {
                            outputPath: simplifiedAssetPath,
                            name: '[contenthash].[ext]',
                            sourceMap: false,
                        },
                    }]
                },
                {
                    test: /\.(svg|png|jpe?g)$/,
                    exclude: [path.resolve(__dirname, 'assets/violin_plots')],
                    use: [{
                        loader: 'file-loader',
                        options: {
                            outputPath: 'imgs',
                            name: '[contenthash].[ext]',
                            sourceMap: false,
                        },
                    }],
                },
                {
                    test: /\.ttf$/,
                    use: [{
                        loader: 'file-loader',
                        options: {
                            outputPath: 'fonts/ttf',
                            name: '[name].[ext]',
                            sourceMap: false,
                        },
                    }],
                },
                {
                    test: /\.csv$/,
                    include: [path.resolve(__dirname, 'assets/naval')],
                    use: [{
                        loader: 'file-loader',
                        options: {
                            outputPath: 'naval',
                            name: '[contenthash].[ext]',
                            sourceMap: false,
                        }
                    }],
                },
                {
                    test: /\.csv$/,
                    exclude: [path.resolve(__dirname, 'assets/naval')],
                    use: [{
                        loader: 'file-loader',
                        options: {
                            sourceMap: false,
                        }
                    }],
                },
                {
                    test: /\.(s*)css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader',
                    ],
                },
            ],
        },
        plugins: [
            new CssMinimizerPlugin(),
            new MiniCssExtractPlugin({ filename: 'rednatco.css' }),
            new CopyPlugin({
                patterns: [
                    {
                        from: 'assets/contour_plots/le18/**/*',
                        to() { return path.resolve(__dirname, outDir, 'contour_plots/le18/[name][ext]') },
                        filter: async (resourcePath) => { return resourcePath.endsWith('.png') || resourcePath.endsWith('.pdf'); },
                    },
                    {
                        from: 'assets/contour_plots/gt25/**/*',
                        to() { return path.resolve(__dirname, outDir, 'contour_plots/gt25/[name][ext]') },
                        filter: async (resourcePath) => { return resourcePath.endsWith('.png') || resourcePath.endsWith('.pdf'); },
                    },
                    // TODO: Turn the .json files into actual assets. This will allow us to do away with this lame hack
                    {
                        from: 'assets/angles_lengths/*.json',
                        to() { return path.resolve(__dirname, outDir, 'angles_lengths/[name][ext]') },
                    },
                    ...(extraConfig?.copyPluginPatterns ?? []),
                ]
            }),
            new webpack.ProvidePlugin({
                Buffer: ['buffer', 'Buffer'],
            }),
            ...(extraConfig?.plugins ?? []),
            // new BundleAnalyzerPlugin()
        ],
        resolve: {
            modules: [
                'node_modules',
                path.resolve(__dirname, 'lib/src'),
            ],
            alias: {
                'viewer-api': path.resolve(__dirname, 'lib/molstar/src/apps/rednatco/api.js'),
                'viewer-filters': path.resolve(__dirname, 'lib/molstar/src/apps/rednatco/filters.js'),
                'assets': path.resolve(__dirname, 'assets'),
                'process': 'process/browser'
            },
            fallback: {
                'assert': require.resolve('assert'),
                'buffer': require.resolve('buffer'),
                'stream': require.resolve('stream-browserify'),
                ...extraConfig.resolveFallbacks,
            }
        },
        experiments: {
            topLevelAwait: true,
        }
    };
};

function createApp(name, productionBuild, outDir, extraConfig) {
    if (productionBuild)
        console.log('Building for production...');
    else
        console.log('Building for development');

    return {
        node: false,
        target: 'web',
        entry: {
            app: path.resolve(__dirname, `lib/src/${name}.js`),
        },
        output: {
            filename: `${name}[chunkhash].js`,
            path: path.resolve(__dirname, outDir)
        },
        ...sharedConfig(productionBuild, outDir, extraConfig),
    };
}

function createLib(name, productionBuild, outDir, extraConfig) {
    if (productionBuild)
        console.log('Building for production...');
    else
        console.log('Building for development');

    return {
        node: false,
        target: 'node',
        entry: {
            app: path.resolve(__dirname, `lib/librednatco/lib/${name}.js`),
        },
        output: {
            filename: `${name}.js`,
            path: path.resolve(__dirname, outDir)
        },
        ...sharedConfig(productionBuild, outDir, extraConfig),
    };
}

module.exports = {
    createApp,
    createLib,
};
