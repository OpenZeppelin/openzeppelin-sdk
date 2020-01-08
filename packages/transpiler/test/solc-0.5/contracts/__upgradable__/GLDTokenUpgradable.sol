pragma solidity ^0.5.0;

import "./@openzeppelin/contracts/token/ERC20/ERC20Upgradable.sol";
import "./@openzeppelin/contracts/token/ERC20/ERC20DetailedUpgradable.sol";
import "@openzeppelin/upgrades/contracts/Initializable.sol";

contract GLDTokenUpgradable is Initializable, ERC20Upgradable, ERC20DetailedUpgradable {
    function initialize(uint256 initialSupply) external initializer {
        __init(true, initialSupply);
    }

    function __init(bool callChain, uint256 initialSupply) internal {
        if(callChain) {
            ContextUpgradable.__init(false);
            ERC20DetailedUpgradable.__init(false, "Gold", "GLD", 18);
        }
        
        
        _mint(msg.sender, initialSupply);
    
    }

    
}
