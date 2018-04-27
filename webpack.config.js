/* globals __dirname process */

'use strict';

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const config = require('./config');

module.exports = {
  devtool: 'source-map',
  entry: './client/app.jsx',
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: `${config.get('apiPath')}/`,
    filename: 'vizceral.[hash].bundle.js'
  },
  resolve: {
    extensions: ['', '.jsx', '.js'],
    modulesDirectories: ['node_modules'],
    fallback: path.join(__dirname, 'node_modules')
  },
  resolveLoader: { fallback: path.join(__dirname, 'node_modules') },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel'
      },
      { test: /\.woff2?$/, loader: 'url-loader?limit=10000&mimetype=application/font-woff' },
      { test: /\.otf$/, loader: 'file-loader' },
      { test: /\.ttf$/, loader: 'file-loader' },
      { test: /\.eot$/, loader: 'file-loader' },
      { test: /\.svg$/, loader: 'file-loader' },
      { test: /\.html$/, loader: 'html' },
      { test: /\.css$/, loader: 'style-loader!css-loader' }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      // Automtically detect jQuery and $ as free var in modules
      // and inject the jquery library
      // This is required by many jquery plugins
      jQuery: 'jquery',
      $: 'jquery'
    }),
    new webpack.DefinePlugin({
      __HIDE_DATA__: !!process.env.HIDE_DATA,
      EREBOS_BASE_URL: JSON.stringify(process.env.EREBOS_BASE_URL),
      API_PATH: JSON.stringify(config.get('apiPath'))
    }),
    new HtmlWebpackPlugin({
      title: 'Vizceral',
      template: './client/index.html',
      favicon: './client/favicon.ico',
      inject: true
    })
  ],
  devServer: {
    disableHostCheck: true,   // That solved it
    historyApiFallback: {
      index: `${config.get('apiPath')}/`
    },
    contentBase: path.join(__dirname, 'dist'), // static files location
    watchContentBase: true,
    // For some reason the fonts are not available at the expected location using webpack-dev-server. Use this hack
    // to proxy requests from expected location to the available location
    proxy: {
      '/api/vizceral/fonts/*': {
        target: 'http://localhost:9693',
        pathRewrite: { '^/api/vizceral/fonts': '/fonts' },
      },
    },
  },
};
