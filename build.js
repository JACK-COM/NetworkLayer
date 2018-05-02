const webpack = require('webpack');
const config = require('./webpack.config');

const compiler = webpack(config);

compiler.run((error, stats) => {
    if (error) console.log('Did not build: ', error);
    console.log('\t\t * Completing...', stats)
})