pragma solidity ^0.5.0;

import "./GreeterLibLib.sol";

library GreeterLibWithLib {
  using GreeterLibLib for GreeterLibLib.StateState;

  struct State {
    GreeterLibLib.StateState state;
  }

  function getNumber(State storage self) public view returns (uint256) {
    return self.state.getANumber();
  }
}
