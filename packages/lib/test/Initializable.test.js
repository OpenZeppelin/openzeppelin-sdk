const assertRevert = require('./helpers/assertRevert')
const InitializableMock = artifacts.require('InitializableMock')

contract('Initializable', ([]) => {
  beforeEach(async function () {
    this.initializable = await InitializableMock.new()
  })

  describe('initialize', function () {
    it('can be called once', async function () {
      await this.initializable.initialize(42)
      const x = await this.initializable.x()

      assert.equal(x, 42)
      await assertRevert(this.initializable.initialize(100))
    })
  })
})
