# Token Mechanics v2.1

## Protocol

### Vouching

- Developers will register plain addresses. These addresses may represent anything: an EVM package, an EVM package version, a logic contract from a package, a contract instance, or a mock address representing something off-chain. 
- Registering a new entry requires a minimum stake that cannot be removed, and is used for spam prevention. The minimum stake can only be moved to another entry owned by the same developer, but never withdrawn from the vouching system.
- Any user can vouch for an entry, and withdraw or move their vouching without penalizations.

### Challenging

- Any user can challenge an entry, staking an amount of tokens behind the challenge. The amount of tokens associated to the challenge should be proportional to the vouching of the entry and the severity of the challenge, and these values should be tabulated off-chain.
- A challenge can be accepted or rejected by the owner of the challenged entry. Regardless of the result, it enters a period of N days during which it can be appealed. If not appealed, it is then confirmed and executed. Appeals allow challengers to have their rejected challengers reviewed, and prevent dishonest developers from colluding with a challenger to drain funds from the other vouchers of an entry.
- Any user can appeal a resolution of a challenge (during the appealing period) by staking tokens behind it. Resolution of appeals will be centralized initially, and then solved via a PLCR voting by all ZEP token holders.

## Issues

1- How we can avoid users unvouching their tokens given a new challenge yet unsolved?
  
  We can lock all funds that are needed to pay for all open challenges, and allow users to unvouch the rest. Note that this may not be implementable due to gas constraints. Another simple option is to outright lock all funds on a challenged entry. 
  
  We may also allow users to signal their willingness to retreat from a package, in which case new challenges do not apply to them, and once the last challenge to their funds ends, then they are allowed to retreat.ges

2- How can we prevent a user from grabbing an off-chain challenge and submitting it under their name before the original auditor?

  We can handle front-running scenarios by manually checking both challenges and deciding which is the real one based on off-chain information.

3- How we can make sure challenges payout cannot be manipulated based on their resolution order? 
  
  An obvious approach would be to solve challenges in a FIFO order. Note that this blocks solving a challenge until all previous ones have been solved as well. A challenge will then _lock_ a certain amount of tokens to make sure it can be paid, and new challenges will then take a percentage of the _free_ tokens on an entry.
  
4- How we can make sure there are enough tokens to pay successful challenges?

  If every challenge takes a percentage of the _free_ tokens of an entry, then we should always have enough tokens to pay, even if the payout for challenges that occur later in time is lower.

5- What would happen if the tokens vouched reaches an amount lower than the minimum stake due to challenges payout?

  We can leave the min stake out of the number of _free_ tokens. This way, the min stake is exclusively used for spam prevention, and not for paying out challenges.

6- How can we handle a huge list of vouchers during a payout?
  
  We can have a rate per entry in ZEP that will be adjust each time a challenge is solved. We generate a fictional token per each entry, and the rate between that token and ZEP is modified on each challenge. When the users withdraw their vouching, then that exchange rate is applied to the withdrawal.

7- How can we decide the number of tokens for a challenge?

  We can publish a mapping from severity to percentage. The amount of tokens for a challenge should then be that percentage of the free tokens vouched for the challenged entry at the time of the challenge creation.

    
## Proof of concept

**Deprecated**

#### Types
```
[packages]   = string (name) => package
[package]    = string (version ID) => { vouch, address, owner (address), ownerTotalVouch (uint), totalVouch (uint), rate (fraction), deprecated (bool) } 
[vouch]      = address (user) => amount (uint)

[challenges] = uint (id) => { uint (id), string (name), string (version ID), uint (amount), string (issueURL), address (sender), answer, (bool) closed }
[answer]     = enum { 1: unanswered, 2: accepted, 3: rejected } 
```

