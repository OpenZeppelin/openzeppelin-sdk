'use strict';
require('../../setup');

import { validate as validateContract } from '../../../src/validations';
import { setEthereumPackageContractsPackageName } from '../../../src/validations/VanillaContracts';
import Contracts from '../../../src/artifacts/Contracts';

describe('Validations', function() {
  describe('#hasConstructor', function() {
    it('warns when adding a contract with a constructor', async function() {
      validate('WithConstructor').hasConstructor.should.be.true;
    });

    it('warns when adding a contract with a parent with a constructor', async function() {
      validate('WithParentConstructor').hasConstructor.should.be.true;
    });

    it('warns when adding a contract with an ancestor with a constructor', async function() {
      validate('WithAncestorConstructor').hasConstructor.should.be.true;
    });

    it('warns when adding a contract with a parent from a dependency with a constructor', async function() {
      validate('WithDependencyParentConstructor').hasConstructor.should.be.true;
    });

    it('does not warn when adding a contract with an ancestor with an empty constructor', async function() {
      validate('WithAncestorEmptyConstructor').hasConstructor.should.be.false;
    });

    it('warns when adding a contract with an empty constructor with modifiers', async function() {
      validate('WithModifierInConstructor').hasConstructor.should.be.true;
    });
  });

  it('warns when adding a contract with a selfdestruct call', async function() {
    validate('WithSelfDestruct').hasSelfDestruct.should.be.true;
  });

  it('warns when adding a contract whose parent has a selfdestruct call', async function() {
    validate('WithParentWithSelfDestruct').hasSelfDestruct.should.be.true;
  });

  it('warns when adding a contract with a delegatecall call', async function() {
    validate('WithDelegateCall').hasDelegateCall.should.be.true;
  });

  it('warns when adding a contract whose parent has a delegatecall call', async function() {
    validate('WithParentWithDelegateCall').hasDelegateCall.should.be.true;
  });

  it('should not warn when adding a contract without initial values in fields declarations', async function() {
    validate('WithoutInitialValuesInFieldsDeclarations').hasInitialValuesInDeclarations.should.be.false;
  });

  it('warns when adding a contract with initial values in fields declarations', async function() {
    validate('WithInitialValuesInFieldsDeclarations').hasInitialValuesInDeclarations.should.be.true;
  });

  it('warns when adding a contract whose parent has initial values in fields declarations', async function() {
    validate('WithParentWithInitialValuesInFieldsDeclarations').hasInitialValuesInDeclarations.should.be.true;
  });

  it('warns on contract that extends ethereum pacakge openzeppelin contracts', async function() {
    setEthereumPackageContractsPackageName('mock-dependency/');
    validate('WithVanillaBaseContract').importsEthereumPackageContracts.should.include('Greeter.sol');
  });

  after(function() {
    setEthereumPackageContractsPackageName('@openzeppelin/contracts-ethereum-package/');
  });

  describe.skip('uninitialized base contracts', function() {
    it('warns when adding a contract with uninitialized base contracts', async function() {
      validate('WithBaseUninitialized').uninitializedBaseContracts.should.deep.eq([
        'WithInitialize',
        'AnotherWithInitialize',
      ]);
    });

    it('should not warn when adding a contract with initialized base contracts', async function() {
      validate('WithBaseInitialized').uninitializedBaseContracts.should.be.empty;
    });

    it('should not warn when adding a contract with a base contract that does not have initialize', async function() {
      validate('WithSimpleBaseUninitialized').uninitializedBaseContracts.should.be.empty;
    });

    it('warns when adding a contract without initializer with multiple base contracts that have initialize', async function() {
      validate('ShouldHaveInitialize').uninitializedBaseContracts.should.be.deep.eq([
        'WithInitialize',
        'AnotherWithInitialize',
      ]);
    });

    it('should not warn when adding a contract without initializer with zero or one base contract that has initialize', async function() {
      validate('DoesNotNeedAnInitialize').uninitializedBaseContracts.should.be.empty;
    });

    it('warns when adding a contract that inherits another contracts that does not initialize base contracts', async function() {
      validate('ExtendsFromShouldHaveInitialize').uninitializedBaseContracts.should.be.deep.eq([
        'WithInitialize',
        'AnotherWithInitialize',
      ]);
    });
  });
});

function validate(contractName) {
  return validateContract(Contracts.getFromLocal(contractName));
}
