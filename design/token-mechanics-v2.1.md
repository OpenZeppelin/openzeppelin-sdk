# Token Mechanics V2.1

### Assumptions
- Users will register/deprecate versions of a package. 
- Users will vouch/unvouch for an specific version of a package. 
- Users will be able to move their vouch through different versions of the same package. 
- Challengers will challenge a specific version of a package.
- The minimum stake is validated against the summation of the amount vouched by the package owner for each of its version.
- For non-owner users, there is no penalization for unvouching/moving tokens. Package owners will have to make sure the minimum stake is reached.
- Packages reputation could be calculated based on total vouch amount weighted by the registered versions

### Issues
1- How we can avoid users unvouching their tokens given a new critical challenge yet unsolved?
> We can either use cyclic windows to state when users can challenge, when users can vouch/unvouch, and when challenges 
  will be solved. Or, we can lock a fraction of the vouched tokens of each user to ensure we can pay successful 
  challenges. Both options have their downsides: locking may not be possible if there is a large list of challenges 
  if the payout formula depends on the total stake. OTOH, windows may no be the ideal solution for critical challenges

2- Challenges front-running?
> A simple way to solve this issue for the following version, is to can handle front-running scenarios manually checking both challenges and deciding 
  which is the real one.

3- Challenges payout formula
  3.1- Severity
  > Each challenge can have a severity label given by the challenger. The severity may affect the payout received by each challenger.

  3.2- How we can make sure challenges payout cannot be manipulated based on their resolution order? 
  > An obvious approach would be to solve challenges in a FIFO order. Note that this blocks solving a challenge until all previous ones have been 
    solved as well. Therefore, if each challenge receives a percentage of the tokens staked, then the order in which challenges are resolved 
    actually alters how much of a reward each challenge gets.

  3.3- How we can make sure there is enough tokens to pay successful challenges?
  > We should decide whether we want to accept defaults or not, i.e. do we want to consider an scenario where a package does not have enough 
    tokens staked to pay a challenge? If not, we should pay a proportional amount of tokens based on the severity and the total stake.
    
  3.4- How we will handle a huge list of vouchers during a payout?
  > We can have a rate per version in ZEP that will be adjust each time a challenge is solved.  

4- What would happen if package registrars' vouch reaches an amount lower than the minimum stake due to challenges payout?
> Users will have to provide a certain amount of tokens the next time they register a version to reach the minimum stake.
  We should make sure this is an edge scenario since we will be forcing package registrars to buy more tokens.

### Proof of concept

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
