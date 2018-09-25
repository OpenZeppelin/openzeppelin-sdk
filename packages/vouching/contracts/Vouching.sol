pragma solidity ^0.4.24;


import "openzeppelin-zos/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Vouching {
  event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);
  event DependencyCreated(string name, address indexed owner, address indexed dependencyAddress, uint256 initialStake);
  event Vouched(string name, uint256 amount);
  event Unvouched(string name, uint256 amount);
  event DependencyRemoved(string name);

  using SafeMath for uint256;

  struct Dependency {
    address owner;
    address dependencyAddress;
    uint256 stake;
  }

  mapping (string => Dependency) private _registry;
  uint256 private _minimumStake;
  ERC20 private _token;

  modifier onlyDependencyOwner(string name) {
    require(msg.sender == _registry[name].owner, "Not allowed");
    _;
  }

  constructor(uint256 minimumStake, ERC20 token) public {
    require(token != address(0), "Token address cannot be zero");
    _minimumStake = minimumStake;
    _token = token;
  }

  function minimumStake() public view returns(uint256) {
    return _minimumStake;
  }

  function token() public view returns(ERC20) {
    return _token;
  }

  function getDependency(string name) public view returns(address, address, uint256) {
    return (
      _registry[name].dependencyAddress,
      _registry[name].owner,
      _registry[name].stake
    );
  }

  function create(string name, address owner, address dependencyAddress, uint256 initialStake) external {
    require(initialStake >= _minimumStake, "Initial stake must be equal or greater than minimum stake");
    require(owner != address(0), "Owner address cannot be zero");
    require(dependencyAddress != address(0), "Dependency address cannot be zero");
    require(_registry[name].dependencyAddress == address(0), "The name has already been registered");

    _token.transferFrom(owner, this, initialStake);

    _registry[name] = Dependency(owner, dependencyAddress, initialStake);

    emit DependencyCreated(name, owner, dependencyAddress, initialStake);
  }

  function transferOwnership(string name, address newOwner) external onlyDependencyOwner(name) {
    require(newOwner != address(0), "New owner address cannot be zero");
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
    require(remainingStake >= _minimumStake, "Remaining stake must be equal or greater than minimum stake");

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

