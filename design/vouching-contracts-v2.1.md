# Vouching contracts

Specification for the vouching contracts for ZeppelinOS, corresponding to the token mechanics v2.1.

## Features

The contracts need to support:

- Registering an entry to be vouched for, with associated metadata
- Vouching and unvouching for a registered entry

## Architecture

A `Vouching` contract will keep track of vouches in ZEP for arbitrary `vouched` items. The rationale behind this is that we do not to tie the ZEP vouching protocol to EVM packages, but allow for anything to be potentially vouched for. Nevertheless, during the private beta, we will only work with EVM packages.

`vouched` items will track the address of the object being vouched. In the case of EVM packages, it will be the deployment address of the ImplementationDirectory.

Each `vouched` item should be composed of:
- vouched address (immutable)
- metadata URI+hash (immutable)
- owner
- total stake
- stake per user

## Registration and vouchings

The vouching contract should expose the following interface for managing registrations and vouchings. Methods for deprecating or removing entries are out of scope.

### Register

```
register(address vouched, uint256 amount, string metadataURI, bytes32 metadataHash)
  requires vouch >= minStake
  emits Register(uint256 indexed id, address indexed vouched, address owner, uint256 amount, string metadataURI, bytes32 metadataHash)
```

Generates a fresh ID and adds a new `vouched` item to the vouching contract, owned by the sender, with `amount` initial ZEP tokens sent by the sender. Requires vouching at least `minStake` tokens, which is a constant value.

### Vouch

```
vouch(uint256 id, uint256 amount)
  requires amount > 0
  requires id exists
  emits Vouch(uint256 indexed id, address indexed sender, uint256 amount)
```

Increases the vouch for the package identified by `id` by `amount` for `sender`.

### Unvouch

```
unvouch(uint256 id, uint256 amount)
  requires amount > 0
  requires amount <= vouched(msg.sender, id)
  requires vouched(msg.sender, id) - amount >= minStake if msg.sender == owner(id)
  emits Unvouch(uint256 indexed id, address indexed sender, uint256 amount)
```

Decreases the vouch for the package identified by `id` by `amount` for `sender`. Note that if `sender` is the `vouched` owner, he cannot decrease his vouching under `minStake`.

### Move

```
move(uint256 from, uint256 to, uint256 amount)
  requires amount > 0
  requires amount <= vouched(msg.sender, from)
  requires packages from and to to exist
  requires msg.sender != owner(from) || msg.sender == owner(to) || (vouched(msg.sender, id) - amount >= minStake)
  emits Vouch(uint256 indexed id = from, address indexed sender, uint256 amount)
  emits Unvouch(uint256 indexed id = to, address indexed sender, uint256 amount)
```

Moves vouching from a package to another by `amount`. Note that if the owner is moving stake to another package he owns as well, then the restriction of keeping at least minStake does not apply. This enables a maintainer to remove all vouching from a version to move it to a different one, without any penalties. It also enables any user to shift their vouching without any cost.

### Transfer ownership

```
transfer(uint256 id, address newOwner, uint256 amount)
  requires owner(id) == msg.sender
  requires vouched(id, msg.sender) >= amount
  requires vouched(id, newOwner) + amount >= minStake
  emit Transfer(address from = msg.sender, address to = newOwner, uint256 id)
```

Transfers ownership of a package to another address, optionally transferring `amount` of the tokens vouched for this package to the new owner as well. The new owner must end up with at least `minStake` tokens vouched for the package (note that the new owner may had already vouched for the package, and these tokens count towards the minStake requirement). 

_We may decide to not implement this function at this stage._

### Set metadata URI

```
setMetadataURI(uint256 id, string metadataURI)
  requires owner(id) == msg.sender
  emits MetadataURIChanged(uint256 indexed id, string metadataURI)
```

Changes the URI where the metadata is stored. Note that it is not possible to change the metadata hash, so only the location can be changed, not the contents.

_We may decide to not implement this function at this stage._

### Vouching getters

```
vouched(id) returns address
metadata(id) returns (string uri, bytes32 hash)
owner(id) returns address
totalVouched(id) returns uint256
vouched(id, address) returns uint256
```

Returns information on a `vouched` item.

## Challenges

The vouching contract should expose the following interface for managing challenges to vouched items. These methods will be implemented in a second stage, and are subject to change.

### Challenge

```
challenge(uint256 id, uint256 amount, string challengeURI, bytes32 challengeHash)
  emits Challenged(uint256 indexed id, uint256 indexed challengeId, address indexed challenger, uint256 amount, string challengeURI, bytes32 challengeHash)
```

Creates a new challenge with a fresh id in a _pending_ state towards a package for an `amount` of tokens, where the details of the challenge are in the URI specified.

### Accept/reject challenge

```
accept/reject(uint256 challengeId)
  requires challengeId to be pending
  requires msg.sender == owner(target(challengeId))
  emits Accepted/Rejected(uint256 indexed challengeId)
```

Accepts or rejects a challenge. Can only be called by the owner of the challenged item.

### Appeal challenge decision

```
appeal(uint256 challengeId, uint256 amount)
  requires challengeID to have been accepted or rejected less than N days ago
  emits Appealed(uint256 indexed challengeId, address indexed appealer, uint256 amount, uint8 originalResult)
```

Appeals a decision by the vouched item owner to accept or reject a decision. Any ZEP token holder can perform an appeal, staking a certain amount of tokens on it. Note that `amount` may be fixed and depend on the challenge stake, in that case, the second parameter can be removed.

### Resolve appeal

```
sustain/overrule(uint256 challengeId)
  requires msg.sender to be overseer of the contract
  requires challengeId to be in appealed state
  emits Sustained/Overruled(uint256 indexed challengeId, address indexed overseer, uint8 originalResult)
```

Accepts or rejects an appeal on a challenge. Can only be called by an overseer address set in the contract, which will be eventually replaced by a voting system.

### Confirm challenge

```
confirm(uint256 challengeId)
  requires challengeID to have been accepted or rejected more than N days ago
  emits Confirmed(uint256 indexed challangeId, uint8 originalResult)
```

Confirms the result of a challenge if it has not been challenged and the challenge period has passed. Transfers tokens associated to the challenge as needed.

### Challenge getters

```
challengeTarget(uint256 challengeId) returns (uint256 id)
challengeStake(uint256 challengeID) returns (uint256 amount)
challengeMetadata(uint256 challengeID) returns (string uri, bytes32 hash)
challengeState(uint256 challengeID) returns (uint8 state, timestamp resolutionTime)
```

Returns information on a `challenge` item. Pending definition of the `state` enum.
