pragma solidity ^0.4.24;

contract Vouching {

  struct Dependency {
    uint256 stake;
    address owner;
    address dependencyAddress;
  }

  mapping (string => Dependency) private _registry;

  uint256 private _minimumStake;

  modifier onlyDependencyOwner(string name) {
    require(msg.sender == _registry[name].owner);
    _;
  }

  constructor(uint256 minimumStake) { 
    _minimumStake = minimumStake; 
  }

  function minimumStake() public view;

  function getDependencyAddress(string name) public view; 

  function create(uint256 initialStake, address developerAddress, address dependencyAddress) external;

  function transferOwnership(string name, address newOwner) external onlyDependencyOwner(name);

  function vouch(string name, uint256 amount) external onlyDependencyOwner(name);

  function unvouch(string name, uint256 amount) external onlyDependencyOwner(name);

  function remove(string name) external onlyDependencyOwner(name);

}

