pragma solidity ^0.4.21;


/**
 * @dev Implementation contract with a proxyOwner() function made to clash with
 * @dev OwnedUpgradeabilityProxy's to test correct functioning of the
 * @dev Transparent Proxy feature.
 */
contract ClashingImplementation {

  function proxyOwner() external returns (address) {
    return 0x0000000000000000000000000000000011111142;
  }

  function delegatedFunction() external pure returns (bool) {
    return true;
  }
}
