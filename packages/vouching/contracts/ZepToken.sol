pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol';

/**
 * @title ZepToken
 * @dev ZEP token contract including mintable, pausable and burnable functionalities
 */
contract ZepToken is StandardToken, MintableToken, PausableToken, BurnableToken {

  string public constant name = "Zep Token";
  string public constant symbol = "ZEP";
  uint8 public constant decimals = 18;

  /**
   * @dev Constructor function
   */
  constructor(address _owner) public {
    owner = _owner;
  }
  
}