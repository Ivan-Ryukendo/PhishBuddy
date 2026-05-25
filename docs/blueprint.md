# PhishBuddy System Blueprint

PhishBuddy helps people check risky links before they open them.

The product starts with desktop browser protection for Chrome and Firefox. Telegram support comes second. A web app and Android-shaped app experience come later. iOS release work comes after the earlier platforms are better understood.

## Product Shape

The first version should feel simple:

1. A user sees or receives a link.
2. PhishBuddy checks the link.
3. The user receives one clear result: Clean, Suspicious, or Dangerous.
4. The result includes a brief reason.

The goal is not to show complex scan reports. The goal is to help a normal person make a safer choice quickly.

## Platform Order

PhishBuddy should be built in this order:

1. Desktop browser protection for Chrome and Firefox.
2. Telegram link checking.
3. Web app and Android-shaped app experience.
4. iOS release investigation and later iOS release planning.

The desktop browser MVP comes first because many phishing attempts happen through links opened in browsers, and browser extensions can protect users close to the moment of risk.

## Central Safety Service

Convex is the central PhishBuddy Safety Service.

Browser extensions and later apps send links to the safety service. The safety service checks the link, combines the available signals, and returns a plain result.

The safety service should be responsible for:

- Receiving links from trusted PhishBuddy clients.
- Checking safety sources.
- Checking for lookalike domains.
- Reusing cached results when appropriate.
- Returning Clean, Suspicious, or Dangerous with a brief reason.
- Avoiding unnecessary storage of user data.

## Safety Checks

The safety service should use these checks:

- Google Safe Browsing: checks whether a link is known to be unsafe.
- VirusTotal: checks whether security vendors have reported the link or domain as unsafe.
- Lookalike domains: checks whether a domain is trying to imitate a trusted name.
- Cache: reuses recent results so repeated checks are faster and provider limits are respected.

Google Search ranking is not a safety source. A page ranking well in Google Search does not mean it is safe. Google Safe Browsing is the Google safety source PhishBuddy should use.

## Result Labels

PhishBuddy should return one of three labels:

- Clean: no strong warning signs were found during the check.
- Suspicious: something looks unusual or risky, but the link is not confirmed as dangerous.
- Dangerous: a trusted safety source or strong signal says the link should not be opened.

Each result should include a short reason, such as:

- "No known safety warnings were found."
- "This domain looks similar to a trusted brand."
- "This link was reported unsafe by a safety provider."

## Browser MVP

The browser MVP should cover Chrome and Firefox on desktop.

The extension should let a user check a link without needing to understand the underlying safety services. The extension sends the link to the PhishBuddy Safety Service and shows the result in plain language.

The MVP should stay focused on link checking and clear warnings. Extra dashboards, account systems, advanced reports, and broad platform support are future scope.

The browser MVP should check the page URL during navigation. Later versions can add deeper browser protection, such as redirect-chain review, suspicious link scanning inside a loaded page, and page-layout analysis for sites that appear to imitate banks, login pages, payment services, or other trusted brands. These checks should be added carefully because analyzing page content can affect speed, privacy, and false-positive rates.

## Telegram Support

Telegram support comes after the browser MVP.

The Telegram version should help users check links received in chats. It should use the same PhishBuddy Safety Service so results stay consistent across platforms.

## Future Scope

The web app and Android-shaped app experience come after Telegram. Concrete decisions still needed include account model, link history, notification behavior, Android packaging, and how much user data should be stored.

iOS and Safari release work comes later. Concrete decisions still needed include the best iOS product shape, Safari extension packaging, App Store requirements, link sharing flow, and whether iOS protection should be a share extension, browser-focused flow, app workflow, Safari web extension, or a mix of those options.
