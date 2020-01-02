pragma solidity ^0.5.0;

import './Libraries.sol';

contract WithLibraryNonUpgradeable {
  uint public answer = UintLib.double(21);
}
