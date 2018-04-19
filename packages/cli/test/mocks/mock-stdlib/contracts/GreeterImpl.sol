pragma solidity ^0.4.21;

contract GreeterImpl {

  event Greeting(string greeting);

  function greet(string who) public {
    emit Greeting(greeting(who));
  }

  function greeting(string who) public view returns(string) {
    return who;
  }
  
}