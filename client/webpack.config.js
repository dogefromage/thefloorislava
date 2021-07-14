const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");

module.exports = 
{
    devtool: 'eval-source-map',
    entry: path.resolve(__dirname, './src/index.ts'),
    module:
    {
        rules:
        [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                include: [ path.resolve(__dirname, 'src') ],
            },
            {
                test: /\.scss$/,
                use: 
                [
                    {
                        loader: MiniCssExtractPlugin.loader
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
                        loader: 'sass-loader' // 将 Sass 编译成 CSS
                    }
                ]
            }
        ]
    },
    resolve:
    {
        extensions: [ '.ts', '.js', '.scss' ]
    },
    plugins:
    [
        new MiniCssExtractPlugin(
        {
            filename: 'index.css',
            // allChunks: true,
        })
    ],
    // optimization: {
    //     minimizer: [
    //         new OptimizeCSSAssetsPlugin(
    //         {
    //             cssProcessorOptions: 
    //             {
    //                 safe: true
    //             }
    //         })
    //     ]
    // },
    output: 
    {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    mode: "development",
    devServer: 
    {
      contentBase: path.join(__dirname, 'dist'),
      compress: true,
      port: 9000,
    },
}