const config = require('../config')
const sha1 = require('sha1')

module.exports = () => {
  return (req, res, next) => {
    //微信服务器提交的参数
    console.log(req.query)
    // { signature: 'f534b0f9ab808b77300cb41002b03c6bec513689', //微信的加密签名
    //   echostr: '4739002693897355243',  //微信的随机字符串
    //   timestamp: '1566182859',  //微信发送请求的时间戳
    //   nonce: '1457731178' }  //微信的随机数字

    /**
     * 验证微信签名
     */
      //1、将参与微信加密签名的三个参数（timestamp、nonce、token）按照字典序排序并组合成数组
    const {signature, echostr, timestamp, nonce} = req.query
    const {token} = config

    const arr = [timestamp, nonce, token]
    const sortArr = arr.sort()

    //2、将组合的数组拼接成字符串并进行sha1加密
    const sha1Str = sha1(sortArr.join(''))

    //3、将加密完成的字符串和微信的signature对比
    if (sha1Str === signature) {
      //如果一样，说明消息来自于服务器，返回echostr给微信服务器
      res.send(echostr)
    } else {
      //如果不一样，说明不是微信服务器发送的消息，返回error
      res.end('error')
    }
  }
}
