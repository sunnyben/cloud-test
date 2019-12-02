const qiniu = require('qiniu')

var accessKey = 'E7kvDnWb-1gYvjyx9VWaj9BYklQis0AT0MmcVF6U';
var secretKey = '3FxmeobftOc36wl6Aro6Mz9K4lPYLhSaCclRMVRK';
var mac = new qiniu.auth.digest.Mac(accessKey, secretKey);

var options = {
  scope: 'electron-md',
};
var putPolicy = new qiniu.rs.PutPolicy(options);
var uploadToken=putPolicy.uploadToken(mac);

var config = new qiniu.conf.Config();
// 空间对应的机房
config.zone = qiniu.zone.Zone_z2;

var localFile = "C:/Users/joby.sun/Desktop/fwef/565656.md";
var formUploader = new qiniu.form_up.FormUploader(config);
var putExtra = new qiniu.form_up.PutExtra();
var key='565656.md';
// 文件上传
formUploader.putFile(uploadToken, key, localFile, putExtra, function(respErr,
  respBody, respInfo) {
  if (respErr) {
    throw respErr;
  }

  if (respInfo.statusCode === 200) {
    console.log(respBody);
  } else {
    console.log(respInfo.statusCode);
    console.log(respBody);
  }
});

var bucketManager = new qiniu.rs.BucketManager(mac, config);
var publicBucketDomain = 'http://q1kc6kwyh.bkt.clouddn.com';
// 公开空间访问链接
var publicDownloadUrl = bucketManager.publicDownloadUrl(publicBucketDomain, key);
console.log(publicDownloadUrl);
