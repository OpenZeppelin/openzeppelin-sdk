pragma solidity ^0.4.24;


import "./ZepToken.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Vouching {
  using SafeMath for uint256;

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
    require(token != address(0));
    _minimumStake = minimumStake;
    _token = token;
  }

  function minimumStake() public view returns(uint256) {
    return _minimumStake;
  }

  function token() public view returns(ZepToken) {
    return _token;
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
    require(owner != address(0));
    require(dependencyAddress != address(0));
    // name should not be already registered
    require(_registry[name].dependencyAddress == address(0));

    _token.transferFrom(owner, this, initialStake);

    _registry[name] = Dependency(owner, dependencyAddress, initialStake);

    emit DependencyCreated(name, owner, dependencyAddress, initialStake);
  }

  function transferOwnership(string name, address newOwner) external onlyDependencyOwner(name) {
    require(newOwner != address(0));
    _registry[name].owner = newOwner;
    emit OwnershipTransferred(msg.sender, newOwner);
  }

  function vouch(string name, uint256 amount) external onlyDependencyOwner(name) {
    _token.transferFrom(msg.sender, this, amount);
    _registry[name].stake = _registry[name].stake.add(amount);
    emit Vouched(name, amount);
  }

  function unvouch(string name, uint256 amount) external onlyDependencyOwner(name) {
    uint256 remainingStake = _registry[name].stake.sub(amount);
    require(remainingStake >= _minimumStake);

    _registry[name].stake = remainingStake;
    _token.transfer(msg.sender, amount);

    emit Unvouched(name, amount);
  }

  function remove(string name) external onlyDependencyOwner(name) {
    // Owner surrenders _minimumStake to the system
    _token.transfer(msg.sender, _registry[name].stake.sub(_minimumStake));
    delete _registry[name];
    emit DependencyRemoved(name);
  }

}

