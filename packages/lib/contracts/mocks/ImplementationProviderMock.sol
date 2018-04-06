pragma solidity ^0.4.21;

import '../ImplementationProvider.sol';

/**
 * @title ImplementationProviderMock
 * @dev This contract is a mock to test upgradeability functionality
 */
contract ImplementationProviderMock is ImplementationProvider {
  address public implementation;

  function ImplementationProviderMock(address _implementation) public {
    implementation = _implementation;
  }

  function getImplementation(string /*distribution*/, string /*version*/, string /*contractName*/) public view returns (address) {
    return implementation;
  }
}
