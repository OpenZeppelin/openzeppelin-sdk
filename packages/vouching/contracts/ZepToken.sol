pragma solidity ^0.4.24;

import "openzeppelin-zos/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-zos/contracts/token/ERC20/ERC20Pausable.sol";
import "TPL-1.0-audit/contracts/TPLToken.sol";

// Temporary imports for Truffle testing until TPL is released
import "TPL-1.0-audit/contracts/ZEPValidator.sol";
import "TPL-1.0-audit/contracts/BasicJurisdiction.sol";


/**
 * @title ZepToken
 * @dev ZEP token contract including mintable, pausable and burnable functionalities
 */
contract ZepToken is Initializable, TPLToken, ERC20Detailed, ERC20Pausable {

  function initialize(
    AttributeRegistry _jurisdictionAddress,
    uint256 _validRecipientAttributeId
  ) 
    initializer
    public
  {
    uint8 decimals = 18;
    uint256 totalSupply = 1e8 * (10 ** uint256(decimals));

    ERC20Pausable.initialize();
    ERC20Detailed.initialize("Zep Token", "ZEP", decimals);
    TPLToken.initialize(_jurisdictionAddress, _validRecipientAttributeId);
    
    _mint(msg.sender, totalSupply);
  }

}
