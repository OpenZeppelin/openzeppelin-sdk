# ZeppelinOS documentation site

Centralised documentation site for ZeppelinOS.

## Writing docs

Write custom documentation in Markdown in the `docs/docs` folder (see `start.md`).

## Generating docs

To generate the documentation for a new version, run:

```sh
npm run bump-docs -- <tag>
```

This command will automatically:

* Run [solidity-docgen](https://github.com/spalladino/solidity-docgen) on the ZeppelinOS codebase at the given tag.
* Generate a new Docusaurus version matching the ZeppelinOS release tag.
* Build the Docusaurus project, yielding the result in `docs/website/build`.
