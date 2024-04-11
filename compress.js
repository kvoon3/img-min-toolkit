// @ts-check

const fs = require('fs/promises')
const sharp = require('sharp')
const { consola } = require('consola')
const path = require('path')
const config = require('./compress.config')

/**
 * 
 * @param {string} dir 
 */
function ensureDir(dir) {
  return new Promise((resolve, reject) => {
    fs.access(dir)
      .then(
        () => resolve('dir exists'),
        () => fs.mkdir(dir),
      )
      .catch((error) => {
        reject(error)
      })
  })
}

/**
 * 
 * @param {string} dir 
 * @returns 
 */
async function cleanDir(dir) {
  const files = await fs.readdir(dir)
  const promises = files.map((file) => fs.unlink(path.join(dir, file)))
  return Promise.all(promises)
}

/**
 * @param {string} fileName 
 */
function withoutFileType(fileName) {
  return fileName.split('.').slice(0, -1).join('.')
}

async function main() {
  const {
    input,
    output,
    maxSize,
  } = config

  ensureDir(output)
  cleanDir(output)

  const fileNameList = await fs.readdir(input)
  fileNameList.forEach(async (fileName) => {
    const filePath = path.join(input, fileName)
    consola.log('filePath',filePath)
    const stats = await fs.stat(filePath)
    const fileSize = stats.size

    // file size exceed 5 MB
    if(+fileSize > maxSize)  {
      try {
        await sharp(filePath)
          .toFormat('jpeg', { mozjpeg:true })
          .toFile(`${output}/${withoutFileType(fileName)}.jpg`)
      } catch (error) {
        consola.log('error',error)
      }
    }
    // copy file
    else {
      try {
        await fs.copyFile(filePath, path.join(output,fileName))
      } catch (error) {
        consola.log('error',error)
      }
    }
  })
}

(main)()