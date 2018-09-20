'use strict'

require('../setup')

import { tryRemoveSwarmHash } from '../../src/utils/contracts'

describe('contracts util functions', function() {
  describe('tryRemoveSwarmHash', function() {
    describe('with valid swarm hash', function() {
      it('removes swarm hash from bytecode', function() {
        const swarmHash = '69b1869ae52f674ffccdd8f6d35de04d578a778e919a1b41b7a2177668e08e1a'
        const swarmHashWrapper = `a165627a7a72305820${swarmHash}0029`
        const bytecode = `0x01234567890abcdef${swarmHashWrapper}`

        tryRemoveSwarmHash(bytecode).should.eq('0x01234567890abcdef')
      })
    })

    describe('with a swarm hash size different than 32 bytes', function() {
      it('does not change the bytecode', function() {
        const invalidSwarmHash = '69b1869ae52f674ffccdd8f6d35de04d578a778e919a1b4'
        const swarmHashWrapper = `27a7a72305820${invalidSwarmHash}0029`
        const bytecode = `0x01234567890abcdefa16560029${swarmHashWrapper}`

        tryRemoveSwarmHash(bytecode).should.eq(bytecode)
      })
    })

    describe('with an invalid swarm hash format', function() {
      it('does not change the bytecode', function() {
        const swarmHash = '69b1869ae52f674ffccdd8f6d35de04d578a778e919a1b41b7a2177668e08e1a'
        const invalidSwarmHashWrapper = `a165627a7a7230${swarmHash}abab29`
        const bytecode = `0x01234567890abcdef${invalidSwarmHashWrapper}`

        tryRemoveSwarmHash(bytecode).should.eq(bytecode)
      })
    })
  })
})

