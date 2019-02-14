---
id: version-2.2.0-vouching
title: Vouching for EVM packages
original_id: vouching
---

ZeppelinOS's native ZEP token is not required to use ZeppelinOS, but is used to incentivize the creation and maintenance of a healthy ecosystem of EVM packages. It does so via a series of opt-in mechanisms that are detailed in the following sections of this article.

## EVM package vouching

Anyone can create ZeppelinOS EVM packages for free. More precisely, you don't need to hold or spend ZEP to create an EVM package.

However, ZeppelinOS provides a mechanism in which an EVM package can be registered and vouched for using ZEP. The tokens vouched for an EVM package can be challenged by other ZEP holders whenever a deficiency in the EVM package is presented for evaluation. In such a situation, the package's vouched tokens could be slashed in favor of the challenger.

The end goal is that this simple mechanism will allow ZEP that is vouched for an EVM package to represent:

- **A measure of the quality of the code of the EVM package**. An EVM package with a large amount of tokens vouched will attract challengers and subject its code to peer review. If the package's vouched token stash survives such scrutiny, then the presence of the unslashed ZEP signals that the code doesn't have significant vulnerabilities or deficiencies.
- **A measure of the support that the EVM package has from the community**. An EVM package with a lot of adoption will receive vouching from ZEP holders who may want to participate in the package's governance as well as revenue model.
- **A financial buffer for the development of new features in the EVM package**. Contributors will be able to claim rewards in ZEP from the package's vouched tokens whenever a contribution is accepted by the package's developers.
- **A financial buffer for the auditing of the code of the EVM package**. Auditors will be able to receive ZEP whenever a package is successfully challenged.

The current version of this contract currently supports the following features:
- Registering a new EVM package.
- Vouching for an EVM package (only package owners for now).
- Removing vouched tokens from an EVM package.
- Removing an EVM package from the registry.

## ZEP token private beta

ZEP is an ERC20 token, controlled by a [TPL](https://github.com/TPL-protocol) (Transaction Permission Layer) jurisdiction. This allows regional jurisdictions to control which addresses can hold or exchange ZEP using KYC, or whatever other validation processes are found to be adequate for the region.

Zeppelin is currently distributing mainnet ZEP to projects interested in adopting ZeppelinOS. This is not a sale, but beta testing for the aforementioned token dynamics. To apply to the private beta distribution, please submit your project's details in the [ZEP Token's private beta submission form](https://beta-registration.zeppelinos.org).
