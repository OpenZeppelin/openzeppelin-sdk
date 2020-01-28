pragma solidity ^0.5.0;

// Test import with path relative to current file
import "./DependencyLib.sol";

contract Dependency {
  using DependencyLib for string;
  
  event Greeting(string greeting);

  function greet(string memory who) public {
    emit Greeting(who.wrap());
  }
}
