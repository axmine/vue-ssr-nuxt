import Vue from 'vue'
// autoload svg file
// const svg = require.context('@/assets/svg', false, /\.svg$/)
// function requireSvg(req) {
//   req.keys().map(req)
// }
// requireSvg(svg)

// register base components
const requireComponent = require.context(
  '../components/base/',
  false,
  /_base-[\w-]+\.vue$/
)
requireComponent.keys().forEach(fileName => {
  const componentConfig = requireComponent(fileName)
  // eslint-disable-next-line
  const componentName = _.upperFirst(_.camelCase(fileName.replace(/^\.\/_/, '').replace(/\.\w+$/, '')))
  Vue.component(componentName, componentConfig.default || componentConfig)
})
