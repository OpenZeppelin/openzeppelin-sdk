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
