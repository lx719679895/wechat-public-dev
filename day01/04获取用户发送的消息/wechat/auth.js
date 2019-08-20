
const sha1 = require('sha1')

const config = require('../config')
const {getUserDataAsync,parseXmlAsync} = require('../utils/tools')


module.exports = () => {
  return async (req, res, next) => {
    /**
     * 验证微信签名
     */
    //1、将参与微信加密签名的三个参数（timestamp、nonce、token）按照字典序排序并组合成数组
    const {signature, echostr, timestamp, nonce} = req.query
    const {token} = config

    //2、将组合的数组拼接成字符串并进行sha1加密
    const sha1Str = sha1([timestamp, nonce, token].sort().join(''))

    /**
     * 微信服务器会发送两种类型的消息给开发者服务器
     *  1.GET请求
     *  -验证服务器的有效性
     *  2.POST请求
     *  -微信服务器会将用户发送的数据以POST请求方式转发到开发者服务器上
     */

    if (req.method === 'GET') {
      //3、将加密完成的字符串和微信的signature对比
      if (sha1Str === signature) {
        //如果一样，说明消息来自于服务器，返回echostr给微信服务器
        res.send(echostr)
      } else {
        //如果不一样，说明不是微信服务器发送的消息，返回error
        res.end('error')
      }
    } else if (req.method === 'POST') {
      //验证消息来自于微信服务器
      if (sha1Str !== signature) {
        res.end('error')
      } else {

        const xmlData = await getUserDataAsync(req)
        // console.log(xmlData)
        /*
        <xml>
          <ToUserName><![CDATA[gh_1be50d0480da]]></ToUserName> //开发者id
          <FromUserName><![CDATA[okeb5wwZsyKiaB1nkhjzt8kVJjek]]></FromUserName> //用户openid
          <CreateTime>1566282822</CreateTime> //发送时间戳
          <MsgType><![CDATA[text]]></MsgType> //消息类型
          <Content><![CDATA[111]]></Content> //消息内容
          <MsgId>22423776844082577</MsgId> //消息id，微信服务器会默认保存三天用户发送的数据，可以用消息id去查询消息数据
        </xml>
         */

        //将xml数据解析为js对象
        const message = await parseXmlAsync(xmlData)
        console.log(message)

        //简单的自动回复，回复文本内容
        /**
         * 一旦遇到下面的情况，微信都会在公众号会话中向用户下发系统提示'该公众号提供的服务出现故障，请稍后再试'：
         *  1、开发者在5秒内未回复任何内容
         *  2、开发者回复了异常数据，比如JSON数据、字符串数据、xml数据中有多余空格****等
         * 另外，请注意，回复图片（不支持gif动图）等多媒体消息时需要预先通过素材管理接口上传临时素材到微信服务器，
         * 可以使用素材管理中的临时素材，也可以使用永久素材。
         */

        //判断消息类型
        if (message.MsgType === 'text') {
          let content = '您说什么？我听不懂！'
          if (message.Content === '1') { //全匹配
            content = '您真牛！'
          } else if (message.Content === '2') {
            content = '您真2！'
          } else if (message.Content.match('哈')) {
            content = '哈哈哈哈，您真搞笑😆'
          }

          let replayMessage = `<xml>
                              <ToUserName><![CDATA[${message.FromUserName}]]></ToUserName>
                              <FromUserName><![CDATA[${message.ToUserName}]]></FromUserName>
                              <CreateTime>${Date.now()}</CreateTime>
                              <MsgType><![CDATA[text]]></MsgType>
                              <Content><![CDATA[${content}]]></Content>
                            </xml>`

          res.send(replayMessage)
        }

        //如果开发者没有响应给微信服务器，微信服务器会发送三次请求过来
        res.end('')
      }
    } else {
      res.end('error')
    }
  }
}
