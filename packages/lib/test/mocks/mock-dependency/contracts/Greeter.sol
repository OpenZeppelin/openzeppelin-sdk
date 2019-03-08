pragma solidity ^0.5.0;

contract Greeter {
  event Greeting(string greeting);

  function greet(string memory who) public {
    emit Greeting(greeting(who));
  }

  function greeting(string memory who) public pure returns (string memory) {
    return who;
  }

  function say() public pure returns (string memory) {
    return "hello";
  }
}
