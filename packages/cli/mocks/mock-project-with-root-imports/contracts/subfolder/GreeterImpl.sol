pragma solidity ^0.5.0;

import "contracts/subfolder/GreeterLib.sol";
import "./GreeterLib2.sol";
import "GreeterLib3.sol";

contract GreeterImpl {
  using GreeterLib for string;
  using GreeterLib2 for string;
  using GreeterLib3 for string;
  
  event Greeting(string greeting);

  function greet(string memory who) public {
    emit Greeting(greeting(who));
  }

  function greeting(string memory who) public pure returns (string memory) {
    return who.wrap();
  }

  function version() public pure returns (string memory) {
    return "1.1.0";
  }
}