#### Pseusdocode
```
register(owner, name, version, address, amount) {
  if (packages[name]) {
    # existing package
    # no need to check minimum vouch
    require(packages[name].owner == owner)
    require(!packages[name].versions[version])
    
    packages[name].ownerTotalVouch += amount
  } 
  else {
    # new package
    require(name wasn't used before)
    require(amount >= minimumVouch)
    
    packages[name] = { owner, ownerTotalVouch: amount }
  }
  
  packages[name].versions[version] = { address, rate: 1, deprecated: false, vouch: {} }
  packages[name].versions[version].vouch[owner] = amount
  packages[name].versions[version].totalVouch = amount
  
  zep.transferFrom(sender, this, initialVouch)
}

deprecate(name, version) {
  require(packages[name])
  require(packages[name].owner == owner)
  require(!packages[name][version].deprecated)
  
  packages[name][version].deprecated = true
}

vouch(user, name, version, amount) {
  require(packages[name][version])
  require(!packages[name][version].deprecated)
  
  package = packages[name][version]
  package.totalVouch += amount
  package.vouch[user] += amount
  
  zep.transferFrom(sender, this, amount)
}

unvouch(name, version, amount) {
  package = packages[name][version]
  require(package)
  require(package.vouch[sender] >= amount)
  
  if (sender === package.owner) {
    require(package.ownerTotalVouch - amount >= minimumVouch)
    package.ownerTotalVouch -= amount
  }
  package.totalVouch -= amount
  package.vouch[sender] -= amount
  
  amountToTransfer = amount * package.rate
  zep.transfer(sender, amount)
}

move(name, from, to, amount) {
  fromPackage = packages[name][from]
  toPackage = packages[name][to]
  
  require(fromPackage && toPackage && !toPackage.deprecated)
  require(fromPackage.vouch[sender] >= amount)

  # no need to check minimum vouch or adjust totals
  fromPackage.totalVouch -= amount
  fromPackage.vouch[sender] -= amount
  toPackage.totalVouch += amount
  toPackage.vouch[sender] += amount
}

challenge(name, version, amount, issueURL) {
  package = packages[name][version]
  require(package)
  require(!package.deprecated)
  
  id = challenges.length
  challenge = { id, name, version, amount, issueURL, sender, answer: unanswered, closed: false }
  challenges.push(challenge)
  
  zep.transferFrom(sender, this, amount)
}

acceptChallenge(id) {
  challenge = challenges[id]
  require(challenge)
  require(challenge.answer === unanswered)
  require(challenge.package.owner === sender)
  
  challenge.answer = accepted
  challenge.closed = true
  
  _executeChallengePayout(id)
}

rejectChallenge(id) {
  challenge = challenges[id]
  require(challenge)
  require(challenge.answer === unanswered)
  require(challenge.package.owner === sender)
  
  challenge.answer = rejected
  challenge.closed = true
}

solveChallenge(id, agreed) onlyZeppelin {
  require(challenges[id])
  require(challenges[id].answer === rejected)
  
  if (agreed) _executeChallengeAmount(id)
  else _executeChallengePayout(id) 
}

_executeChallengePayout(id) {
  affect rate negatively
  transfer tokens
}

_executeChallengeAmount(id) {
  affect rate possitively
}
```

### Package version rate scenarios

Assuming a minimum stake of 200 and a simple payout formula multiplying challenged amounts by 2.


#### Initial scenario 

```
|    PACKAGE   | VERSION |   USER   | VOUCH |
|--------------|---------|----------|-------|
| OpenZeppelin |  2.1.0  | OZ-Owner |  150  |
| OpenZeppelin |  2.1.0  | Alice    |  200  |
| OpenZeppelin |  2.0.0  | OZ-Owner |   50  |
| OpenZeppelin |  2.0.0  | Alice    |   50  |
| OpenZeppelin |  2.0.0  | Bob      |  100  |
| GnosisSafe   |  1.0.1  | GS-Owner |  200  |
| GnosisSafe   |  1.0.1  | Alice    |   50  |
| GnosisSafe   |  1.0.0  | Charly   |  100  |

OpenZeppelin
  2.1.0 stake: 350 (rate 350:350) 
  2.0.0 stake: 200 (rate 200:200)

GnosisSafe
  1.0.1 stake: 250 (rate 250:250)
  1.0.0 stake: 100 (rate 100:100)
```

#### OpenZeppelin 2.0.0 is successfully challenged for 50 ZEP
Users vouching for OpenZeppelin 2.0.0 must pay 100 ZEP to the challenger, then:

```
OpenZeppelin
  2.1.0 stake: 350 (rate 350:350) 
  2.0.0 stake: 200 (rate 200:100)

GnosisSafe
  1.0.1 stake: 250 (rate 250:250)
  1.0.0 stake: 100 (rate 100:100)
```

#### OpenZeppelin 2.1.0 is successfully challenged for 25 ZEP
Users vouching for OpenZeppelin 2.1.0 must pay 50 ZEP to the challenger, then:

