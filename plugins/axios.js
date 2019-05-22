import Axios from 'axios'
import Qs from 'qs'

import config from '@/config'

export default function({ env, error, store }, inject) {
  // 是否需要转换数据
  const transform = {}
  if (env.transformRequest) {
    transform.transformRequest = [
      function(data) {
        return Qs.stringify(data)
      }
    ]
  }
  // 创建axios实例
  const axios = Axios.create(
    Object.assign(
      {
        baseURL: env.baseUrl,
        timeout: 300000 // 超时时间： 30s
      },
      // 数据转换
      transform
    )
  )

  // 请求拦截器
  axios.interceptors.request.use(
    config => {
      if (store.token) {
        config.data.token = store.token
      }
      return config
    },
    error => {
      Promise.reject(error)
    }
  )

  // 响应拦截器
  axios.interceptors.response.use(
    response => {
      const res = response.data
      // 将错误码转为数字
      res.code = res.code * 1
      // 除了严重错误，其他都正常返回
      return config.errorCode.includes(res.code) ? Promise.reject(res) : res
    },
    // 返回后台错误
    error => {
      const code =
        error.response && error.response.status ? error.response.status : 600
      // 错误提示
      const errMsg = new Map([
        [403, '请求错误，您没有权限访问（403）'],
        [404, '出错了，请求的资源好像不存在（404）'],
        [500, '程序君走神了，请稍候重试（500）'],
        [600, '呃，网络好像不太通畅，请检查您的网络（600）']
      ])
      const obj = {
        code,
        data: '',
        info:
          errMsg.get(code) ||
          `请求发生错误，请稍候再试（${error.response.status}）`
      }
      return Promise.reject(obj)
    }
  )

  // 定义全局post方法
  inject('post', async function(url = '', data = {}, opt = {}) {
    if (url.indexOf('/') === 0) {
      url = url.slice(1)
    }
    try {
      return await axios({ url, method: 'post', ...opt, data })
    } catch (err) {
      // 处理错误(http请求错误 & 程序里返回的严重错误)
      const result = {
        code: -1,
        data: '',
        info: `遭遇了严重错误（${err.code}）`
      }
      if (err.code > 200 && err.code < 1000) {
        result.code = -2
        result.data = ''
        result.info = `http请求发生错误(${err.code})`
      }
      return result
    }
  })
}
