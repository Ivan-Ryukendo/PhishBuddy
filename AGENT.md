# PhishBuddy Agent Guide

This file is for humans and AI agents working together on PhishBuddy.

## How We Work

PhishBuddy is a safety product. Small, clear changes are better than large changes that are hard to review.

Before writing code, discuss the design when the change affects the product flow, safety decisions, user trust, data handling, or platform support. Keep the MVP focused and avoid adding extra platforms, features, or checks before the first browser release is solid.

Use issues and pull requests for project work. Each issue should explain the user problem, the expected result, and the platform affected. Each pull request should describe what changed, how it was checked, and any user-facing behavior that changed.

Run the relevant tests before publishing or asking for review. If tests cannot be run, say that clearly in the pull request or handoff note.

Never commit secrets, API keys, tokens, private configuration, personal accounts, or production credentials. Use safe local configuration and document required secrets without exposing real values.

Protect user changes. Other people and agents may be working in the same codebase. Do not revert or overwrite work outside your task. If a file has changes you did not make, read it carefully and work with those changes.

Keep tasks small. A good task should be easy to review and should not mix product design, user interface, safety logic, and platform setup unless they truly belong together.

Use docs-first planning for major architecture changes. Update the blueprint, roadmap, or related design notes before changing the system shape.

## Platform Order

PhishBuddy should be built in this order:

1. Desktop browser protection MVP for Chrome and Firefox.
2. Telegram link checking.
3. Web app and Android-shaped app experience.
4. iOS release investigation and later iOS release planning.

Do not move later platforms ahead of the desktop browser MVP unless the project owner explicitly changes the roadmap.

## MVP Focus

The MVP should answer one question well: is this link safe enough to open?

The first browser version should let a user check links through PhishBuddy and receive one of three plain results:

- Clean
- Suspicious
- Dangerous

Each result should include a short reason. Avoid exposing raw scan data unless it helps the user make a safer choice.
