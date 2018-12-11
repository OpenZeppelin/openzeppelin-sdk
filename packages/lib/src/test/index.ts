// TS-TODO: see why assertions needs to be imported differently.
import * as assertions from './helpers/assertions';
import assertEvent from './helpers/assertEvent';
import assertRevert from './helpers/assertRevert';
import shouldBehaveLikeOwnable from './behaviors/Ownable';

const helpers = {
  assertions,
  assertRevert,
  assertEvent,
};

const behaviors = {
  shouldBehaveLikeOwnable,
};

export {
  helpers,
  behaviors
};
