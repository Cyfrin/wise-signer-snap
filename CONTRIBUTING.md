# Thank you!

Please fork the repo, and make a pull request with your changes.

# How to publish

Bump the `version` in both `packages/snap/package.json` and
`packages/snap/snap.manifest.json` (they must match), then:

```
cd packages/snap
yarn build
npm login
npm publish
```

`yarn build` recomputes the manifest `shasum` for the new bundle, so commit
the updated `snap.manifest.json` along with the release.

# How to test package

1. Go to [here](https://montoya.github.io/snap-install-tester/)
2. Add your npm package
