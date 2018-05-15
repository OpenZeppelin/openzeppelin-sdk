pragma solidity ^0.4.21;

contract Greeter {
  event Greeting(string greeting);

  function greet(string who) public {
    emit Greeting(greeting(who));
  }

  function greeting(string who) public pure returns (string) {
    return who;
  }

  function say() public pure returns (string) {
    return "hello";
  }
}
