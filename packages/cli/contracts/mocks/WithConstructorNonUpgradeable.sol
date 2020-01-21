pragma solidity ^0.5.0;

contract WithConstructorNonUpgradeable {
  uint public answer;

  constructor(uint x, string memory y, uint[] memory zs) public {
    answer = x + bytes(y).length + zs[1];
  }
}
