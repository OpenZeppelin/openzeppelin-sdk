pragma solidity ^0.5.0;

contract WithConstructor {
  uint256 public value;

  constructor() public {
    value = 42;
  }

  function say() public pure returns (string memory) {
    return "WithConstructor";
  }
}

contract WithFailingConstructor {
  constructor() public {
    assert(false);
  }
}

contract WithSelfDestruct {
  uint256 public value;

  constructor() public {
    if (true)
      selfdestruct(msg.sender);
  }

  function say() public pure returns (string memory) {
    return "WithSelfDestruct";
  }
}

contract WithParentWithSelfDestruct is WithSelfDestruct {
  function say() public pure returns (string memory) {
    return "WithParentWithSelfDestruct";
  }
}

contract WithDelegateCall {
  constructor(address _e) public {
    // bytes4(keccak256("kill()")) == 0x41c0e1b5
    bytes memory data = "\x41\xc0\xe1\xb5";
    (bool success,) = _e.delegatecall(data);
    require(success);
  }
  
  function say() public pure returns (string memory) {
    return "WithDelegateCall";
  }
}

contract WithParentWithDelegateCall is WithDelegateCall {
  constructor(address _e) public WithDelegateCall(_e) {
  }

  function say() public pure returns (string memory) {
    return "WithParentWithDelegateCall";
  }
}
