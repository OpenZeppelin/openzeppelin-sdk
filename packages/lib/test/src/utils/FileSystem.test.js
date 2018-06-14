'use strict'
require('../../setup')

import tmp from 'tmp';
import FileSystem from '../../../src/utils/FileSystem'

contract('FileSystem', () => {
  it('can remove an empty directory', async function () {
    var testDir = tmp.dirSync()
    FileSystem.exists(testDir.name).should.be.true
    FileSystem.removeTree(testDir.name)
    FileSystem.exists(testDir.name).should.be.false
  })

  it('can remove a non-empty directory', async function () {
    var testDir = tmp.dirSync()
    var testFilePath = `${testDir.name}/testfile`
    FileSystem.write(testFilePath, 'dummy')
    FileSystem.exists(testFilePath).should.be.true
    FileSystem.removeTree(testDir.name)
    FileSystem.exists(testDir.name).should.be.false
  })

})
