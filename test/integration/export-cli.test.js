import { join } from 'path'
import fs from 'fs'

import mkdirp from 'mkdirp'
import nixt from 'nixt'
import rimraf from 'rimraf'

jest.setTimeout(15000)

const bin = join(__dirname, '../../', 'bin')
const tmpFolder = join(__dirname, 'tmp-cli')
const app = () => {
  return nixt({ newlines: true }).cwd(bin).base('./contentful-export').clone()
}

const spaceId = process.env.EXPORT_SPACE_ID
const managementToken = process.env.MANAGEMENT_TOKEN
let filePath = null

beforeAll(() => {
  mkdirp.sync(tmpFolder)
})

afterAll(() => {
  rimraf.sync(tmpFolder)
})

test('It should export space properly when running as a cli', (done) => {
  app()
    .run(` --space-id ${spaceId} --management-token ${managementToken} --export-dir ${tmpFolder}`)
    .code(0)
    .stdout(/Exported entities/)
    .stdout(/Content Types +.+│ 2/)
    .stdout(/Editor Interfaces +.+│ 2/)
    .stdout(/Entries +.+│ 4/)
    .stdout(/Assets +.+│ 4/)
    .stdout(/Locales +.+│ 1/)
    .stdout(/Webhooks +.+│ 0/)
    .stdout(/Roles +.+│ 7/)
    .end(() => {
      const fileList = fs.readdirSync(tmpFolder)
      if (!fileList.length) {
        throw new Error('No file was exported. Did you set EXPORT_SPACE_ID and MANAGEMENT_TOKEN env variables?')
      }
      filePath = fileList.find((filename) => filename.match(/master/))
      const exportedFile = JSON.parse(fs.readFileSync(join(tmpFolder, filePath)))
      expect(exportedFile.contentTypes).toHaveLength(2)
      expect(exportedFile.editorInterfaces).toHaveLength(2)
      expect(exportedFile.entries).toHaveLength(4)
      expect(exportedFile.assets).toHaveLength(4)
      expect(exportedFile.locales).toHaveLength(1)
      expect(exportedFile.webhooks).toHaveLength(0)
      expect(exportedFile.roles).toHaveLength(7)
      done()
    })
})

test('It should export environment properly when running as a cli', (done) => {
  mkdirp.sync(tmpFolder)
  app()
    .run(` --space-id ${spaceId} --environment-id staging --management-token ${managementToken} --export-dir ${tmpFolder}`)
    .code(0)
    .stdout(/Exported entities/)
    .stdout(/Content Types +.+│ 2/)
    .stdout(/Editor Interfaces +.+│ 2/)
    .stdout(/Entries +.+│ 4/)
    .stdout(/Assets +.+│ 4/)
    .stdout(/Locales +.+│ 1/)
    .stdout(/Webhooks can only be exported from master environment/)
    .stdout(/Roles can only be exported from master environment/)
    .end(() => {
      const fileList = fs.readdirSync(tmpFolder)
      if (!fileList.length) {
        throw new Error('No file was exported. Did you set EXPORT_SPACE_ID and MANAGEMENT_TOKEN env variables?')
      }
      filePath = fileList.find((filename) => filename.match(/staging/))
      const exportedFile = JSON.parse(fs.readFileSync(join(tmpFolder, filePath)))
      expect(exportedFile.contentTypes).toHaveLength(2)
      expect(exportedFile.editorInterfaces).toHaveLength(2)
      expect(exportedFile.entries).toHaveLength(4)
      expect(exportedFile.assets).toHaveLength(4)
      expect(exportedFile.locales).toHaveLength(1)
      expect(exportedFile).not.toHaveProperty('webhooks')
      expect(exportedFile).not.toHaveProperty('roles')
      rimraf(tmpFolder, () => {
        done()
      })
    })
})
