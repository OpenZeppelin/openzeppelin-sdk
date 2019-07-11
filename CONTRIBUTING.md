# Contributing to the OpenZeppelin SDK

_This contribution guide is inspired in [the one from OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/CONTRIBUTING.md)._

We really appreciate and value contributions to the OpenZeppelin SDK. Please take 5' to review the items listed below to make sure that your contributions are merged as soon as possible.

## Ensure there is an issue for your contribution

**Always make sure there is an issue that corresponds to the contribution you want to make.** Before you start coding a new feature that you think could be awesome for the OpenZeppelin SDK, take a few minutes before and [open a new issue](https://github.com/OpenZeppelin/openzeppelin-sdk/issues/new) to propose it and discuss its design. This way, we can help you in coming up with the best design that fits within the project, and you don't spend time writing code that could be rejected later.

If you start working on an existing issue, it's good practice to let us know by adding a comment on the issue, so we can avoid duplicated efforts.

## Creating Pull Requests (PRs)

As a contributor, you are expected to fork this repository, work on your own fork and then submit pull requests. The pull requests will be reviewed and eventually merged into the main repo. See ["Fork-a-Repo"](https://help.github.com/articles/fork-a-repo/) for how this works.

## A typical workflow

1) Make sure your fork is up to date with the main repository:
```
git remote add upstream https://github.com/OpenZeppelin/openzeppelin-sdk.git
git fetch upstream
git pull --rebase upstream master
```

2) Branch out from `master` into `fix/some-bug-#123`, `feature/some-feature-#456`, or `docs/some-doc-#789`:
```
git checkout -b fix/some-bug-#123
```

3) Make your changes, add your files, commit and push to your fork:
```
git add SomeFile.js
git commit "Fix some bug #123"
git push origin fix/some-bug-#123
```

4) Go to [OpenZeppelin/openzeppelin-sdk](https://github.com/OpenZeppelin/openzeppelin-sdk) in your web browser and issue a new pull request.

5) Maintainers will review your code and possibly ask for changes before your code is pulled in to the main repository. We'll check that all tests pass, review the coding style, and check for general code correctness. If everything is ok, we'll merge your pull request and your code will be part of OpenZeppelin SDK.

