pragma solidity ^0.5.0;

library GreeterLibLib {
  struct StateState {
    uint256 aNumber;
  }

  function getANumber(StateState storage self) public view returns (uint256) {
    return self.aNumber;
  }
}
