import _ from 'lodash';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

module.exports = function (chai, utils) {
  const Assertion = chai.Assertion

  Assertion.addProperty('nonzeroAddress', function () {
    this.assert(
        this._obj 
          && this._obj.length === 42 
          && this._obj.startsWith('0x') 
          && this._obj !== ZERO_ADDRESS
      , 'expected #{this} to be a non-zero address'
      , 'expected #{this} to not be a non-zero address'
    );
  });

  Assertion.addProperty('zeroAddress', function () {
    this.assert(
        this._obj
          && this._obj.length === 42
          && this._obj.startsWith('0x')
          && this._obj === ZERO_ADDRESS
      , 'expected #{this} to be a zero address'
      , 'expected #{this} to not be a zero address'
    );
  });
}
