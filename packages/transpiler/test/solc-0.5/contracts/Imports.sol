import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

import * as ERC20 from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Detailed as Detailed} from "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/math/Math.sol" as math;
import { DA, DB1, DB2, DC } from "./DiamondInheritance.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract Token is ERC20.ERC20, Detailed, DC {
    constructor(uint256 initialSupply) public ERC20Detailed("Gold", "GLD", 18) {
        uint finalSupply = math.Math.max(0, initialSupply);
        _mint(msg.sender, finalSupply);
    }
}