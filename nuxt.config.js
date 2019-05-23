// const pkg = require('./package')
const os = require('os')
const config = require('./config')
const env = process.env.NODE_ENV

const net = os.networkInterfaces()
const ips = []
for (const k in net) {
  ips.push(...net[k])
}
const ip = ips.find(item => {
  return item.family !== 'IPv6' && item.mac !== '00:00:00:00:00:00'
})

module.exports = {
  mode: 'universal',
  env: {
    baseUrl: config.api[env],
    transformRequest: config.transformRequest,
    errorCode: config.errorCode
  },
  server: {
    port: config.port,
    host: env === 'development' ? ip.address : '127.0.0.1'
  },
  /*
   ** Headers of the page
   */
  head: {
    title: config.title,
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'keywords', name: 'keywords', content: config.keywords },
      { hid: 'description', name: 'description', content: config.description }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: config.favicon },
      ...config.css
    ],
    script: [...config.js]
  },

  /*
   ** Customize the progress-bar color
   */
  loading: { color: '#fff' },

  /*
   ** Global CSS
   */
  css: ['ant-design-vue/dist/antd.css', '@/assets/css/index.styl'],

  /*
   ** Plugins to load before mounting the App
   */
  plugins: ['@/plugins/antd-ui', '@/plugins/axios'],

  /*
   ** Nuxt.js modules
   */
  modules: [],

  /*
   ** Build configuration
   */
  build: {
    /*
     ** You can extend webpack config here
     */
    extend(config, ctx) {
      // Run ESLint on save
      if (ctx.isDev && ctx.isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/
        })
      }
    }
  }
}
