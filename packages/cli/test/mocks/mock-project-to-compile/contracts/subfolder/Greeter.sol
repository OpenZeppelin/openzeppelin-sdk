pragma solidity ^0.5.0;

// Test import with path relative to project root
import "contracts/subfolder/GreeterLib.sol";

// Test import with path relative to current file
import "./GreeterLib2.sol";

// Test import from a dependency
import "mock-dependency-to-compile/contracts/subfolder/Dependency.sol";

contract Greeter {
  using GreeterLib for string;
  using GreeterLib2 for string;
  
  event Greeting(string greeting);

  function greet(string memory who) public {
    emit Greeting(who.wrap());
  }
}
