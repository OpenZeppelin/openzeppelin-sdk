pragma solidity ^0.4.21;

import './UpgradeabilityProxy.sol';

/**
 * @title OwnedUpgradeabilityProxy
 * @dev OwnedUpgradeabilityProxy combines an upgradeability proxy with basic authorization control functionalities
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
   * @dev Throws if called by any account other than the owner
   */
  modifier onlyProxyOwner() {
    require(msg.sender == proxyOwner());
    _;
  }

  /**
   * @dev the constructor sets the original owner of the contract to the sender account
   * @param _implementation the address of the initial implementation to be set
   */
  function OwnedUpgradeabilityProxy(address _implementation) UpgradeabilityProxy(_implementation) public {
    setUpgradeabilityOwner(msg.sender);
  }

  /**
   * @return the address of the owner
   */
  function proxyOwner() public view returns (address owner) {
    bytes32 slot = proxyOwnerSlot;
    assembly {
      owner := sload(slot)
    }
  }

  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner
   * @param newOwner The address to transfer ownership to
   */
  function transferProxyOwnership(address newOwner) public onlyProxyOwner {
    require(newOwner != address(0));
    emit ProxyOwnershipTransferred(proxyOwner(), newOwner);
    setUpgradeabilityOwner(newOwner);
  }

  /**
   * @dev Allows the proxy owner to upgrade the current version of the proxy
   * @param implementation the address of the new implementation to be set
   */
  function upgradeTo(address implementation) public onlyProxyOwner {
    _upgradeTo(implementation);
  }

  /**
   * @dev Allows the proxy owner to upgrade the current version of the proxy and call the new implementation
   * to initialize whatever is needed through a low level call
   * @param implementation the address of the new implementation to be set
   * @param data represents the msg.data to bet sent in the low level call. This parameter may include the function
   * signature of the implementation to be called with the needed payload
   */
  function upgradeToAndCall(address implementation, bytes data) payable public onlyProxyOwner {
    upgradeTo(implementation);
    require(this.call.value(msg.value)(data));
  }

  /**
   * @dev Sets the address of the owner
   */
  function setUpgradeabilityOwner(address newProxyOwner) internal {
    bytes32 slot = proxyOwnerSlot;
    assembly {
      sstore(slot, newProxyOwner)
    }
  }
}
