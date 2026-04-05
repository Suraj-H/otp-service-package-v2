# Publishing to npm

Industry-standard flow for this repo: **Changesets** + **`changesets/action`** (see [`.github/workflows/release.yml`](../.github/workflows/release.yml)) + **branch protection** so `main` is always green from CI.

## 1. Canonical GitHub URL

Manifests must match the real GitHub remote.

```bash
pnpm sync-repo-url
```

This runs [`scripts/sync-repository-url.mjs`](../scripts/sync-repository-url.mjs) and rewrites `repository`, `bugs`, and `homepage` in the root and every `packages/*/package.json` from `git remote get-url origin` (SSH or HTTPS).

If you have no `origin` yet, add it first, then run the command.

## 2. npm scope and token

1. **Create the `@otp-service` org on npm** (required before the first publish). Open [Create an organization](https://www.npmjs.com/org/create), choose the name **`otp-service`**, and complete setup. Without this, `npm publish` fails with **`E404 Not Found`** on `PUT …/@otp-service%2f…` — npm has no namespace for that scope yet.
2. Ensure the npm user tied to your token is a **member** of that org with permission to publish packages.
3. Create a **granular** access token that can **publish** those packages ([Creating and viewing access tokens](https://docs.npmjs.com/creating-and-viewing-access-tokens), [About access tokens](https://docs.npmjs.com/about-access-tokens)).
   - **Critical (granular tokens):** npm’s docs state that when you grant a token access to an **organization**, that token may be used for **managing organization settings and teams** — **it does not grant the right to publish packages** under that org. Your screenshots can show **Owner** on `otp-service` and an org-scoped token and you will still get **`E404 Not Found` on `PUT …/@otp-service%2f…`** until the token also has **Packages and scopes** permission to publish.
   - Under **Packages and scopes**, add the **scope** **`@otp-service`** (or each package name such as `@otp-service/core`) with **Read and write**. Enable **Bypass two-factor authentication** for CI. The line “read and write access to all packages” must apply to **`@otp-service/*`**, not only organization administration.
4. In the GitHub repo: **Settings → Secrets and variables → Actions** → add **`NPM_TOKEN`**.

Publishing from CI requires a token that can publish **without interactive 2FA on publish** (2FA on login is fine; use automation tokens as npm documents).

**Alternative:** If you cannot use `@otp-service`, rename every package to a scope you already own (for example `@your-npm-username/...`), run `pnpm sync-repo-url` if needed, add a changeset, version, then publish — that is a larger manifest change.

## 3. CI before release

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) must stay green on **`main`** (including `verify:publishability`). Prefer **branch protection**: require this check before merging.

## 4. Version line: **0.1.0** first

First public line uses semver **0.x** (`0.1.0`): signals “usable on npm” without promising a frozen 1.x API yet. After the first release PR, versions live in each `packages/*/package.json` and changelogs in `packages/*/CHANGELOG.md`.

## 5. Automated release sequence

On every push to **`main`**:

1. **Release** workflow runs `changesets/action`.
2. If there are **pending changeset files**, it opens or updates a PR titled **“chore: version packages”** (versions + `CHANGELOG.md` per package, lockfile updated via `pnpm run ci:version`).
3. **Merge that PR** when ready.
4. On the next push to **`main`** (the merge commit), if there is nothing left to version but there are **unpublished versions**, the action runs **`pnpm run ci:publish`** (`pnpm build` then `changeset publish`).

If **`NPM_TOKEN`** is missing, the publish step fails — add the secret before merging the version PR.

### GitHub: Actions cannot open the version PR

If the Release workflow logs show **`GitHub Actions is not permitted to create or approve pull requests`**, the bot can still push branch **`changeset-release/main`**. Merge it into **`main`** manually (or open a PR yourself from that branch). To allow the bot to open PRs later: **Settings → Actions → General → Workflow permissions** → **Read and write**, and ensure your **organization policy** allows it.

### Re-run publish after fixing npm

If publish failed but **`main`** already shows **`0.1.0`**, fix the npm org/token, update **`NPM_TOKEN`** if needed, then re-run the **Release** workflow (**Actions → Release → Run workflow**) or push an empty commit to **`main`**.

## 6. Manual escape hatch

```bash
pnpm changeset          # add more changesets anytime
pnpm version-packages   # bump versions locally (then commit)
pnpm build && pnpm publish -r --access public
```

Prefer the automated path so versions and changelogs stay aligned.

## Root vs packages

The workspace root is **`private: true`** and is not published. Only **`packages/*`** are published; each has **`publishConfig.access: public`**.

## License

Packages are **MIT**. See the root [`LICENSE`](../LICENSE).