```
OpenZeppelin
  2.1.0 stake: 350 (rate 350:300) 
  2.0.0 stake: 200 (rate 200:100)

GnosisSafe
  1.0.1 stake: 250 (rate 250:250)
  1.0.0 stake: 100 (rate 100:100)
```

#### OpenZeppelin 2.1.0 is successfully challenged for 100 ZEP
Users vouching for OpenZeppelin 2.1.0 must pay 200 ZEP to the challenger, then:

```
OpenZeppelin
  2.1.0 stake: 350 (rate 350:100) 
  2.0.0 stake: 200 (rate 200:100)

GnosisSafe
  1.0.1 stake: 250 (rate 250:250)
  1.0.0 stake: 100 (rate 100:100)
```

#### GnosisSafe 1.0.1 is unsuccessfully challenged for 250 ZEP
Users vouching for GnosisSafe 1.0.1 must pay 250 ZEP to the challenger, then:

```
OpenZeppelin
  2.1.0 stake: 350 (rate 350:100) 
  2.0.0 stake: 200 (rate 200:100)

GnosisSafe
  1.0.1 stake: 250 (rate 250:500)
  1.0.0 stake: 100 (rate 100:100)
```

#### Alice unvouches 35 tokens from OpenZeppelin 2.1.0
Given that OpenZeppelin 2.1.0 rate is `350:100`, Alice will receive `ZEP (35 * 100) / 350` (ZEP 10)

```
|    PACKAGE   | VERSION |   USER   | VOUCH |
|--------------|---------|----------|-------|
| OpenZeppelin |  2.1.0  | OZ-Owner |  150  |
| OpenZeppelin |  2.1.0  | Alice    |   65  |
| OpenZeppelin |  2.0.0  | OZ-Owner |   50  |
| OpenZeppelin |  2.0.0  | Alice    |   50  |
| OpenZeppelin |  2.0.0  | Bob      |  100  |
| GnosisSafe   |  1.0.1  | GS-Owner |  200  |
| GnosisSafe   |  1.0.1  | Alice    |   50  |
| GnosisSafe   |  1.0.0  | Charly   |  100  |

OpenZeppelin
  2.1.0 stake: 315 (rate 350:100)
  2.0.0 stake: 200 (rate 200:100)

GnosisSafe
  1.0.1 stake: 250 (rate 250:500)
  1.0.0 stake: 100 (rate 100:100)
```

#### GnosisSafe 1.0.0 is successfully challenged for 25 ZEP
Users vouching for GnosisSafe 1.0.0 must pay 50 ZEP to the challenger, then:

```
OpenZeppelin
  2.1.0 stake: 315 (rate 350:100) 
  2.0.0 stake: 200 (rate 200:100)

GnosisSafe
  1.0.1 stake: 250 (rate 250:500)
  1.0.0 stake: 100 (rate 100:50)
```

#### Charly moves 80 tokens from GnosisSafe 1.0.0 to GnosisSafe 1.0.1
Given that GnosisSafe 1.0.0 rate is `100:50`, Charly will unvouch `ZEP (80 * 50) / 100` (ZEP 40)
Given that GnosisSafe 1.0.1 rate is `250:500`, Charly will vouch `ZEP (40 * 250) / 500` (ZEP 20)

```
|    PACKAGE   | VERSION |   USER   | VOUCH |
|--------------|---------|----------|-------|
| OpenZeppelin |  2.1.0  | OZ-Owner |  150  |
| OpenZeppelin |  2.1.0  | Alice    |   65  |
| OpenZeppelin |  2.0.0  | OZ-Owner |   50  |
| OpenZeppelin |  2.0.0  | Alice    |   50  |
| OpenZeppelin |  2.0.0  | Bob      |  100  |
| GnosisSafe   |  1.0.1  | GS-Owner |  200  |
| GnosisSafe   |  1.0.1  | Alice    |   50  |
| GnosisSafe   |  1.0.1  | Charly   |   20  |
| GnosisSafe   |  1.0.0  | Charly   |   20  |

OpenZeppelin
  2.1.0 stake: 315 (rate 350:100)
  2.0.0 stake: 200 (rate 200:100)

GnosisSafe
  1.0.1 stake: 270 (rate 250:500)
  1.0.0 stake:  20 (rate 100:50)
```

#### Conclusion
- Rates are not affected when user vouch or unvouch, total stakes per version are
- Rates are affected only when challenge are solved, either successfully or not
