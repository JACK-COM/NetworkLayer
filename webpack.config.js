const webpack = require('webpack');
const path = require('path');
// 
module.exports = {
    entry: path.resolve(__dirname, 'src/index.js'),
    output: {
        library: "networklayer",
        libraryTarget: "umd",
        libraryExport: "default",
        path: path.resolve(__dirname, 'lib'),
        filename: "networklayer.js"
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /(node_modules)/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['babel-preset-env']
                }
            }
        }]
    },
    optimization: {
        minimize: true
    },
    mode: "production"
}