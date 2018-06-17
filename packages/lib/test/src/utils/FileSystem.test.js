'use strict'
require('../../setup')

import tmp from 'tmp';
import FileSystem from '../../../src/utils/FileSystem'

contract('FileSystem', () => {
  it('can remove an empty directory', async function () {
    const testDir = tmp.dirSync()
    FileSystem.exists(testDir.name).should.be.true
    FileSystem.removeTree(testDir.name)
    FileSystem.exists(testDir.name).should.be.false
  })

  it('can remove a non-empty directory', async function () {
    const testDir = tmp.dirSync()
    const testFilePath = `${testDir.name}/testfile`
    FileSystem.write(testFilePath, 'dummy')
    FileSystem.exists(testFilePath).should.be.true
    FileSystem.removeTree(testDir.name)
    FileSystem.exists(testDir.name).should.be.false
  })

  it('can copy a file when the destination does not exist', function() {
    const testDir = tmp.dirSync()
    const sourceFilePath = `${testDir.name}/test`
    const destinationFilePath = `${testDir.name}/testCopy`
    FileSystem.write(sourceFilePath, 'Hello, World!')

    FileSystem.copy(sourceFilePath, destinationFilePath)

    const source = FileSystem.read(sourceFilePath).toString()
    const destination = FileSystem.read(destinationFilePath).toString()
    source.should.equal(destination)

    FileSystem.removeTree(testDir.name)
  })

  it('can copy a file when the destination already exists', function () {
    const testDir = tmp.dirSync()
    const sourceFilePath = `${testDir.name}/test`
    const destinationFilePath = `${testDir.name}/testCopy`
    FileSystem.write(sourceFilePath, 'Hello, World!')
    FileSystem.write(destinationFilePath, 'Foobar')

    FileSystem.copy(sourceFilePath, destinationFilePath)

    const source = FileSystem.read(sourceFilePath).toString()
    const destination = FileSystem.read(destinationFilePath).toString()
    source.should.equal(destination)

    FileSystem.removeTree(testDir.name)
  })
})
