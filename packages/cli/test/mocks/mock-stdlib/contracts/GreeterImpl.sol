pragma solidity ^0.4.24;

contract GreeterImpl {
  event Greeting(string greeting);

  function greet(string who) public {
    emit Greeting(greeting(who));
  }

  function greeting(string who) public pure returns (string) {
    return who;
  }

  function version() public pure returns (string) {
    return "1.1.0";
  }
}
