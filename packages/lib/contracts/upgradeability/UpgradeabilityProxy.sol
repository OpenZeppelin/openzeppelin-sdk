pragma solidity ^0.4.21;

import './Proxy.sol';
import 'zeppelin-solidity/contracts/AddressUtils.sol';

/**
 * @title UpgradeabilityProxy
 * @dev A proxy where the implementation address can be upgraded
 */
contract UpgradeabilityProxy is Proxy {
  /**
   * @dev Event emitted every time the implementation gets upgraded
   * @param implementation the address of the upgraded code
   */
  event Upgraded(address implementation);

  // Storage slot of the address of the current implementation
  bytes32 private constant implementationSlot = keccak256("org.zeppelinos.proxy.implementation");

  /**
   * @dev Constructor function
   * @param _implementation the address of the initial implementation to be set
   */
  function UpgradeabilityProxy(address _implementation) public {
    _setImplementation(_implementation);
  }

  /**
   * @return address of the current implementation
   */
  function implementation() public view returns (address impl) {
    bytes32 slot = implementationSlot;
    assembly {
      impl := sload(slot)
    }
  }

  /**
   * @dev Sets the address of the current implementation
   * @param newImplementation Address the new implementation to be set
   */
  function _setImplementation(address newImplementation) internal {
    require(AddressUtils.isContract(newImplementation));

    bytes32 slot = implementationSlot;
    assembly {
      sstore(slot, newImplementation)
    }

    emit Upgraded(newImplementation);
  }

  /**
   * @dev Upgrades the implementation address
   * @param newImplementation The address of the new implementation to be set
   */
  function _upgradeTo(address newImplementation) internal {
    _setImplementation(newImplementation);
  }
}
