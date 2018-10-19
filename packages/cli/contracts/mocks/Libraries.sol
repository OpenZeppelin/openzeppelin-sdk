pragma solidity ^0.4.24;

library UintLib {
  function double(uint256 self) public pure returns (uint256) {
    return self * 2;
  }
}

library NumberLib {
  struct Number {
    uint256 x;
  }

  function double(Number storage self) public {
    self.x = self.x * 2;
  }
}