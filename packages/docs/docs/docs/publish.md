---
id: publishing
title: Publishing an EVM package
---

On the previous guides we have explored how to initialize a ZeppelinOS project,
how to add contracts to it, how to upgrade those contracts and how to link to
existing EVM packages. At this point we have a simple project that uses various
ZeppelinOS functionalities. On this guide we will instead add new
functionalities to the platform, nicely wrapped as an EVM package ready for
others to use.

Let's first remember some of the things we've learned so far.

In the directory of our project, we initialize it:

```console
mkdir <project-name>
cd <project-name>
npm init
npx zos init <project-name>
```

Then, we can add to our project all the contracts that we have in the
`contracts` directory:

```console
npx zos add <contract-name-1> <contract-name-2> ... <contract-name-n>
```

Next, we push the project to the network:

```console
npx zos push --network <network>
```

Note that for the EVM package to be used by others, you need to use a real
network instead of your local development one. We have a guide about
[Deploying to mainnet](mainnet) which can be useful.

All known commands so far. Here comes what's new. If you want to share your
package in ZeppelinOS, do it by running the `publish` command:

```console
npx zos publish --network <network>
```

It's that simple! Now you are the developer of an EVM package that lives in
the blockchain ready to help building the next revolution. But this is only
half of the story, because for the package to be discovered and linked by
other projects, you will also need to publish it to
[npm](https://www.npmjs.com).

If you haven't published a package before, you will need to
[sign up for an npm account](https://www.npmjs.com/signup).

The npm package should include all the source and compiled contracts and the
ZeppelinOS configuration files, so add the following top-level field to the
`package.json` file:

```json
{
  ...,
  "files": [
    "build",
    "contracts",
    "test",
    "zos.json",
    "zos.*.json"
  ]
}
```

Remember that the `zos` configuration files are where ZeppelinOS keeps track of 
your contracts, the addresses of the instances you have created, and in this
case the address of the EVM package you will have published. This is how ZeppelinOS 
solves the link of foreign projects that depend on yours.

Make sure to check that the rest of the fields describe your package
accurately. It could be a good idea to remove the `main` field, if present,
because it doesn't make sense for EVM packages. Also, if you have a
`zos.dev-<network_id>.json` file, you can remove it now because it is specific for your
local test environment. You can also add this file pattern to your `.gitignore` file.

With that, we should be ready. Log in to npm with:

```console
npm login
```

And finally, publish to npm:

```console
npm publish
```

Now we are done for real. Other developers will be able to link to your
package by using:

```console
npx zos link <your-project-name>
```

Spread the word! Tell others to reuse your work, and to help you improving it
with more crazy ideas of how a decentralized society should be. Now, to
finish this quick exploration of the ZeppelinOS features we will see how you
can vouch to back the quality of your EVM packages.
