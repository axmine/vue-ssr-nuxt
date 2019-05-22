// 定义接口地址
const api = {
  development: 'http://dev.api.com/',
  production: 'https://prod.api.com/'
}

// 主机端口号
const port = 3303

// 站点favicon
const favicon = ''

// 站点名称
const title = '网站名称'

// 站点缺省关键字
const keywords = '网站缺省关键字,关键字'

// 站点缺省说明
const description = '站点缺省说明'

// 公共css
const css = [
  { rel: 'stylesheet', href: '//at.alicdn.com/t/font_972561_sfgf0gxls0o.css' }
]

// 公共js
const js = [{ src: '//cdn.bootcss.com/lodash.js/4.17.11/lodash.min.js' }]

// axios 是否需要转换数据请求格式
const transformRequest = true

// 严重错误，如token无效，无权限等
const errorCode = [4003, 4005]

module.exports = {
  api,
  port,
  favicon,
  title,
  keywords,
  description,
  css,
  js,
  transformRequest,
  errorCode
}
