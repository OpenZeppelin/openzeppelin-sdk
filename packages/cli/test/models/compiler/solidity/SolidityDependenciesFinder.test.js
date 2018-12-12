require('../../../setup')

import { FileSystem } from 'zos-lib'
import SolidityDependenciesFinder from '../../../../src/models/compiler/solidity/SolidityDependenciesFinder'

describe('SolidityDependenciesFinder', function () {

  describe('when giving a dependency path', function () {
    describe('when the dependency exists', function () {
      const dependencyPath = 'zos-lib/contracts/Initializable.sol'

      it('finds the dependency', function () {
        const result = SolidityDependenciesFinder.call(dependencyPath)

        result.fileName.should.be.eq('Initializable.sol')
        result.filePath.should.include(dependencyPath)
        result.source.should.be.eq(FileSystem.read(result.filePath))
      })
    })

    describe('when the dependency does not exist', function () {
      const dependencyPath = 'zos-lib/contracts/Undefined.sol'

      it('returns undefined', function () {
        const result = SolidityDependenciesFinder.call(dependencyPath)
        assert.equal(result, undefined)
      })
    })
  })

  describe('when giving a dependency name', function () {
    describe('when the dependency exists', function () {
      const dependencyPath = 'Initializable.sol'

      it('returns undefined', function () {
        const result = SolidityDependenciesFinder.call(dependencyPath)
        assert.equal(result, undefined)
      })
    })

    describe('when the dependency does not exist', function () {
      const dependencyPath = 'Undefined.sol'

      it('returns undefined', function () {
        const result = SolidityDependenciesFinder.call(dependencyPath)
        assert.equal(result, undefined)
      })
    })
  })
})
