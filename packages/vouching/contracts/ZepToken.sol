pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol';
import './TPL/TPLToken.sol';

/**
 * @title ZepToken
 * @dev ZEP token contract including mintable, pausable and burnable functionalities
 */
contract ZepToken is TPLToken, PausableToken {

  string public constant name = "Zep Token";
  string public constant symbol = "ZEP";
  uint8 public constant decimals = 18;

  uint256 public constant TOTAL_SUPPLY = 1e8 * (10 ** uint256(decimals));
  
  /**
   * @dev Constructor that gives msg.sender all of existing tokens, and sets it as the owner
   */
  constructor(
    AttributeRegistry _jurisdictionAddress,
    uint256 _validRecipientAttributeId
  ) TPLToken(
    _jurisdictionAddress, 
    _validRecipientAttributeId,
    TOTAL_SUPPLY
    ) public {
    owner = msg.sender;
    emit Transfer(address(0), msg.sender, TOTAL_SUPPLY);
  }


}
