# PhishBuddy Privacy Policy

_Last updated: 2026-05-30_

PhishBuddy helps you check whether a link is safe before you open it. To do
that, the extension needs to look at the web addresses (URLs) you visit or
choose to check. This policy explains, in plain language, what data PhishBuddy
handles, why, and how long it is kept.

PhishBuddy is operated by **Mirza Gamal Abdel Nasser**. Questions can be sent
through the project page:
<https://github.com/Ivan-Ryukendo/PhishBuddy>.

## What PhishBuddy Does With Your Data

When you visit a page, or use the popup to check a link, the extension sends the
**URL being checked** to the PhishBuddy safety service (a backend hosted on
Convex) over an encrypted HTTPS connection. The safety service then:

- Normalizes the URL.
- Looks it up against a public list of verified, watchlisted, and blocked
  domains.
- Checks a short-lived cache of recent results.
- Checks the URL for lookalike (imitation) domains.
- When configured, submits the URL to **Google Safe Browsing** and
  **VirusTotal** to ask whether it is known to be unsafe.
- Returns a single plain result — **Clean**, **Suspicious**, or **Dangerous** —
  with a short reason.

## Data We Process

| Data | Why | Where it goes |
| --- | --- | --- |
| The URL you visit or check | To run safety checks and return a verdict | PhishBuddy safety service; and, when enabled, Google Safe Browsing and VirusTotal |
| The domain part of a URL | To match against the public domain list | PhishBuddy safety service |
| Your chosen backend URL setting | To know which safety service to contact | Stored only in your browser's extension storage |

PhishBuddy does **not** ask for, collect, or store:

- Your name, email address, or any account login (PhishBuddy has no accounts).
- Passwords, form contents, or page text you type.
- Browsing history beyond the single URL being checked at the moment of a check.
- Advertising or tracking identifiers.

## Third-Party Safety Providers

When provider checks are enabled, PhishBuddy sends the URL being checked to:

- **Google Safe Browsing** — to check the URL against Google's threat lists.
  See Google's privacy terms: <https://policies.google.com/privacy>.
- **VirusTotal** — to check the URL against many security vendors.
  **Important:** VirusTotal may store submitted URLs and make them available to
  its security community. Do not use PhishBuddy to check private or sensitive
  URLs (for example, password-reset links or private share links) that you do
  not want shared with security vendors. See VirusTotal's privacy terms:
  <https://docs.virustotal.com/docs/privacy-policy>.

These providers process the URL under their own privacy policies, not this one.

## Data Retention

- **Cached results:** To speed up repeat checks and respect provider limits, the
  safety service temporarily stores the checked URL and its verdict in a cache.
  Cached entries are short-lived and expire automatically (currently about
  15 minutes).
- **Public domain list:** Contains only domain names, a safety label, a public
  reason, and update times. It does not contain user identities or the specific
  URLs individual users checked.
- **Link reports:** If a link is submitted for review, the URL and an optional
  note are stored as a pending review item. Reports are used only to improve
  the safety list and are not linked to a user identity.

We aim to store as little as possible and avoid keeping user data longer than
needed to provide the service.

## How Your Data Is Protected

- All communication between the extension and the safety service uses HTTPS.
- The extension contains **no** API keys or secrets. Provider keys stay on the
  backend.
- PhishBuddy does not sell, rent, or share your data for advertising or
  marketing.

## Your Choices

- You can stop all data sharing at any time by disabling or removing the
  PhishBuddy extension from your browser.
- Avoid checking URLs that contain private tokens or personal information you do
  not want sent to third-party security providers.

## Children's Privacy

PhishBuddy is a general-purpose safety tool and is not directed at children. It
does not knowingly collect personal information from children.

## Changes to This Policy

We may update this policy as PhishBuddy grows to new platforms (such as
Telegram or mobile apps). Material changes will be reflected by updating the
"Last updated" date above and publishing the new version in the project
repository.

## Contact

For privacy questions, open an issue or contact the maintainer through:
<https://github.com/Ivan-Ryukendo/PhishBuddy>.

---

_This policy is provided for transparency and store-listing requirements. It is
not legal advice. PhishBuddy is provided without warranty as described in the
[LICENSE](LICENSE)._
