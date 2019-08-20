//只需要引入request-promise-native
const rp = require('request-promise-native')
const {writeFile, readFile} = require('fs')

const {appID, appsecret} = require('../config')

class Wechat {
  constructor() {

  }

  /**
   * 获取access_token
   *
   * https请求方式: GET
   * https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET
   */
  reqGetAccessToken() {
    //定义请求地址
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appID}&secret=${appsecret}`

    return new Promise((resolve, reject) => {
      //发送请求，需要用到request和request-promise-native库
      rp({method: 'GET', url, json: true})
        .then(res => {
          // { access_token:
          //   '24_fRaHCW7w301TWP9R_Fhxj6Wq5mmbR7rA3xiZUe06mqf8VFioXEHUPDlEd4jAISTVPVtfXv2lVyroXNAPhfb4iIwgDWSqQLguefkaqLbnniGNMrO0u6LzDnTOlhOHGN18JneaLlqnIwjOcqeASKLjAIADVW',
          //     expires_in: 7200 }
          res.expires_in = Date.now() + (res.expires_in - 300) * 1000
          resolve(res)
        })
        .catch(err => {
          reject('getAccessToken出错：' + err)
        })
    })
  }

  /**
   * 保存access_token
   */
  saveAccessToken(val) {
    val = JSON.stringify(val)
    return new Promise((resolve, reject) => {
      writeFile('./accessToken.txt', val, err => {
        if (!err) {
          console.log('文件保存成功')
          resolve()
        } else {
          reject('saveAccessToken出错：' + err)
        }
      })
    })
  }

  /**
   * 读取access_token
   */
  readAccessToken() {
    return new Promise((resolve, reject) => {
      readFile('./accessToken.txt', (err, data) => {
        if (!err) {
          console.log('文件读取成功')
          data = JSON.parse(data)
          resolve(data)
        } else {
          reject('readAccessToken出错：' + err)
        }
      })
    })
  }

  /**
   * 验证acces_token是否有效
   */
  isValidAccessToken(data) {
    //检测传入参数是否有效
    if (!data && !data.access_token && !data.expires_in) {
      return false
    }

    //检测access_token是否过期
    return data.expires_in > Date.now()
  }

  fetchAccessToken() {
    if (this.access_token && this.expires_in && this.isValidAccessToken(this)) {
      return Promise.resolve({
        access_token: this.access_token,
        expires_in: this.expires_in
      })
    }

    return this.readAccessToken()
      .then(async res => {
        if (this.isValidAccessToken(res)) {
          return Promise.resolve(res)
        } else {
          const res = await this.reqGetAccessToken()

          await this.saveAccessToken(res)

          return Promise.resolve(res)
        }
      })
      .catch(async () => {
        const res = await this.reqGetAccessToken()
        await this.saveAccessToken(res)
        return Promise.resolve(res)
      })
      .then(res => {
        //将access_token挂载到this上
        this.access_token = res.access_token
        this.expires_in = res.expires_in
        //返回res包装了一层promise对象（此对象为成功的状态）
        return Promise.resolve(res)
      })
  }
}

/**
 * 获取access_token整体思路：
 * 读取本地文件
 *    -本地有文件
 *        -判断access_token是否过期
 *          -过期了：重新请求获取，保存覆盖之前的文件（保证文件唯一）
 *          -没有过期：直接使用
 *    -本地无文件
 *      -发送请求获取，保存为本地文件，并直接使用
 */

//模拟测试
const w = new Wechat()

w.fetchAccessToken().then(res => {
  console.log(res)
}).catch(() => {
  console.log('fetchAccessToken出错')
})
