const path = require('path');
const webpack = require('webpack');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const PurgecssPlugin = require('purgecss-webpack-plugin');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const glob = require('glob');

const IS_DEV = process.env.NODE_ENV === 'dev';

const config = {
    mode: IS_DEV ? 'development' : 'production',
    devtool: IS_DEV ? 'eval' : 'source-map',
    entry: './src/js/index.js',
    output: {
        filename: 'js/[name].[hash].js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ["@babel/preset-env"],
                    }
                }
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                    },
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            sourceMap: true
                        },
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [
                                    require("tailwindcss")("./tailwind.config.js"),
                                    require("autoprefixer"),
                                ]
                            }
                        }
                    }
                ],
            }
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin(
            {
                patterns: [
                    { from: './src/images', to: 'images'}
                ]
            }
        ),
        new MiniCssExtractPlugin({
            filename: IS_DEV ? 'css/[name].css' : 'css/[name].[contenthash].css',
            chunkFilename: 'css/[id].css',
        }),
        new PurgecssPlugin({
            paths: glob.sync(`${path.join(__dirname, 'src')}/**/*`,  { nodir: true }),
        }),
    ],
    devServer: {
        static: {
            directory: path.resolve(__dirname, "src"),
        }
    },
    optimization: {
        runtimeChunk: 'single',
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /node_modules/,
                    chunks: 'initial',
                    name: 'vendor',
                    priority: 10,
                    enforce: true,
                },
            },
        },
        minimizer: [
            new CssMinimizerPlugin(),
        ],
        moduleIds: 'deterministic'
    },
};

if (!IS_DEV) {
    const TerserPlugin = require('terser-webpack-plugin');
    config.optimization.minimizer.push(
        new TerserPlugin()
    );
}

const files = glob.sync('./src/*.html');

files.forEach(file => {
    config.plugins.push(
        new HtmlWebPackPlugin({
            filename: path.basename(file),
            template: file,
            // favicon: path.resolve(__dirname, './src/public/icon.ico'),
            minify: !IS_DEV,
        })
    );
});

module.exports = config;
