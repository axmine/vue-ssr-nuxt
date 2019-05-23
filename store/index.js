export const state = () => ({
  token: ''
})

export const mutations = {
  SET_TOKEN: (state, token) => {
    state.token = token || ''
  }
}

export const actions = {
  nuxtServerInit({ commit }, { req }) {
    if (req.ctx.session.token) {
      commit('SET_TOKEN', req.ctx.session.token)
    }
  },
  SetToken({ commit }, token) {
    commit('SET_TOKEN', token)
    this.$post('/auth', { token }, { baseURL: '' })
  }
}
