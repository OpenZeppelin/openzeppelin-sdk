pragma solidity ^0.5.0;

contract ERC20Fake {
  mapping (address => uint256) private _balances;

  function giveAway(address account, uint256 amount) public {
    _balances[account] = amount;
  }

  function balanceOf(address owner) public view returns (uint256) {
    return _balances[owner];
  }
}

contract ERC20FakeDetailed is ERC20Fake {
  string private _name;
  string private _symbol;
  uint8 private _decimals;

  constructor (string memory name, string memory symbol, uint8 decimals) public {
    _name = name;
    _symbol = symbol;
    _decimals = decimals;
  }

  function name() public view returns (string memory) {
    return _name;
  }

  function symbol() public view returns (string memory) {
    return _symbol;
  }

  function decimals() public view returns (uint8) {
    return _decimals;
  }
}
