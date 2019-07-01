import { ZERO_ADDRESS } from '../../utils/Addresses';
import { semanticVersionEqual, toSemanticVersion } from '../../utils/Semver';

export default function assertions(chai, utils) {
  const Assertion = chai.Assertion;

  Assertion.addProperty('nonzeroAddress', function() {
    this.assert(
      this._obj && this._obj.length === 42 && this._obj.startsWith('0x') && this._obj !== ZERO_ADDRESS,
      'expected #{this} to be a non-zero address',
      'expected #{this} to not be a non-zero address',
    );
  });

  Assertion.addProperty('zeroAddress', function() {
    this.assert(
      this._obj && this._obj.length === 42 && this._obj.startsWith('0x') && this._obj === ZERO_ADDRESS,
      'expected #{this} to be a zero address',
      'expected #{this} to not be a zero address',
    );
  });

  Assertion.addMethod('semverEqual', function(expected) {
    this.assert(
      semanticVersionEqual(this._obj, expected),
      'expected #{this} to equal #{exp} but got #{act}',
      'expected #{this} to not equal #{exp} but got #{act}',
      toSemanticVersion(expected).join('.'),
      toSemanticVersion(this._obj).join('.'),
    );
  });
}
