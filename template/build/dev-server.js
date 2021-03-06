// require('./check-versions')()
require('./addon/dev-server-watch')()
require('./addon/mock-server')()
var opn = require('opn')
var path = require('path')
var express = require('express')
var webpack = require('webpack')
var proxyMiddleware = require('http-proxy-middleware')
var webpackConfig = require('./webpack.dev.conf')
var config = require('./config')

var fs = require('fs');
var https = require('https');
var privateKey = fs.readFileSync('./build/addon/localhost.key');
var certificate = fs.readFileSync('./build/addon/localhost.crt');
var credentials = {key: privateKey, cert: certificate};

// default port where dev server listens for incoming traffic
var port = process.env.PORT || config.dev.port
// automatically open browser, if not set will be false
var autoOpenBrowser = !!config.dev.autoOpenBrowser
// Define HTTP proxies to your custom API backend
// https://github.com/chimurai/http-proxy-middleware
var proxyTable = config.dev.proxyTable

var app = express()
var compiler = webpack(webpackConfig)

var devMiddleware = require('webpack-dev-middleware')(compiler, {
  publicPath: webpackConfig.output.publicPath,
  quiet: true
})

var hotMiddleware = require('webpack-hot-middleware')(compiler, {
  log: () => {
  }
})

var hasCompilation = false
// force page reload when html-webpack-plugin template changes
compiler.plugin('compilation', function (compilation) {
  if (hasCompilation) {
    return
  }
  compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
    hotMiddleware.publish({action: 'reload'})
    cb()
  })
  hasCompilation = true
})

// proxy api requests
Object.keys(proxyTable).forEach(function (context) {
  var options = proxyTable[context]
  if (typeof options === 'string') {
    options = {target: options}
  }
  app.use(proxyMiddleware(options.filter || context, options))
})

// handle fallback for HTML5 history API
app.use(require('connect-history-api-fallback')())

// serve webpack bundle output
app.use(devMiddleware)

// enable hot-reload and state-preserving
// compilation error display
app.use(hotMiddleware)

// serve pure static assets
var staticPath = path.posix.join(config.assetsPublicPath, config.assetsSubDirectory)
app.use(staticPath, express.static('./static'))

var uri = 'http://localhost:' + port

var _resolve
var readyPromise = new Promise(resolve => {
  _resolve = resolve
})

console.log('> Starting dev server...')
devMiddleware.waitUntilValid(() => {
  console.log('> Listening at ' + uri + '\n')
  if (autoOpenBrowser) {
    opn(uri)
  }
  _resolve()
})

var server = app.listen(port, function () {
  server.keepAliveTimeout = 0;
  console.log('\n本地开发环境即将启动，请访问：http://localhost' + ':' + port)
})

if (config.dev.httpsEnable) {
  var httpsServer = https.createServer(credentials, app);
  var httpsPort = config.dev.httpsPort || 8443
  httpsServer.listen(httpsPort, function() {
    httpsServer.keepAliveTimeout = 0;
    console.log('您已开启https支持，请访问：https://localhost' + ':' + httpsPort)
  })
}

module.exports = {
  ready: readyPromise,
  close: () => {
    server.close()
  }
}
