const Koa = require('koa')
const consola = require('consola')
const { Nuxt, Builder } = require('nuxt')
const session = require('koa-session')
const koaBoay = require('koa-body')
const Router = require('koa-router')

const app = new Koa()
const router = new Router()

// 加载nuxt选项
const config = require('../nuxt.config.js')
config.dev = !(app.env === 'production')

async function start() {
  // 设置鉴权 Start
  app.use(
    koaBoay({
      multipart: true
    })
  )
  app.keys = ['abc', 'bcd', 'cde', 'def']
  app.use(
    session(
      {
        key: 'koa:sessions',
        maxAge: 1800000,
        overwrite: true,
        signed: true,
        rolling: false,
        renew: false
      },
      app
    )
  )
  // 设置鉴权 End
  // 实例化nuxt
  const nuxt = new Nuxt(config)

  const {
    host = process.env.HOST || '127.0.0.1',
    port = process.env.PORT || 3000
  } = nuxt.options.server

  // 开发构建
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  } else {
    await nuxt.ready()
  }

  // 保存token Start
  router.post('/auth', ctx => {
    ctx.status = 200
    ctx.session.token = ctx.request.body.token || ''
    ctx.body = { code: '2000', data: '', info: '' }
  })
  app.use(router.routes()).use(router.allowedMethods())
  // 保存token End

  app.use(ctx => {
    ctx.status = 200
    ctx.respond = false // Bypass Koa's built-in response handling
    ctx.req.ctx = ctx // This might be useful later on, e.g. in nuxtServerInit or with nuxt-stash
    nuxt.render(ctx.req, ctx.res)
  })

  app.listen(port, host)
  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true
  })
}

start()
