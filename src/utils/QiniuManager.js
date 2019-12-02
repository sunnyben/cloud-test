const qiniu = require('qiniu')
const axios = require('axios')
const fs = require('fs')

class QiniuManager {
  constructor(accessKey, secretKey, bucket) {
    this.mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    this.bucket = bucket

    this.config = new qiniu.conf.Config();
    // 空间对应的机房
    this.config.zone = qiniu.zone.Zone_z2;

    this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config);
  }

  uploadFile(key, localFilePath) {
    var options = {
      scope: this.bucket + ':' + key,
    };
    var putPolicy = new qiniu.rs.PutPolicy(options);
    var uploadToken=putPolicy.uploadToken(this.mac);
    var formUploader = new qiniu.form_up.FormUploader(this.config);
    var putExtra = new qiniu.form_up.PutExtra();

    return new Promise((resolve, reject) => {
      // 文件上传
      formUploader.putFile(uploadToken, key, localFilePath, putExtra, this._handleCallback(resolve, reject));
    })
  }

  generateDownloadLink(key) {
    const domainPromise = this.publicBucketDomain ?
    Promise.resolve([this.publicBucketDomain]) :this.getBucketDomain()
    return domainPromise.then((data) => {
      if(Array.isArray(data) && data.length) {
        const pattern = /^http?/
        this.publicBucketDomain = pattern.test(data[0])? data[0]: `http://${data[0]}`
        return this.bucketManager.publicDownloadUrl(this.publicBucketDomain, key);
      } else {
        throw Error('域名未找到，请查看存储空间是否过期')
      }
    })
  }

  downloadFile(key, downloadPath) {
    return this.generateDownloadLink(key).then(link => {
      const timeStamp = new Date().getTime()
      const url = `${link}?timestamp=${timeStamp}`
      return axios({
        url,
        method: 'GET',
        responseType: 'stream',
        headers: {'Cache-control': 'no-cache'}
      }).then(response => {
        const writer = fs.createWriteStream(downloadPath)
        response.data.pipe(writer)
        return new Promise((resolve, reject) => {
          writer.on('finish', resolve)
          writer.on('error', reject)
        })
      }).catch((err) => {
        return Promise.reject({err})
      })
    })
  }

  deleteFile(key) {
    return new Promise((resolve, reject) => {
      this.bucketManager.delete(this.bucket, key, this._handleCallback(resolve, reject));
    })
  }

  getBucketDomain() {
    const reqURL = `http://api.qiniu.com/v6/domain/list?tbl=${this.bucket}`
    const digest = qiniu.util.generateAccessToken(this.mac, reqURL)
    return new Promise((resolve, reject) => {
      qiniu.rpc.postWithoutForm(reqURL, digest, this._handleCallback(resolve, reject));
    })
  }

  getStat(key) {
    return new Promise((resolve, reject) => {
      this.bucketManager.stat(this.bucket, key, this._handleCallback(resolve, reject))
    })
  }

  _handleCallback(resolve, reject) {
    return (respErr, respBody, respInfo) => {
      if (respErr) {
        throw respErr;
      }
      if (respInfo.statusCode === 200) {
        resolve(respBody)
        // console.log(respBody);
      } else {
        reject({
          statusCode: respInfo.statusCode,
          body: respBody
        })
        // console.log(respInfo.statusCode);
        // console.log(respBody);
      }
    }
  }
}

var accessKey = 'E7kvDnWb-1gYvjyx9VWaj9BYklQis0AT0MmcVF6U';
var secretKey = '3FxmeobftOc36wl6Aro6Mz9K4lPYLhSaCclRMVRK';
var bucket = 'electron-md'

const qn = new QiniuManager(accessKey, secretKey, bucket)
// qn.deleteFile('565656.md')
// qn.getBucketDomain().then((data) => {
//   console.log('-----getBucketDomain------', data)
// })
// qn.generateDownloadLink().then((data) => {
//     console.log('-----getBucketDomain------', data)
//   })


module.exports = QiniuManager