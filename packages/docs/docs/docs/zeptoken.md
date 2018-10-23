---
id: zeptoken
title: The ZEPToken
sidebar_label: The ZEPToken
---

ZeppelinOS' native ZEP token is used to incentivize the creation and maintenance of a healthy ecosystem of EVM packages. It does so via a series of mechanisms that are detailed in the following sections of this article.

## Compatibility standards

ZEP is an ERC20 token, controlled by a TPL (Transaction Permission Layer) jurisdiction (TODO: add link). This allows regional jurisdictions to control which addresses can hold or exchange ZEP using KYC, or whatever other validation process are found to be adequate for the region.

## EVM package staking

Anyone can create ZeppelinOS EVM packages for free. More precisely, you don't need to hold or spend ZEP to create an EVM package. 

However, ZeppelinOS provides a mechanism in which an EVM package can be registered and staked upon using ZEP. This stake can be challenged by other ZEP holders whenever a defficiency in the code of the EVM package is put forward. In such a situation, the package's stake can be slashed in favour of the challenger.

This simple mechanism serves whoever is using an EVM package as a dependency in another project as a means to measure the quality of such package. An EVM package with a large amount of stake will attract challengers and subject its code to peer review and heavy auditing. If the package's stake survives such scrutiny, then the presence of the unslashed ZEP signals that the code doesn't have signifficant vulnerabilities or deficiencies.

The amount of ZEP staked on an EVM package does not only represent the quality of its code, but can also act as a means for its maintainers to finance result-based audits.

TODO: Instructions for registering stake on an EVM package.

### Challenge resolution

Any ZEP holder may challenge the stake of an EVM package. Such a challenge may involve the report of a bug as well as dishonest behavior. Package developers may willingly accept the challenge, in which case a fraction of the package's stake will be yielded to the challenger.

In the case in which a challenge is rejected, a vote amongst other ZEP holders is called. If the challenge is accepted then, the EVM package's stake is doubly slashed: a part goes to the challenger and a part goes to the participants of the decision.

To challenge an EVM package, ZEP must also be staked, and such stake is lost in the case that the challenge is rejected.

_NOTE: This feature is not implemented in the current ZeppelinOS release._

## EVM package contributions

EVM package maintainers may accept external contributions that claim a given ZEP reward. In the case of accepting a contribution, the reward is taken from the EVM package's stake and given to the author of the contribution. In such a case, the EVM package is free to assimilate the changes provided by the contribution.

If a contribution is assimilated without the provision of a reward, the contribution's author may challenge the EVM package.

_NOTE: This feature is not implemented in the current ZeppelinOS release._

## EVM package linking fees

EVM package developers may choose to set up a linking fee in ZEP, in which case anyone who links to the EVM package will need to provide a one time payment for such linkage to occur.

_NOTE: This feature is not implemented in the current ZeppelinOS release._

## EVM package support

Anyone can add stake to an EVM package's total stake to show support. Such stake is indistinctively subject to the same challenge dynamics explained above. If an EVM package charges linkage fees, a fraction of the revenue collected by such fees is to be distributed to supporters.

_NOTE: This feature is not implemented in the current ZeppelinOS release._

## Marketplace
TODO

## Scheduler
TODO

## Governance
TODO
