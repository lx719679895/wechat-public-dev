//引入xml2js，将xml数据转换成js对象
const {parseString} = require('xml2js')

function formatMessage(jsData) {
  let msg = {}
  jsData = jsData.xml

  if (typeof jsData === 'object') {
    for (let key in jsData) {
      let value = jsData[key]
      //过滤掉空数据
      if (Array.isArray(value) && value.length > 0) {
        msg[key] = value[0]
      }
    }
  }

  return msg
}

module.exports = {
  getUserDataAsync(req) {
    return new Promise((resolve, reject) => {
      let xmlData = ''
      req
        .on('data', data => {
          xmlData += data
        })
        .on('end', () => {
          resolve(xmlData)
        })
    })
  },

  parseXmlAsync(xmlData) {
    return new Promise((resolve, reject) => {
      parseString(xmlData, {trim: true}, (err, data) => {
        if (!err) {
          resolve(formatMessage(data))
        } else {
          reject('parseXmlAsync方法出错：' + err)
        }
      })
    })
  }
}
