pragma solidity ^0.4.24;

import "openzeppelin-zos/contracts/token/ERC20/ERC20Detailed.sol";
import './TPL/TPLToken.sol';

/**
 * @title ZepToken
 * @dev ZEP token contract including mintable, pausable and burnable functionalities
 */
contract ZepToken is Initializable, TPLToken, ERC20Detailed {

  function initialize(
    AttributeRegistry _jurisdictionAddress,
    uint256 _validRecipientAttributeId
  ) 
    initializer
    public
  {
    uint8 decimals = 18;
    uint256 totalSupply = 1e8 * (10 ** uint256(decimals));

    ERC20Detailed.initialize("Zep Token", "ZEP", decimals);
    TPLToken.initialize(_jurisdictionAddress, _validRecipientAttributeId);
    
    _mint(msg.sender, totalSupply);
  }

}
