module.exports = {
    mode: 'development',
    entry: [
        './src/index.js'
    ],
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            },
            {
                test: /\.css$/,
                use: [ 'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            localIdentName: '[name]__[local]__[hash:base64:10]'
                        }
                    }
                ]
            }
        ]
    },
    output: {
        path: __dirname + '/docs',
        publicPath: '/',
        filename: 'bundle.js'
    }
};