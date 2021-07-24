const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");

module.exports = (env, argv) => 
{
    let dev = argv.mode === 'development';

    return {
        watch: dev,
        watchOptions: 
        {
            ignored: [ path.resolve(__dirname, './src/server') ],
        },
        devtool: dev ? 'eval-source-map' : undefined,
        entry: path.resolve(__dirname, './src/client/index.ts'),
        module:
        {
            rules:
            [
                {
                    test: /\.ts$/,
                    use: 'ts-loader',
                    include: [ path.resolve(__dirname, 'src/client'), path.resolve(__dirname, 'src/common') ],
                },
                {
                    test: /\.scss$/,
                    use: 
                    [
                        {
                            loader: MiniCssExtractPlugin.loader,
                        },
                        {
                            // Interprets CSS
                            loader: "css-loader",
                            options: 
                            {
                                importLoaders: 2
                            }
                        },
                        {
                            loader: 'resolve-url-loader',
                        },
                        {
                            loader: 'sass-loader',
                        },
                    ]
                }
            ]
        },
        resolve:
        {
            extensions: [ '.ts', '.js', '.scss' ]
        },
        optimization: 
        {
            usedExports: dev, // remove unused function
        },
        plugins:
        [
            new MiniCssExtractPlugin(
            {
                filename: 'index.css',
            })
        ],
        output: 
        {
            filename: 'bundle.js',
            path: path.resolve(__dirname, 'dist/client'),
        },
        mode: dev ? 'development' : 'production',
        // devServer: {
        //   contentBase: path.join(__dirname, 'dist/client'),
        //   compress: true,
        //   port: 9000,
        // },
    };
};