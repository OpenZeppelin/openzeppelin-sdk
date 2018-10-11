pragma solidity ^0.4.24;

contract StorageMockSimpleOriginal {
  uint256 a;
  uint256 b;
}

contract StorageMockSimpleUnchanged {
  uint256 a;
  uint256 b;
}

contract StorageMockSimpleWithAddedVar {
  uint256 a;
  uint256 b;
  uint256 c;
}

contract StorageMockSimpleWithInsertedVar {
  uint256 a;
  uint256 c;
  uint256 b;
}

contract StorageMockSimpleWithUnshiftedVar {
  uint256 c;
  uint256 a;
  uint256 b;
}

contract StorageMockSimpleWithRenamedVar {
  uint256 a;
  uint256 c;
}

contract StorageMockSimpleWithTypeChanged {
  uint256 a;
  string b;
}

contract StorageMockSimpleWithDeletedVar {
  uint256 b;
}

contract StorageMockSimpleWithPoppedVar {
  uint256 a;
}

contract StorageMockSimpleWithReplacedVar {
  uint256 a;
  string c;
}