var webpack = require('webpack')

module.exports = {
    entry:{
      'validate': './_source/validate.coffee'
    },
    output:{
        filename: '[name].js',
        path: './dist'
    },
    module: {
        loaders: [
            {     
                test: /\.coffee/,
                loader: 'coffee'
            }

        ]
    }
}
