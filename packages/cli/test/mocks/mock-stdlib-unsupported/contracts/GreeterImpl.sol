pragma solidity ^0.5.0;

contract GreeterImpl {
  event Greeting(string greeting);

  function greet(string memory who) public {
    emit Greeting(greeting(who));
  }

  function greeting(string memory who) public pure returns (string memory) {
    return who;
  }

  function version() public pure returns (string memory) {
    return "1.1.0";
  }
}
