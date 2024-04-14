// @ts-check

const fs = require('fs/promises')
const path = require('path')

const { imgTypes } = require('./compress.config')

/**
 * 
 * @param {string} fileName
 * @returns {boolean}
 */
function isImage(fileName) {
  const ext = fileName.split('.').slice(-1)[0]
  return imgTypes.findIndex(e => e === ext) !== -1
}

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
  const files = await fs.readdir(dir, {withFileTypes: true})
  const promises = files.map((file) => fs.rm(path.join(file.path, file.name), {force: true, recursive: true}))
  return Promise.all(promises)
}

/**
 * @param {string} fileName 
 */
function withoutFileType(fileName) {
  return fileName.split('.').slice(0, -1).join('.')
}

module.exports = {
  isImage,
  ensureDir,
  cleanDir,
  withoutFileType,
}
