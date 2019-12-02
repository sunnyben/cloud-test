const fs  = window.require('fs').promises
const path = window.require('path')

const fileHelper = {
  readFile: (path, cb) => {
    return fs.readFile(path, {encoding: 'utf8'})
  },
  writeFile: (path, content, cb) => {
    return fs.writeFile(path, content, {encoding: 'utf8'})
  },
  renameFile: (path, newPath) => {
    return fs.rename(path, newPath)
  },
  deleteFile: (path) => {
    return fs.unlink(path)
  }
}

export default fileHelper

// const fileHelper = {
//   readFile: (path, cb) => {
//     fs.readFile(path, {encoding: 'utf8'}, (err, data) => {
//       if(!err) {
//         cb(data)
//       }
//     })
//   },
//   writeFile: (path, content, cb) => {
//     fs.writeFile(path, content, {encoding: 'utf8'}, (err) => {
//       if(!err) {
//         cb()
//       }
//     })
//   }
// }


// const testPath = path.join(__dirname, 'helper.js')
// const testWritePath = path.join(__dirname, 'hello.md')

// fileHelper.readFile(testPath, (data) => {
//   console.log('------data------', data)
// })

// fileHelper.writeFile(testWritePath, '## hello123', () => {
//   console.log('------写入成功------')
// })