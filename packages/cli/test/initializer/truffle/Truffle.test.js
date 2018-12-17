require('../../setup')

import { FileSystem } from 'zos-lib'
import Truffle from '../../../src/models/initializer/truffle/Truffle'

contract('Truffle', () => {
  const testDir = `${process.cwd()}/test/tmp`
  
  beforeEach('create test dir', function () {
    FileSystem.createDir(testDir)
  })

  afterEach('remove test dir', function () {
    FileSystem.removeTree(testDir)
  })

  describe('existsTruffleConfig', function () {

    it('returns true when there is a truffle.js file', function () {
      FileSystem.write(`${testDir}/truffle.js`, 'dummy')

      Truffle.existsTruffleConfig(testDir).should.be.true
    })

    it('returns true when there is a truffle-config.js file', function () {
      FileSystem.write(`${testDir}/truffle-config.js`, 'dummy')

      Truffle.existsTruffleConfig(testDir).should.be.true
    })

    it('returns true when there are both truffle config files', function () {
      FileSystem.write(`${testDir}/truffle.js`, 'dummy')
      FileSystem.write(`${testDir}/truffle-config.js`, 'dummy')

      Truffle.existsTruffleConfig(testDir).should.be.true
    })

    it('returns false when there is no truffle config file', function () {
      FileSystem.write(`${testDir}/bla.js`, 'dummy')

      Truffle.existsTruffleConfig(testDir).should.be.false
    })
  })

  describe('isTruffleProject', function () {
    describe('when there is a truffle dependency', function () {
      beforeEach('create truffle config file', function () {
        FileSystem.createDir(`${testDir}/node_modules`)
        FileSystem.createDir(`${testDir}/node_modules/truffle`)
      })

      describe('when there is a truffle config file', function () {
        beforeEach('create truffle config file', function () {
          FileSystem.write(`${testDir}/truffle-config.js`, 'dummy')
        })

        it('returns true', function () {
          Truffle.isTruffleProject(testDir).should.be.true
        })
      })

      describe('when there is no truffle config file', function () {
        it('returns false', function () {
          Truffle.isTruffleProject(testDir).should.be.false
        })
      })
    })

    describe('when there is no truffle dependency', function () {
      describe('when there is a truffle config file', function () {
        beforeEach('create truffle config file', function () {
          FileSystem.write(`${testDir}/truffle-config.js`, 'dummy')
        })

        it('returns false', function () {
          Truffle.isTruffleProject(testDir).should.be.false
        })
      })

      describe('when there is no truffle config file', function () {
        it('returns false', function () {
          Truffle.isTruffleProject(testDir).should.be.false
        })
      })
    })
  })
})
