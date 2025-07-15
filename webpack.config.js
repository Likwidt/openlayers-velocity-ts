const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    'velocity-layer': './src/index.ts', // plugin
    'demo': './demo/script.ts'           // demo entry (includes map + layer usage)
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        include: /node_modules/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: '[name].js',
    publicPath: '/lib/',
    library: {
      name: 'VelocityLayerLib',
      type: 'umd'
    },
    clean: true
  },
  externals: {
    ol: 'ol'
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public')
    },
    devMiddleware: {
      writeToDisk: true
    },
    compress: true,
    port: 9000,
    open: true
  }
};
