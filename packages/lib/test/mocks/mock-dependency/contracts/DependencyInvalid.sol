pragma solidity ^0.5.0;

contract DependencyWithConstructor {
  uint256 public dependencyValue;
  constructor() public {
    dependencyValue = 42;
  }
}