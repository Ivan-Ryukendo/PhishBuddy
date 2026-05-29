# Contributing to PhishBuddy

Thank you for helping improve PhishBuddy.

PhishBuddy is meant to be useful to people who may not understand security terms. Please write issues, pull requests, documentation, and user-facing text in plain language.

## Before You Start

Read the project overview and blueprint first:

- [README.md](README.md)
- [docs/blueprint.md](docs/blueprint.md)
- [docs/roadmap.md](docs/roadmap.md)

If your change affects product design, platform order, safety results, or how user links are handled, open a discussion or issue before coding.

## Contribution Terms

PhishBuddy is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE).

By submitting a contribution (a pull request, patch, or any other change), you agree that:

- Your contribution is licensed to the project under the **same** PolyForm
  Noncommercial License 1.0.0 that covers the project (inbound license matches
  outbound license).
- You **wrote the contribution yourself, or otherwise have the right to submit
  it** under that license, and you are not knowingly including code you are not
  permitted to share.

To confirm this, sign off each commit with the `--signoff` flag:

```powershell
git commit --signoff -m "Your message"
```

This adds a `Signed-off-by` line, a lightweight Developer Certificate of Origin
(DCO) style statement that you have the right to submit the work. No separate
agreement or signing tool is required.

## Good First Contributions

Good early contributions include:

- Improving plain-language documentation.
- Clarifying user-facing safety messages.
- Writing small tests for existing behavior.
- Fixing small browser extension issues once the MVP code exists.
- Improving setup notes after they have been tested locally.

## Pull Request Guidelines

Keep pull requests small and focused. A pull request should explain:

- What changed.
- Why it changed.
- How it was checked.
- Which platform it affects.

Run the relevant tests before asking for review. If you cannot run tests, explain why.

Do not include unrelated cleanup in the same pull request. It makes review harder and increases the chance of accidental changes.

## Safety and Privacy

Never commit secrets, API keys, tokens, private configuration, or personal account details.

Be careful with user links. Treat submitted links as sensitive because they may reveal personal messages, accounts, workplaces, or private activity. Avoid storing more than the product needs.

Do not present a result as certain when the system only has partial evidence. Use clear labels:

- Clean
- Suspicious
- Dangerous

Each result should include a short reason that a non-technical user can understand.

## Platform Focus

Follow the project order:

1. Desktop browser protection for Chrome and Firefox.
2. Telegram link checking.
3. Web app and Android-shaped app experience.
4. iOS release investigation and later iOS release planning.

Please do not add later-platform work ahead of the browser MVP unless the project owner has agreed to it.

## Working With Other Contributors and Agents

Other people and agents may edit the project at the same time. Do not overwrite work outside your task. If you see changes you did not make, assume they are intentional unless the project owner says otherwise.

For major architecture changes, update the relevant docs first so the team can agree on the direction before code changes begin.
