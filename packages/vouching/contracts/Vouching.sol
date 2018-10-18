pragma solidity ^0.4.24;


import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-zos/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-zos/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-zos/contracts/math/SafeMath.sol";
import "openzeppelin-zos/contracts/utils/Address.sol";

/**
 * @title Vouching
 * @dev Contract for staking tokens against dependencies.
 * TODO
 */
contract Vouching is Initializable {
  /**
   * @dev Emitted when the ownership of this contract is transferred.
   * @param oldOwner Address of the old owner.
   * @param newOwner Address of the new owner.
   */
  event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);
  /**
   * @dev Emitted when ...
   */
  event DependencyCreated(
    bytes32 indexed nameHash,
    string name,
    address indexed owner,
    address indexed dependencyAddress,
    uint256 initialStake
  );
  /**
   * @dev Emitted when ...
   */
  event Vouched(bytes32 indexed nameHash, uint256 amount);
  /**
   * @dev Emitted when ...
   */
  event Unvouched(bytes32 indexed nameHash, uint256 amount);
  /**
   * @dev Emitted when ...
   */
  event DependencyRemoved(bytes32 indexed nameHash);

  using SafeMath for uint256;
  using SafeERC20 for ERC20;
  using Address for address;

  /**
   * @dev Represents a particular dependency, with it's address, owner and amount of tokens staked.
   */
  struct Dependency {
    address owner;
    address dependencyAddress;
    uint256 stake;
  }

  /**
   * @dev Maps dependency Dependency structs by name.
   */
  mapping (string => Dependency) private _registry;
  /**
   * @dev Tracks taken dependency names.
   */
  mapping (string => bool) private _takenDependencyNames;
  /**
   * @dev Defines the minimum initial stake that a dependency can have when being created.
   */
  uint256 private _minimumStake;
  /**
   * @dev The token used for staking against dependencies.
   */
  ERC20 private _token;

  /**
   * @dev Modifier that restricts access to the owner of a specific dependency.
   * @param name String specifying the dependency to restrict access to.
   */
  modifier onlyDependencyOwner(string name) {
    require(msg.sender == _registry[name].owner, "Sender must be the dependency owner");
    _;
  }

  /**
   * @dev Initializer function. Called only once when a proxy for the contract is created.
   * @param minimumStake uint256 that defines the minimum initial stake that a dependency can have when being created.
   * @param token ERC20 token to be used for staking against dependencies.
   */
  function initialize(uint256 minimumStake, ERC20 token) initializer public {
    require(token != address(0), "Token address cannot be zero");
    _minimumStake = minimumStake;
    _token = token;
  }

  /**
   * @dev Returns the minimumStake value that represents the minimum stake that a new dependency can have.
   */
  function minimumStake() public view returns(uint256) {
    return _minimumStake;
  }

  /**
   * @dev Returns the address of the ERC20 token being used for staking.
   */
  function token() public view returns(ERC20) {
    return _token;
  }

  /**
   * @dev Returns the dependency associated to a given name.
   * @param name String representing the depedency.
   * @returns Tuple representing the elements of a Dependency struct.
   */
  function getDependency(string name) public view returns(address, address, uint256) {
    return (
      _registry[name].dependencyAddress,
      _registry[name].owner,
      _registry[name].stake
    );
  }

  /**
   * @dev Creates a new dependency and performs the initial staking for it.
   * @param name String that will represent the dependency. Must be unique.
   * @param owner Address that will own the depedency.
   * @param dependencyAddress Address of the dependency.
   * @param initialStake uint256 to be staked initially. Must be larger than or equal to minimumStake.
   */
  function create(string name, address owner, address dependencyAddress, uint256 initialStake) external {
    require(initialStake >= _minimumStake, "Initial stake must be equal or greater than minimum stake");
    require(owner != address(0), "Owner address cannot be zero");
    require(dependencyAddress != address(0), "Dependency address cannot be zero");
    require(dependencyAddress.isContract(), "Dependencies must be contracts");
    require(!_takenDependencyNames[name], "Given dependency name is already registered");

    _takenDependencyNames[name] = true;
    _registry[name] = Dependency(owner, dependencyAddress, initialStake);

    _token.safeTransferFrom(owner, this, initialStake);

    emit DependencyCreated(keccak256(abi.encodePacked(name)), name, owner, dependencyAddress, initialStake);
  }

  /**
   * @dev Transfers ownership of a dependency. Can only be called by the current owner of the dependency.
   * @param name String representing the dependency.
   * @param newOwner Address of the new owner.
   */
  function transferOwnership(string name, address newOwner) external onlyDependencyOwner(name) {
    require(newOwner != address(0), "New owner address cannot be zero");
    _registry[name].owner = newOwner;
    emit OwnershipTransferred(msg.sender, newOwner);
  }

  /**
   * @dev Stakes tokens for a given dependency. Can only be performed by the dependency owner.
   * @param name String that represents the dependency.
   * @param amount uint256 with the amount that is to be added to the stake.
   */
  function vouch(string name, uint256 amount) external onlyDependencyOwner(name) {
    _registry[name].stake = _registry[name].stake.add(amount);
    _token.safeTransferFrom(msg.sender, this, amount);
    emit Vouched(keccak256(abi.encodePacked(name)), amount);
  }

  /**
   * @dev Unstakes tokens from a given dependency. Can only be performed by the dependency owner.
   * @param name String that represents the dependency.
   * @param amount uint256 with the amount that is to be removed from the stake.
   */
  function unvouch(string name, uint256 amount) external onlyDependencyOwner(name) {
    uint256 remainingStake = _registry[name].stake.sub(amount);
    require(remainingStake >= _minimumStake, "Remaining stake must be equal or greater than minimum stake");

    _registry[name].stake = remainingStake;
    _token.safeTransfer(msg.sender, amount);

    emit Unvouched(keccak256(abi.encodePacked(name)), amount);
  }

  /**
   * @dev Removes a dependency from the registry. Can only be performed by the dependency owner.
   * @param name String representing the dependency.
   */
  function remove(string name) external onlyDependencyOwner(name) {
    // Owner surrenders _minimumStake to the system
    uint256 reimbursedAmount = _registry[name].stake.sub(_minimumStake);

    // The entry is not removed from _takenDependencyNames, to prevent a new dependecy
    // from reusing the same name
    delete _registry[name];

    _token.safeTransfer(msg.sender, reimbursedAmount);
    emit DependencyRemoved(keccak256(abi.encodePacked(name)));
  }

}

