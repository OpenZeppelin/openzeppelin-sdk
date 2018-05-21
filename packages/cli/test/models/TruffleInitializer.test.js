'use strict'
require('../setup')

import { FileSystem as fs } from 'zos-lib'
import { cleanup } from '../helpers/cleanup.js'
import TruffleInitializer from '../../src/models/truffle/TruffleInitializer'

contract('TruffleInitializer', function () {
  const tmpDir = "test/tmp";
  const contractsDir = `${tmpDir}/contracts`
  const migrationsDir = `${tmpDir}/migrations`
  const truffleConfigFile = `${tmpDir}/truffle-config.js`
  const truffleConfigPath = `${process.cwd()}/${truffleConfigFile}`

  afterEach('cleanup files & folders', function () {
    cleanup(`${contractsDir}/.gitkeep`)
    cleanup(`${contractsDir}/Sample.sol`)
    cleanup(contractsDir)
    cleanup(`${migrationsDir}/01_sample.js`)
    cleanup(`${migrationsDir}/.gitkeep`)
    cleanup(migrationsDir)
    cleanup(truffleConfigFile)
  })

  it('should create an empty contracts folder if missing', async function () {
    TruffleInitializer.call(tmpDir)

    fs.exists(contractsDir).should.be.true
    fs.readDir(contractsDir).should.have.lengthOf(1)
    fs.readDir(contractsDir).should.include('.gitkeep')
  })

  it('should not create an empty contracts folder if present', async function () {
    fs.createDir(contractsDir)
    fs.write(`${contractsDir}/Sample.sol`)
    TruffleInitializer.call(tmpDir)

    fs.exists(contractsDir).should.be.true
    fs.readDir(contractsDir).should.have.lengthOf(1)
    fs.readDir(contractsDir).should.include('Sample.sol')
  })

  it('should create an empty migrations folder if missing', async function () {
    TruffleInitializer.call(tmpDir)

    fs.exists(migrationsDir).should.be.true
    fs.readDir(migrationsDir).should.have.lengthOf(1)
    fs.readDir(migrationsDir).should.include('.gitkeep')
  })

  it('should not create an empty migrations folder if present', async function () {
    fs.createDir(migrationsDir)
    fs.write(`${migrationsDir}/01_sample.js`)
    TruffleInitializer.call(tmpDir)

    fs.exists(migrationsDir).should.be.true
    fs.readDir(migrationsDir).should.have.lengthOf(1)
    fs.readDir(migrationsDir).should.include('01_sample.js')
  })

  it('should create a truffle config file if missing', async function () {
    TruffleInitializer.call(tmpDir)

    fs.exists(truffleConfigFile).should.be.true
  })

  it('should not create a truffle config file if present', async function () {
    fs.write(truffleConfigFile, '')
    TruffleInitializer.call(tmpDir)

    fs.read(truffleConfigPath).should.have.lengthOf(0)
  })
})
