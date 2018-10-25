pragma solidity ^0.4.24;

import "./GreeterBase.sol";

// This contract and its parent are used in CLI scripts/create.test.js to check initialization
// of a contract loaded from a dependency. Do not import this file or its parent from any mock 
// contract in CLI, since one of the goals of the test is to check processing a contract that
// has not been locally compiled. Also, make sure to change the absolute path in the build artifacts
// so they point to a path that does not exist in your machine, since that's the typical scenario
// for contracts loaded from libs.

contract GreeterImpl is GreeterBase {
  function clashingInitialize(string _value) public {
    value = bytes(_value).length;
  } 

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
