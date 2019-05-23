<template>
  <el-upload
    ref="baseuploader"
    :disabled="disabled"
    :http-request="handleUpload"
    :show-file-list="false"
    :accept="accept"
    class="base-uploader"
    action="manual"
  >
    文件上传 {{ progress }}
  </el-upload>
</template>

<script>
import OSS from 'ali-oss'
export default {
  name: 'BaseUploader',
  props: {
    type: {
      type: [Array, String],
      default: '' // 为string 类型时，值为 image, video, doc 分别对应图片， 视频，文档, 为空时表示任意文件
      // default: () => { return ['jpg', 'png', 'jpeg'] } // 为数组时表示指定的文件类型方可上传
    },
    size: {
      type: Array,
      default: () => { return [0, 0, 1] } // 图片尺寸： 0表示不限制， 最后一个1表示比例或范围
    },
    limit: {
      type: Array,
      default: () => { return [0, 0, 'KB'] } // 文件大小： 0表示不限制， 最后一个表示单位
    }
  },
  data() {
    return {
      filePoint: '',
      progress: 0,
      doc: ['doc', 'xls', 'ppt', 'docx', 'xlsx', 'pptx', 'md', 'text', 'pdf', 'mind', 'et', 'ett', 'wps', 'wpt', 'dotx', 'dot', 'csv'],
      disabled: false // 是否禁用上传
    }
  },
  computed: {
    // 返回可上传的文件格式
    accept() {
      let res = ''
      if (this.$typeof(this.type) === 'Array') {
        res = `.${this.type.join(', .')}`
      } else if (this.type === 'doc') {
        res = `.${this.doc.join(', .')}`
      } else {
        res = this.type ? `${this.type}/*` : ''
      }
      return res
    }
  },
  watch: {
    filePoint(v) {
      console.log(v)
    }
  },
  methods: {
    async handleUpload(option) {
      // 文件不符合上传要求时会中断以下代码的执行
      await this.doCheck(option.file)
      // 获取STS授权并返回OSS实例化参数
      const params = await this.getSTS()
      if (params.length === 2) {
        // 执行上传方法
        const { bucket, name, res } = await this.doUpload(params, option.file)
        console.log(bucket)
        console.log(name)
        console.log(res)
        if (res.status === 200) {
          this.progress = 0
        }
      }
    },
    // 检查上传的要求
    async doCheck(file) {
      let message = ''
      let res = true
      if (!this.checkType(file)) {
        res = false
        message = `您的文件 “${file.name}” 不是支持上传的类型。`
      } else if (!this.checkLimit(file)) {
        res = false
        message = `文件请控制在 ${this.limit[1]}${this.limit[2]} 内，您的文件为 ${this.checkLimit(file, false)}`
        if (this.limit[0] > 0) {
          message = `文件大小不符合要求，，大小应介于 ${this.limit[0]}${this.limit[2]} - ${this.limit[1]}${this.limit[2]} 之间`
        }
      } else if (this.checkType(file, false) === 'image' && !await this.checkSize(file)) {
        res = false
        message = `您的图片尺寸不符合要求，请上传${this.size[0]} × ${this.size[1]}px的图片`
      }
      if (!res) {
        this.$message({
          type: 'error',
          message
        })
        this.$ref.baseuploader.clearFiles()
      }
      return res
    },
    // 开始上传文件
    async doUpload(params, file) {
      const client = new OSS(params[0])
      const filename = `${params[1].path + params[1].fileName}.${this.getFileType(file.name)}`
      const _this = this
      const { bucket, name, res } = await client.multipartUpload(filename, file, {
        partSize: _this.setPartSize(file.size),
        progress: async function(p, checkpoint) {
          _this.progress = p === 1 ? 100 : (p * 100).toFixed(2)
          _this.filePoint = checkpoint
        }
      })
      return { bucket, name, res }
    },
    // 获取STS授权
    async getSTS() {
      const result = []
      const data = await this.$post('upload/stsUpload', { number: 1 })
      if (data.code === '200') {
        // 实例化OSS时的参数
        const config = {
          accessKeyId: data.data.accessKeyId,
          accessKeySecret: data.data.accessKeySecret,
          region: data.data.endpoint,
          bucket: data.data.bucket,
          stsToken: data.data.securityToken
        }
        const file = {
          path: data.data.path,
          fileName: data.data.file_name[0]
        }
        result.push(config, file)
      } else {
        this.$message({
          type: 'error',
          message: '获取授权失败'
        })
      }
      return result
    },
    // 设置分片大小, 根据文件大小确定分片的大小，进度条走数时会好看一些
    setPartSize(fileSize) {
      const size = this.formatUnit(fileSize).split(' ')
      let num = size[1] === 'GB' ? 819200 : 102400
      if (size[1] === 'MB') {
        if (size[0] <= 10) {
          num = 307200
        }
        num = size[0] <= 10 ? 307200 : 512000
      }
      return num
    },
    // 从文件名中获取文件类型, 返回 string
    getFileType(name) {
      const post = name.lastIndexOf('.')
      return post < 0 ? '' : name.slice(post * 1 + 1).toLowerCase()
    },
    // async func: 获取图片尺寸
    getImageSize(file) {
      const blob = URL.createObjectURL(file)
      const image = document.createElement('img')
      image.src = blob
      return new Promise(resolve => {
        image.addEventListener('load', () => {
          const height = image.naturalHeight
          const width = image.naturalWidth
          resolve({ width, height })
        })
      })
    },
    // 检查图片尺寸， 返回 bool 或 object
    async checkSize(file, returnBool = true) {
      const { width, height } = await this.getImageSize(file)
      let res = returnBool || { width, height }
      if (returnBool) {
        if (this.size.length < 3) { throw new Error('size 参数为3个') }
        const w = parseInt(this.size[0]) > -1 ? parseInt(this.size[0]) : 0
        const h = parseInt(this.size[1]) > -1 ? parseInt(this.size[1]) : 0
        const s = parseInt(this.size[2]) < 1 ? 1 : this.size[2]
        res = w === h && w === 0
        if (!res) {
          if (w === 0 && h > 0) {
            res = height === h
          } else if (w > 0 && h === 0) {
            res = width === w
          } else {
            if (s === 1) {
              res = width === w && height === h
            } else {
              const f1 = (w / h).toFixed(4)
              const f2 = (width / height).toFixed(4)
              // 比例是否正确
              res = f1 * 10000 === f2 * 10000
              // 再检查 size 是否在合理范围内
              res = res ? (width <= Math.ceil(w * s) && width >= w) && (height <= Math.ceil(h * s) && height >= h) : false
            }
          }
        }
      }
      return res
    },
    // 检查文件大小, 返回 bool 或 string
    checkLimit(file, returnBool = true) {
      let res = returnBool || '0 KB'
      if (returnBool) {
        res = file.size > 0
        // 1. 确保传入的参数是正确的
        if (this.limit.length < 3) { throw new Error('limit 参数是3个元素的数组') }
        const min = parseInt(this.limit[0]) > -1 ? parseInt(this.limit[0]) : 0
        const max = parseInt(this.limit[1]) > -1 ? parseInt(this.limit[1]) : 0
        if (min > max) { throw new Error('limit[0] 必须 <= limit[1]') }
        const enums = ['KB', 'MB', 'GB']
        const unit = enums.includes(this.limit[2].toLowerCase()) ? this.limit[2].toLowerCase() : 'KB'

        // 开始计算是否在正确的范围内
        const units = { 'KB': 1024, 'MB': 1048576, 'GB': 1073741824 }
        if (min < 1 && max > 0) {
          res = (file.size / units[unit]) <= max
        } else if (min > 0 && max > 0) {
          res = (file.size / units[unit]) >= min && (file.size / units[unit]) <= max
        }
      } else {
        res = this.formatUnit(file.size)
      }
      return res
    },
    // 格式化size单位
    formatUnit(size) {
      let fileSize = (size / 1048576).toFixed(2)
      if (size < 1024) {
        fileSize = `${size} 字节`
      } else if (size < 1048576) {
        fileSize = `${(size / 1024).toFixed(2)} KB`
      } else if (size < 1073741824) {
        fileSize = `${(size / 1048576).toFixed(2)} MB`
      } else {
        fileSize = `${(size / 1073741824).toFixed(2)} GB`
      }
      return fileSize
    },
    // 检查文件类型, 返回 bool 或 String
    checkType(file, returnBool = true) {
      let res = returnBool || ''
      if (returnBool) {
        switch (this.$typeof(this.type)) {
          case 'String':
            if (this.type === 'doc') {
              res = this.doc.includes(this.getFileType(file.name))
            } else if (this.type === 'image' || this.type === 'video') {
              res = file.type.indexOf(this.type) === 0
            }
            break
          case 'Array':
            res = this.type.includes(this.getFileType(file.name))
            break
        }
      } else {
        if (file.type.indexOf('image') === 0) {
          res = 'image'
        } else if (file.type.indexOf('video') === 0) {
          res = 'video'
        } else {
          res = 'file'
        }
      }
      return res
    }
  }
}
</script>

