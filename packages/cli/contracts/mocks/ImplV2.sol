pragma solidity ^0.4.21;

import "./ImplV1.sol";

contract ImplV2 is ImplV1 {

  function migrate(uint256 newVal) public {
    value = newVal;
  }

  function say() public pure returns (string) {
    return "V2";
  }
}

contract AnotherImplV2 is ImplV2 {
  function say() public pure returns (string) {
    return "AnotherV2";
  }
}

contract UnmigratableImplV2 is ImplV2 {
  function migrate(uint256 newVal) public {
    assert(false);
  }

  function say() public pure returns (string) {
    return "UnmigratableImplV2";
  }
}
