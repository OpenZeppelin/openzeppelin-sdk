pragma solidity ^0.5.0;

import * as ERC20 from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Detailed as Detailed} from "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/math/Math.sol" as math;
import { DA, DB1, DB2, DC } from "./DiamondInheritance.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./one/two/three/Deep.sol";

contract Imports is ERC20.ERC20, Detailed, DC {
    constructor(uint256 initialSupply) public Detailed("Gold", "GLD", 18) {
        uint finalSupply = math.Math.max(0, initialSupply);
        _mint(msg.sender, SafeMath.add(finalSupply, 10));
    }
}