const path = require('path');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const sharedConfig = {
    module: {
        rules: [
            {
                test: /molstar.js/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        name: '[name].[ext]',
                        sourceMap: false
                    },
                }],
            },
            {
                test: /\.(html|php)$/,
                use: [{
                    loader: 'file-loader',
                    options: { name: '[name].[ext]' },
                }],
            },
            {
                test: /\.(svg|png|jpe?g)$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        outputPath: 'imgs',
                        name: '[name].[ext]',
                        sourceMap: false
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
        minimizer: [
            new CssMinimizerPlugin(),
        ],
    },
    resolve: {
        modules: [
            'node_modules',
            path.resolve(__dirname, 'jsLLKA/'),
            path.resolve(__dirname, 'lib/'),
        ],
    },
    experiments: {
        topLevelAwait: true,
    }
};

function createApp(name) {
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
        ...sharedConfig,
    };
}

module.exports = [
    createApp('index'),
];
