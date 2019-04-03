pragma solidity ^0.4.24;

library SharedNumbers {
  function triple(uint256 self) public pure returns (uint256) {
    return self * 3;
  }
}