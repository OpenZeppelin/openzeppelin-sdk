pragma solidity ^0.5.0;

import "mock-stdlib-2/contracts/GreeterImpl.sol";

// This contract relies on GreeterImpl from mock-stdlib-2, which should clash with the GreeterImpl from ImplV1
contract ImplV1Clash is GreeterImpl {
  uint256 public value;

  function initialize(uint256 _value) public {
    value = _value;
  }

  function say() public pure returns (string memory) {
    return "ImplV1Clash";
  }
}
