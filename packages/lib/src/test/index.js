import assertions from './helpers/assertions'
import assertRevert from './helpers/assertRevert'
import shouldBehaveLikeOwnable from './behaviors/Ownable'
import shouldBehaveLikeImplementationDirectory from './behaviors/ImplementationDirectory'

const helpers = {
  assertions,
  assertRevert,
}

const behaviors = {
  shouldBehaveLikeOwnable,
  shouldBehaveLikeImplementationDirectory,
}

export {
  helpers,
  behaviors
}
