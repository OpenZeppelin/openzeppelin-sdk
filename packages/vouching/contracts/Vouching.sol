pragma solidity ^0.4.24;

import './ZepToken.sol';

contract Vouching {

  struct Dependency {
    address owner;
    address dependencyAddress;
    uint256 stake;
  }

  mapping (string => Dependency) private _registry;
  uint256 private _minimumStake;
  ZepToken private _token;

  modifier onlyDependencyOwner(string name) {
    require(msg.sender == _registry[name].owner);
    _;
  }

  event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);
  event DependencyCreated(string name, address indexed owner, address indexed dependencyAddress, uint256 initialStake);
  event Vouched(string name, uint256 amount);
  event Unvouched(string name, uint256 amount);
  event DependencyRemoved(string name);

  constructor(uint256 minimumStake, ZepToken token) public { 
    _minimumStake = minimumStake;
    _token = token; 
  }

  function minimumStake() public view returns(uint256) {
    return _minimumStake;
  }

  function getDependencyAddress(string name) public view returns(address) {
    return _registry[name].dependencyAddress;
  } 

  function getDependencyOwner(string name) public view returns(address) {
    return _registry[name].owner;
  } 

  function getDependencyStake(string name) public view returns(uint256) {
    return _registry[name].stake;
  } 

  function create(string name, address owner, address dependencyAddress, uint256 initialStake) external {
    require(initialStake >= _minimumStake);
    _token.transferFrom(owner, this, initialStake);
    _registry[name] = Dependency(owner, dependencyAddress, initialStake);
    emit DependencyCreated(name, owner, dependencyAddress, initialStake);
  }

  function transferOwnership(string name, address newOwner) external onlyDependencyOwner(name) {
    _registry[name].owner = newOwner;
    emit OwnershipTransferred(msg.sender, newOwner);
  }

  function vouch(string name, uint256 amount) external onlyDependencyOwner(name) {
    _token.transferFrom(msg.sender, this, amount);
    _registry[name].stake += amount;
    emit Vouched(name, amount);
  }

  function unvouch(string name, uint256 amount) external onlyDependencyOwner(name) {
    require(_registry[name].stake - amount >= _minimumStake);
    _registry[name].stake -= amount;
    _token.transfer(msg.sender, amount);
    emit Unvouched(name, amount);
  }

  function remove(string name) external onlyDependencyOwner(name) {
    // Owner surrenders _minimumStake to the system
    _token.transfer(msg.sender, _registry[name].stake - _minimumStake);
    delete _registry[name];
    emit DependencyRemoved(name);
  }

}

