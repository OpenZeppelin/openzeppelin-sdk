pragma solidity ^0.4.21;

import "./ContractDirectory.sol";

contract FreezableContractDirectory is ContractDirectory {
  bool public frozen;

  modifier whenNotFrozen() {
    require(!frozen);
    _;
  }

  function freeze() onlyOwner whenNotFrozen public {
    frozen = true;
  }

  function setImplementation(string contractName, address implementation) public onlyOwner whenNotFrozen {
    super.setImplementation(contractName, implementation);
  }
}
