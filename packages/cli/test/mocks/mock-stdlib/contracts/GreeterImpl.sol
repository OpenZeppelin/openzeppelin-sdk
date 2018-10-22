pragma solidity ^0.4.24;

import "./GreeterLib.sol";

contract GreeterImpl {
  using GreeterLib for string;
  event Greeting(string greeting);

  function greet(string who) public {
    emit Greeting(greeting(who));
  }

  function greeting(string who) public pure returns (string) {
    return who.wrap();
  }

  function version() public pure returns (string) {
    return "1.1.0";
  }
}
