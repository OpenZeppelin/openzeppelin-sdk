# OpenZeppelin SDK Command-Line Interface _(@openzeppelin/cli)_

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg)](https://github.com/RichardLitt/standard-readme)
[![NPM Package](https://img.shields.io/npm/v/@openzeppelin/cli.svg?style=flat-square)](https://www.npmjs.org/package/@openzeppelin/cli)
[![CircleCI](https://circleci.com/gh/OpenZeppelin/openzeppelin-sdk/tree/master.svg?style=shield)](https://circleci.com/gh/OpenZeppelin/openzeppelin-sdk/tree/master)

> Command-line interface for the OpenZeppelin smart contract platform.

OpenZeppelin SDK is a platform to develop, deploy and operate smart contract
projects on Ethereum and every other EVM and eWASM-powered blockchain.

This is the repository for the OpenZeppelin commmand-line interface, the
recommended way to use the OpenZeppelin SDK.

## Install

First, install [Node.js](http://nodejs.org/) and [npm](https://npmjs.com/).
Then, install the OpenZeppelin SDK running:

```sh
npm install --global @openzeppelin/cli
```

## Usage

To start, create a directory for the project and access it:

```sh
mkdir my-project
cd my-project
```

Use `npm` to create a `package.json` file:

```sh
npm init
```

And initialize the OpenZeppelin SDK project:

```sh
openzeppelin init my-project
```

Now it is possible to add contracts to the project with the `openzeppelin add` command,
push these contracts to a blockchain network with `openzeppelin push`, use
`openzeppelin deploy` to create instances for these contracts that later can be
upgraded, and many more things.

Run `openzeppelin --help` for more details about this and all the other functions of
the OpenZeppelin CLI.

The
[OpenZeppelin SDK documentation](https://docs.openzeppelin.com/sdk)
explains how to use the `openzeppelin` command-line interface to build a project, to
upgrade contracts and to share packages for other projects to reuse. It also
explains how to operate the project with the OpenZeppelin JavaScript libraries
instead of this `openzeppelin` command.

## Security

If you find a security issue, please contact us at security@openzeppelin.com. We
give rewards for reported issues, according to impact and severity.

## Maintainers

* [@spalladino](https://github.com/spalladino)
* [@jcarpanelli](https://github.com/jcarpanelli)
* [@ylv-io](https://github.com/ylv-io)

## Contribute

To contribute, join our
[community channel on Telegram](https://t.me/zeppelinos) where you can talk to
all the OpenZeppelin developers, contributors, partners and users.

You can also follow the recent developments of the project in our
[blog](https://blog.openzeppelin.com/) and
[Twitter account](https://twitter.com/openzeppelin).

## License

[MIT](LICENSE.md) © OpenZeppelin
