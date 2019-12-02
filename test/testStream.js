const fs = require('fs')
const zlib = require('zlib')

const src = fs.createReadStream('./test.js')
const writeDesc = fs.createWriteStream('./test2.zip')
// src.pipe(writeDesc)
src.pipe(zlib.createGzip()).pipe(writeDesc)