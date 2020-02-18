pragma solidity ^0.5.0;

library DependencyLib {
  function wrap(string memory self) public pure returns (string memory) {
    return self;
  }
}
