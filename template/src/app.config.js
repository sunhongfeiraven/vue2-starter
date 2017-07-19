/**
 * Created by Webstorm.
 * @author taoqili
 * @date 2017/7/3
 */
export default {
  // 应用名称
  appName: '非常可乐',
  // 布局配置
  layout: {
    topbar: 2,  //0 hidden; 1 show; 2 fixed
    sidebar: 1  //0 hidden; 1 show;
  },
  // session有效时间 ms
  sessionDuration: 30 * 60 * 1000,
  // 采用auth token鉴权时的header token名称
  tokenName: 'AccessToken',
  //修改请求头
  headers: {
    'Content-Type': 'application/json'
  },
  // 首页地址
  indexPath: '/',
  // 登录页地址
  loginPath: '/user/login',
  //渲染错误处理
  errorHandler(e){
    console.log('捕获到了错误：' + e)
  }
}