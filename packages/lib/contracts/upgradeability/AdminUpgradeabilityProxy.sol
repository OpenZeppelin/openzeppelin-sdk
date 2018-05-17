pragma solidity ^0.4.21;

import './UpgradeabilityProxy.sol';

/**
 * @title AdminUpgradeabilityProxy
 *
 * @dev This contract combines an upgradeability proxy with an authorization
 * @dev mechanism for administrative tasks.
 *
 * @dev All external functions in this contract must be guarded by the
 * @dev ifAdmin modifier. See ethereum/solidity#3864 for a Solidity
 * @dev feature proposal that would enable this to be done automatically.
 */
contract AdminUpgradeabilityProxy is UpgradeabilityProxy {
  /**
   * @dev Event to show administration has been transferred
   * @param previousAdmin the address of the previous admin
   * @param newAdmin the address of the new admin
   */
  event AdminChanged(address previousAdmin, address newAdmin);

  /**
   * @dev Storage slot with the admin of the contract.
   * @dev This is the hash of "org.zeppelinos.proxy.admin", and is validated in
   * @dev the constructor.
   */
  bytes32 private constant ADMIN_SLOT = 0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b;

  /**
   * @dev Will run this function if the sender is the admin.
   * @dev Otherwise it will fall back to the implementation.
   */
  modifier ifAdmin() {
    if (msg.sender == _admin()) {
      _;
    } else {
      _fallback();
    }
  }

  /**
   * @dev The constructor assigns proxy administration to the sender account.
   * @param _implementation address of the initial implementation
   */
  function AdminUpgradeabilityProxy(address _implementation) UpgradeabilityProxy(_implementation) public {
    assert(ADMIN_SLOT == keccak256("org.zeppelinos.proxy.admin"));

    _setAdmin(msg.sender);
  }

  /**
   * @return the address of the proxy admin
   */
  function admin() external view ifAdmin returns (address) {
    return _admin();
  }

  /**
   * @return the address of the implementation
   */
  function implementation() external view ifAdmin returns (address) {
    return _implementation();
  }

  /**
   * @dev Allows the current admin to transfer control of the proxy.
   * @param newAdmin the address which to transfer proxy administration 
   */
  function changeAdmin(address newAdmin) external ifAdmin {
    require(newAdmin != address(0));
    emit AdminChanged(_admin(), newAdmin);
    _setAdmin(newAdmin);
  }

  /**
   * @dev Allows the proxy admin to upgrade the backing implementation.
   * @param newImplementation the address of the new implementation
   */
  function upgradeTo(address newImplementation) external ifAdmin {
    _upgradeTo(newImplementation);
  }

  /**
   * @dev Allows the proxy admin to upgrade the current version of the proxy
   * @dev and call a function on the new implementation to initialize whatever
   * @dev is needed.
   *
   * @param implementation the address of the new implementation to be set.
   * @param data represents the msg.data to bet sent in the low level call. This parameter may include the function
   * signature of the implementation to be called with the needed payload
   */
  function upgradeToAndCall(address implementation, bytes data) payable external ifAdmin {
    _upgradeTo(implementation);
    require(address(this).call.value(msg.value)(data));
  }

  /**
   * @dev Getter for the org.zeppelinos.proxy.admin slot.
   * @return address of the proxy admin
   */
  function _admin() internal returns (address admin) {
    bytes32 slot = ADMIN_SLOT;
    assembly {
      admin := sload(slot)
    }
  }

  /**
   * @dev Setter for the org.zeppelinos.proxy.admin slot.
   * @dev Sets the address of the proxy admin
   * @param newAdmin address of the new proxy admin
   */
  function _setAdmin(address newAdmin) internal {
    bytes32 slot = ADMIN_SLOT;

    assembly {
      sstore(slot, newAdmin)
    }
  }

  /**
   * @dev Only fall back when the sender is not the admin.
   */
  function _willFallback() internal {
    require(msg.sender != _admin());
    super._willFallback();
  }
}
