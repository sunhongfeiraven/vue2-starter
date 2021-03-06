/**
 * Created by Webstorm.
 * @author taoqili
 * @date 2017/6/3
 */
import 'babel-polyfill'
import Vue from 'vue'
import VueRouter from 'vue-router'
import utils from 'utils'
import api from 'api'
import store from './store'
import config from 'config'
import App from './App'
import routes from './common/router'
import components from 'config/global'
import directive from 'directives'
import mixins from 'mixins'
import progress from 'nprogress'
import 'nprogress/nprogress.css'
import 'config/layout'

// 初始化系统模块配置信息
Vue.config.productionTip = false
Vue.config.errorHandler = config.errorHandler || new Function()

progress.configure({
  showSpinner: false
})
Vue.use(VueRouter)

components.forEach(component => {
  Vue.component(component.name, component)
})


/**-------------以下为辅助函数-------------**/
//登录超时判断
const loginTimeout = () => {
  return utils.getLoginRemainingTime() <= 0
}

//路由权限判断
const hasPermission = (permissions, routeName) => {
  permissions = permissions || []
  return permissions.indexOf(routeName) !== -1
}

//已登录且未超时的情况下，刷新页面时重建store信息
const rebuildStore = (accessToken, userInfo) => {
  //刷新时重建登录信息store
  if (accessToken) {
    if (!loginTimeout()) {
      store.commit('LOGIN', userInfo)
    } else {
      utils.removeUserInfoFromCache()
      store.commit('LOGOUT')
    }
  }
}

const checkPermission = (to, from, next) => {
  let meta = to.meta || {}
  let auth = config.defaultAuth || false
  if (meta.auth !== undefined) {
    auth = meta.auth
  }
  let accessToken = utils.getAccessToken()
  let permissions = store.getters.userInfo.permissions || []
  if (auth) {
    //1.需要登录
    if (!accessToken || loginTimeout()) {
      //2.没有登录信息或者登录已经超时
      next({name: config.loginPageName})
    } else {
      //2.正常登录状态
      if (to.name === config.loginPageName) {
        //3.访问登录页时
        if (hasPermission(permissions, config.indexPageName)) {
          //4.如果有首页权限，则直接跳转到首页
          next({name: config.indexPageName})
        } else {
          //4.没有首页权限，则继续停留在登录页
          next()
        }
      } else {
        //3.访问非登录页
        if (hasPermission(permissions, to.name)) {
          //4.如果有权限，则直接访问
          next()
        } else {
          //4.无权限则访问401
          console.warn('无权访问路由：' + to.name + ' ，请联系管理员添加！')
          next({name: '401'})
        }
      }
    }
  } else {
    // 1.不需要登录
    if (to.name === config.loginPageName) {
      // 2.如果访问的是登录页，且登录超时，则直接访问
      if (loginTimeout()) {
        // 3.登录已经超时了
        next()
      } else {
        // 3.登录未超时
        if (hasPermission(permissions, config.indexPageName)) {
          // 4.有访问首页的权限则跳到首页
          next({name: config.indexPageName})
        } else {
          // 4.没有就继续访问登录页
          next()
        }
      }
    } else {
      // 2.不是登录页直接访问
      next()
    }
  }
}

/* 以下为主流程 */

// 1.创建一个路由实例
const router = new VueRouter({
  mode: 'history',
  linkActiveClass: 'is-active',
  routes,
  scrollBehavior(to, from, savedPosition){
    if (savedPosition) {
      return savedPosition
    } else {
      let position = {}
      if (to.hash) {
        position.selector = to.hash
      }
      if (to.matched.some(m => m.meta.scrollToTop)) {
        position.x = 0
        position.y = 0
      }
      return position
    }
  }
})

// 2.应用初始化
const initApp = () => {
  //初始化全局指令和混入
  directive.init()
  mixins.init()

  // 路由权限控制
  router.beforeEach((to, from, next) => {
    console.log('即将访问路由：' + (to.name || to.path))
    progress.start()
    setTimeout(() => {
      progress.done()
    }, 5000)
    if (config.isStatic) {
      return next()
    }
    checkPermission(to, from, next)
  })

  router.afterEach(() => {
    progress.done();
  });

  let vue = new Vue({
    el: '#app',
    router,
    store,
    template: '<App/>',
    components: {App}
  })
  vue.appConfig = config
}

// 3.应用启动主流程
if (config.isStatic) {
  initApp()
} else {
  if (config.needGetUserInfoFirst) {
    api.getUserInfo().then(res => {
      let accessToken = utils.getAccessToken()
      if (accessToken && res.code === 0 && res.data) {
        rebuildStore(accessToken, res.data)
        initApp()
      } else {
        if (config.defaultAuth) {
          console.warn('当前未登录或者登录状态已经失效，仅能访问无权限页面！')
        }
        initApp()
      }
    }).catch(() => {
      initApp()
    })
  } else {
    initApp()
  }
}


