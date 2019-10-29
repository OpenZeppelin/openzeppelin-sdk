pragma solidity ^0.5.0;

import "./GreeterLibWithLib.sol";

contract GreeterLibWithLibImpl {
  using GreeterLibWithLib for GreeterLibWithLib.State;

  GreeterLibWithLib.State state;

  function greeting() public view returns (uint256) {
    return state.getNumber();
  }

  function version() public pure returns (string memory) {
    return "1.1.0";
  }
}
