// @ts-check

const fs = require('fs/promises')
const sharp = require('sharp')
const path = require('path')
const config = require('./compress.config')
const { Dirent } = require('fs')
const { isImage, ensureDir, cleanDir, withoutFileType } = require('./utils')
const { zip } = require('zip-a-folder')

let duration = 0

let totalFile = 0
let totalFolder = 0

/**
 * @type {string[]}
 */
let compressedFile = []

let copyFileCount = 0

/**
 * @type {string[]}
 */
let failedFiles = []

/**
 * 
 * @param {Dirent} file
 * @param {string} outputPath 
 * @param {number} maxSize 
 * @returns {Promise<any>}
 */
async function compressImg(file, outputPath, maxSize) {
  const fileFullPath = path.join(file.path, file.name)
  const stats = await fs.stat(fileFullPath)
  const fileSize = stats.size

  try {
    // file size exceed max size
    if(isImage(file.name) && +fileSize > maxSize)  {
      const scaleFactor = Math.sqrt(maxSize / +fileSize);

      const $s = sharp(fileFullPath)
      const metadata = await $s.metadata();

      if(metadata.width) {
        compressedFile.push(`${file.name} ${(fileSize / config.Unit.MB).toFixed(2)} MB`)

        return await $s
          .resize(Math.round(metadata.width * scaleFactor))
          .toFormat('jpeg')
          .toFile(path.resolve(`${outputPath}/${withoutFileType(file.name)}.jpg`))
      }
    }
    // copy file
    else {
      return fs
        .copyFile(fileFullPath, path.join(outputPath,file.name))
        .then(() => copyFileCount += 1)
    }
  } catch (error) {
    failedFiles.push(path.join(file.path, file.name))
    console.log('error', error)
  }
}

/**
 * 
 * @param {string} pathName
 * @returns {Promise<Promise<any>[]>}
 * @description recursively compress/copy img and create sub folder
 */
async function handlerInput(pathName) {
  const fileList = await fs.readdir(pathName, { withFileTypes: true })
  const promises = fileList.map(async (item) => {
    const dirArr = item.path.split('\\')
    dirArr.shift()
    dirArr.unshift(config.output)
    const destDir = path.join(...dirArr)


    if(item.isFile()) {
      totalFile += 1
      return await compressImg(item, destDir, config.maxSize)
    }
    else if(item.isDirectory()) {
      totalFolder += 1
      fs.mkdir(path.join(destDir, item.name))
      return await handlerInput(path.join(item.path, item.name))
    }
  })

  return promises
}

/**
 * 
 * @param {string} dirPath
 * @returns {Promise<void | Error>}
 */
async function writeZip(dirPath) {
  await zip(
    path.resolve(dirPath),
    path.resolve(`${dirPath}.zip`),
  )

  const files = await fs.readdir(dirPath, { withFileTypes: true })

  await Promise.all(
    files
      .filter((i) => i.isDirectory())
      .map((dir) => writeZip(path.join(dir.path, dir.name)))
  )
}

function printCompressStatus() {
  const { logSettings } = config
  console.log('files:', totalFile)
  console.log('folders:', totalFolder)
  console.log('copy: ', copyFileCount, 'files')
  console.log('compress: ', compressedFile.length, 'files')

  if(logSettings.printCompressFiles)
    compressedFile.forEach((i) => console.log(`  ${i}`))

  console.log('failed files:',failedFiles.length, 'files')
  failedFiles.forEach((i) => console.log(i))
  console.log('time:', duration, 'ms')
}

async function main() {
  const {
    input,
    output,
  } = config

  await ensureDir(input)
  await ensureDir(output)
  await cleanDir(output)

  const start = new Date()

  const tasks = await handlerInput(config.input)
  await Promise.all(tasks)
  await writeZip(output)

  const end = new Date()

  duration = end.getTime() - start.getTime()

  printCompressStatus()
}

(main)()
