const assertRevert = require('../helpers/assertRevert')
const InitializableMock = artifacts.require('InitializableMock')

contract('Initializable', ([]) => {
  beforeEach(async function () {
    this.initializable = await InitializableMock.new()
  })

  it('starts uninitialized', async function () {
    const isInitialized = await this.initializable.isInitialized()
    assert.isFalse(isInitialized)
  })

  describe('initialize', function () {
    beforeEach(async function () {
      await this.initializable.initialize(42)
    })

    it('can be called only once', async function () {
      const x = await this.initializable.x()
      assert.equal(x, 42)
      await assertRevert(this.initializable.initialize(100))
    })

    it('becomes initialized', async function () {
      const isInitialized = await this.initializable.isInitialized()
      assert.isTrue(isInitialized)
    })
  })
})
