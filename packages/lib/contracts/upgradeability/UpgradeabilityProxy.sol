pragma solidity ^0.4.21;

import './Proxy.sol';
import 'openzeppelin-solidity/contracts/AddressUtils.sol';

/**
 * @title UpgradeabilityProxy
 *
 * @dev This contract implements a proxy where the implementation address to
 * @dev which it will delegate can be changed. Such a change is called an
 * @dev implementation upgrade.
 */
contract UpgradeabilityProxy is Proxy {
  /**
   * @dev This event will be emitted every time the implementation is upgraded.
   * @param implementation address of the new implementation
   */
  event Upgraded(address implementation);

  /**
   * @dev Storage slot with the address of the current implementation.
   * @dev This is the hash of "org.zeppelinos.proxy.implementation", and is
   * @dev validated in the constructor.
   */
  bytes32 private constant IMPLEMENTATION_SLOT = 0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3;

  /**
   * @param _implementation address of the initial implementation
   */
  function UpgradeabilityProxy(address _implementation) public {
    assert(IMPLEMENTATION_SLOT == keccak256("org.zeppelinos.proxy.implementation"));

    _setImplementation(_implementation);
  }

  /**
   * @dev Getter for the org.zeppelinos.proxy.implementation slot.
   * @return address of the current implementation
   */
  function _implementation() internal view returns (address impl) {
    bytes32 slot = IMPLEMENTATION_SLOT;
    assembly {
      impl := sload(slot)
    }
  }

  /**
   * @dev Upgrades the proxy to a new implementation.
   * @param newImplementation address of the new implementation
   */
  function _upgradeTo(address newImplementation) internal {
    _setImplementation(newImplementation);
    emit Upgraded(newImplementation);
  }

  /**
   * @dev Setter for the org.zeppelinos.proxy.implementation slot.
   * @dev Sets the implementation address of the proxy.
   * @param newImplementation address of the new implementation
   */
  function _setImplementation(address newImplementation) private {
    require(AddressUtils.isContract(newImplementation));

    bytes32 slot = IMPLEMENTATION_SLOT;

    assembly {
      sstore(slot, newImplementation)
    }
  }
}
