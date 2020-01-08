const path = require('path');

module.exports = {
    mode: 'production',
    entry: path.resolve(__dirname, './src/index.ts'),
    output: {
        path: path.resolve(__dirname, 'public'),
        filename: 'index.js'
    },
    devtool: '',
    resolve: {
        modules: [
            path.resolve(__dirname, './src'), 
            'node_modules'
        ],
        extensions: ['.ts', '.tsx', '.js', '.jsx']
    },
    module: {
        rules: [
            {
                test: /\.ts$|.tsx?$/,
                exclude: /node_modules/,
                use: [
                    { loader: 'babel-loader' },
                    { loader: 'ts-loader' }
                ]
            }
        ]
    }
};