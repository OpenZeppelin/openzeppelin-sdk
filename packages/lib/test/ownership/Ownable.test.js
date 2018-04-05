const Ownable = artifacts.require('Ownable')
const shouldBehaveLikeOwnable = require('./Ownable.behavior')

contract('Ownable', ([_, owner, anotherAccount]) => {
  beforeEach(async function () {
    this.ownable = await Ownable.new({ from: owner })
  })

  shouldBehaveLikeOwnable(owner, anotherAccount);
})
