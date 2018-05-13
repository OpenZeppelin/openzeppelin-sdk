pragma solidity ^0.4.21;

import './UpgradeabilityProxy.sol';

/**
 * @title OwnedUpgradeabilityProxy
 *
 * @dev This contract combines an upgradeability proxy with an authorization
 * @dev mechanism for administrative tasks.
 *
 * @dev All external functions in this contract must be guarded by the
 * @dev ifProxyOwner modifier. See ethereum/solidity#3864 for a Solidity
 * @dev feature proposal that would enable this to be done automatically.
 */
contract OwnedUpgradeabilityProxy is UpgradeabilityProxy {
  /**
   * @dev Event to show ownership has been transferred
   * @param previousOwner the address of the previous owner
   * @param newOwner the address of the new owner
   */
  event ProxyOwnershipTransferred(address previousOwner, address newOwner);

  // Storage slot of the owner of the contract
  bytes32 private constant proxyOwnerSlot = keccak256("org.zeppelinos.proxy.owner");

  /**
   * @dev Will run this function if the sender is the proxy owner.
   * @dev Otherwise it will fall back to the implementation.
   */
  modifier ifProxyOwner() {
    if (msg.sender == _proxyOwner()) {
      _;
    } else {
      _fallback();
    }
  }

  /**
   * @dev The constructor assigns proxy ownership to the sender account.
   * @param _implementation address of the initial implementation
   */
  function OwnedUpgradeabilityProxy(address _implementation) UpgradeabilityProxy(_implementation) public {
    _setProxyOwner(msg.sender);
  }

  /**
   * @return the address of the proxy owner
   */
  function proxyOwner() external view ifProxyOwner returns (address owner) {
    return _proxyOwner();
  }

  /**
   * @return the address of the implementation
   */
  function implementation() external view ifProxyOwner returns (address) {
    return _implementation();
  }

  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param newOwner the address which to transfer proxy ownership
   */
  function transferProxyOwnership(address newOwner) external ifProxyOwner {
    require(newOwner != address(0));
    emit ProxyOwnershipTransferred(_proxyOwner(), newOwner);
    _setProxyOwner(newOwner);
  }

  /**
   * @dev Allows the proxy owner to upgrade the backing implementation.
   * @param newImplementation the address of the new implementation
   */
  function upgradeTo(address newImplementation) external ifProxyOwner {
    _upgradeTo(newImplementation);
  }

  /**
   * @dev Allows the proxy owner to upgrade the current version of the proxy
   * @dev and call a function on the new implementation to initialize whatever
   * @dev is needed.
   *
   * @param implementation the address of the new implementation to be set.
   * @param data represents the msg.data to bet sent in the low level call. This parameter may include the function
   * signature of the implementation to be called with the needed payload
   */
  function upgradeToAndCall(address implementation, bytes data) payable external ifProxyOwner {
    _upgradeTo(implementation);
    require(this.call.value(msg.value)(data));
  }

  /**
   * @dev Getter for the org.zeppelinos.proxy.owner slot.
   * @return address of the proxy owner
   */
  function _proxyOwner() internal returns (address owner) {
    bytes32 slot = proxyOwnerSlot;
    assembly {
      owner := sload(slot)
    }
  }

  /**
   * @dev Setter for the org.zeppelinos.proxy.owner slot.
   * @dev Sets the address of the proxy owner
   * @param newProxyOwner address of the new proxy owner
   */
  function _setProxyOwner(address newProxyOwner) internal {
    bytes32 slot = proxyOwnerSlot;

    assembly {
      sstore(slot, newProxyOwner)
    }
  }

  /**
   * @dev Only fall back when the sender is not the proxyOwner.
   */
  function _willFallback() internal {
    require(msg.sender != _proxyOwner());
    super._willFallback();
  }
}
