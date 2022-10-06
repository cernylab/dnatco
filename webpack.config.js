const path = require('path');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');

function sharedConfig(productionBuild) {
    return {
        module: {
            rules: [
                {
                    test: /molstar.js/,
                    use: [{
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            sourceMap: false,
                        },
                    }],
                },
                {
                    test: /\.php$/,
                    use: [{
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            sourceMap: false,
                        },
                    }],
                },
                {
                    test: /\.html$/,
                    use: [{
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'html/',
                            sourceMap: false,
                        }
                    }],
                },
                {
                    test: /\.(svg|png|jpe?g)$/,
                    use: [{
                        loader: 'file-loader',
                        options: {
                            outputPath: 'imgs',
                            name: '[name].[ext]',
                            sourceMap: false,
                        },
                    }],
                },
                {
                    test: /\.(s*)css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        {
                            loader: 'css-loader',
                            options: {
                                sourceMap: false
                            },
                        },
                    ],
                },
            ],
        },
        plugins: [
            new CssMinimizerPlugin(),
            new MiniCssExtractPlugin({ filename: 'rednatco.css' }),
        ],
        optimization: {
            minimize: productionBuild,
            minimizer: [
                new CssMinimizerPlugin(),
                new TerserPlugin(),
            ],
        },
        resolve: {
            modules: [
                'node_modules',
                path.resolve(__dirname, 'lib/'),
            ],
        },
        experiments: {
            topLevelAwait: true,
        }
    };
};

function createApp(name, productionBuild) {
    return {
        node: false,
        target: 'web',
        entry: {
            app: path.resolve(__dirname, `lib/${name}.js`),
        },
        output: {
            filename: `${name}.js`,
            path: path.resolve(__dirname, 'dist')
        },
        ...sharedConfig(productionBuild),
    };
}

module.exports = (env, argv) => {
    const productionBuild = argv.mode === 'production';

    return createApp('index', productionBuild);
};
