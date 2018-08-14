pragma solidity ^0.4.24;

contract WithConstructor {
  uint256 public value;

  constructor() public {
    value = 42;
  }

  function say() public pure returns (string) {
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

  function say() public pure returns (string) {
    return "WithSelfDestruct";
  }
}

contract WithParentWithSelfDestruct is WithSelfDestruct {
  function say() public pure returns (string) {
    return "WithParentWithSelfDestruct";
  }
}

contract WithDelegateCall {
  constructor(address _e) public {
    require(_e.delegatecall(bytes4(keccak256("kill()"))));
  }
  
  function say() public pure returns (string) {
    return "WithDelegateCall";
  }
}

contract WithParentWithDelegateCall is WithDelegateCall {
  constructor(address _e) public WithDelegateCall(_e) {
  }

  function say() public pure returns (string) {
    return "WithParentWithDelegateCall";
  }
}