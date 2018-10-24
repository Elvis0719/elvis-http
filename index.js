const bunyan = require('bunyan')
const express = require('express')
const cors = require('cors')
const http = require('http')
const numeral = require('numeral')

global.Error400 = class Error400 extends Error {
  constructor (message) {
    super(message)
    this.name = this.constructor.name
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor)
    } else {
      this.stack = new Error(message).stack
    }
  }
}

module.exports = (
  config = {},
  options = {}
) => {

  process.env.NODE_ENV = process.env.NODE_ENV || 'development'
  const name = config.clientId || 'clientId'
  const logger = bunyan.createLogger({ name })

  process.on('uncaughtException', (error) => {
    logger.fatal(error)
    process.exit()
  })
  process.on('unhandledRejection', (error) => {
    logger.error(error)
  })

  const limit = options.postBodySize || '50mb'

  const app = express()
  .use(cors())
  .use(express.json({ limit }))
  .use(express.urlencoded({ limit, extended: true }))

  if (options.static) {
    app.use(options.static.name || '/public', express.static(options.static.path && options.static))
  }

  if (options.restful) {
    const router = express.Router()
    options.restful(logger, router)
    app.use('/api', router)
  }

  if (options.graphql) {
    const gHttp = require('express-graphql')
    app.use('/graphql', gHttp({
      schema: options.graphql.schema,
      graphiql: options.graphql.graphiql || true,
      pretty: options.graphql.pretty || true,
      formatError: process.env.NODE_DEV === 'production'
        ? (error) => ({ error: error.message })
        : (error) => ({ error: error.message, stack: error.stack })
    }))
  }

  const error = (error, req, res, next) => {
    if (error instanceof Error400) {
      res.status(400)
    } else {
      res.status(500)
    }
    process.env.NODE_DEV === 'production'
      ? res.send({ error: error.message })
      : res.send({ error: error.message, stack: error.stack })
  }
  app.use(error)

  const server = http.Server(app)

  if (options.socket) {
    // const io = require('socket.io')(server)
  }

  const time = process.hrtime()
  const port = config.http && config.http.port || process.env.PORT || 3000

  server.listen(port, () => {
    const diff = process.hrtime(time)
    const second = (diff[0] * 1e9 + diff[1]) / 1e9
    logger.info(`[${process.version}] http service is listening on port ${port} in ${process.env.NODE_ENV} mode used ${numeral(second).format('0.00')} seconds`)
  })

}
