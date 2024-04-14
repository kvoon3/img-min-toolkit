const Unit =  { MB: 1024 * 1024 }
const maxSize = 5 * Unit.MB
const input =  './img'
const output = './output'
const imgTypes = [
  'jpg',
  'jpeg',
  'png',
]
const logSettings = {
  printCompressFiles: false,
}

module.exports = {
  Unit,
  maxSize,
  input,
  output,
  imgTypes,
  logSettings,
}
