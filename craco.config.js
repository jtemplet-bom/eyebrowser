const { addBeforeLoader, loaderByName } = require('@craco/craco')

module.exports = {
    webpack: {
        configure: function(webpackConfig) {
            const glslLoader = {
                test: /\.(glsl|vs|fs|vert|frag)$/,
                exclude: /node_modules/,
                use: [
                    'raw-loader',
                    'glslify-loader'
                ]
            }

            addBeforeLoader(webpackConfig, loaderByName("file-loader"), glslLoader)

            return webpackConfig;
        }
    }
}