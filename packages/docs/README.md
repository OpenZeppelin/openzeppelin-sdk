# zeppelin_os documentation site

Centralised documentation site for zeppelin_os.

## Generating docs

To generate the documentation for a new version, run:

```sh
npm run bump-docs -- <tag>
```

This command will automatically:

* Run [solidity-docgen](https://github.com/spalladino/solidity-docgen) on the zeppelin_os codebase at the given tag.
* Generate a new Docusaurus version matching the zeppelin_os release tag.
* Build the Docusaurus project, yielding the result in `docs/website/build`.
