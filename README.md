# 📊 GMIAS: Gaming Market Intelligence Automation System

**A lightweight Google Apps Script that scans 25 gaming, emulator, AI and social sources, asks Gemini to analyze them, and emails you a ready-to-read market report as a Google Doc.**

![Google Apps Script](https://img.shields.io/badge/Google_Apps_Script-4285F4?style=flat-square&logo=google&logoColor=white)
![Gemini API](https://img.shields.io/badge/Gemini_API-8E75B2?style=flat-square&logo=googlegemini&logoColor=white)
![Google Docs](https://img.shields.io/badge/Google_Docs-4285F4?style=flat-square&logo=googledocs&logoColor=white)
![Gmail](https://img.shields.io/badge/Gmail-EA4335?style=flat-square&logo=gmail&logoColor=white)

One file, no servers, no database, no dependencies. Everything runs inside your Google account.

<!-- TODO: add a screenshot of a sample report here -->

---

## How it works

```
25 sources (Reddit RSS, news feeds, web pages)
        │
        ▼
Parse: RSS titles or cleaned page text
        │
        ▼
Gemini API (strict 24-48 hour, no-hallucination prompt)
        │
        ▼
Google Doc (shared only with your recipients)
        │
        ▼
Gmail: link sent to your recipients
```

If the first Gemini model is busy, the script retries with backoff (3 attempts, doubling the wait) and then falls back to the next model. If everything fails, you get an error email instead of silence.

## What's in the report

1. Executive Summary
2. BlueStacks: feedback, complaints, bugs, feature requests, performance, updates
3. Competitor Overview: LDPlayer, MuMu Player, Google Play Games, Steam, Epic Games
4. Head-to-Head Comparisons
5. AI News
6. Gaming News
7. Gaming Community
8. Social & Community Trends
9. Opportunities for BlueStacks
10. Recommended Community Posts & Campaign Ideas
11. Overall Sentiment Summary
12. Sources (names only, no raw links)

The prompt tells the model to use only the live data it was given, to say "No new notable activity" when there's nothing new, and never to invent data.

## Sources

| Group | Examples |
|---|---|
| Brand and competitors | r/BlueStacks, LDPlayer blog and subreddit, MuMu Player news and subreddit, Google Play Games, Steam, Epic Games News |
| AI news | TechCrunch AI, AI News Network, r/artificial |
| Gaming news | IGN Mobile, GameSpot, PC Gamer, Android Authority, Pocket Gamer |
| Gaming communities | r/gachagaming, r/AndroidGaming, r/MobileGaming, r/MMORPG, r/emulators, r/gaming |
| Social trends | Discord Blog, Meta Newsroom, r/SocialMediaMarketing |

Add or remove sources by editing the `sources` object in `Code.gs`. RSS/Atom feeds and plain web pages both work.

## Setup (about 10 minutes)

1. Go to [script.google.com](https://script.google.com) and create a **New project**.
2. Replace the contents of the editor with `Code.gs` from this repo.
3. Open **Project Settings** (gear icon) → **Script Properties** → **Add script property**, and add:

   | Property | Value |
   |---|---|
   | `GEMINI_API_KEY` | Your key from [Google AI Studio](https://aistudio.google.com/app/apikey) |
   | `RECIPIENT_EMAIL` | Your email (separate several with commas) |

   Property names must match exactly, including capitalization. Click **Save script properties**.
4. Select `generateAndEmailGamingReport` and click **Run**. Approve the permission prompts the first time.
5. Check your inbox for the report link.
6. To run it daily, open **Triggers** (the clock icon) → **Add Trigger** → choose `generateAndEmailGamingReport` → **Time-driven** → **Day timer** → pick a time.

## Configuration

| Setting | Where | Default |
|---|---|---|
| API key | Script Property `GEMINI_API_KEY` | none (required) |
| Recipients | Script Property `RECIPIENT_EMAIL` | none (required) |
| Sources | `sources` object in `Code.gs` | 25 sources |
| Items read per feed | `Math.min(6, ...)` | 6 |
| Text kept per web page | `substring(0, 2500)` | 2500 characters |
| Models | `models` array | `gemini-3.5-flash`, `gemini-2.5-flash` |
| Retries per model | `for (let i = 0; i < 3; ...)` | 3 |

Check the model names against what's currently available in Google AI Studio and update the `models` array if needed.

## Security notes

- **Secrets live in Script Properties, not in the code.** This repo contains no keys or email addresses. Keep it that way when you push changes. If a real key is ever committed or shared, revoke it in Google AI Studio and create a new one.
- **The report document is shared only with your recipients.** The script adds each address in `RECIPIENT_EMAIL` as an editor and does not create a public link.
- **The API key is sent in the request URL.** If an API call fails, the URL (and key) can appear in your execution logs. Don't share those logs.

## Limitations

- **Freshness comes from the prompt, not the parser.** The script collects feed titles and page text without publish dates, so the 24-48 hour rule is something the model is asked to follow, not something the code checks. Treat the report as a draft to review.
- **Recipients need Google accounts** to open the Doc, since access is granted per address.
- **Web pages are a rough read.** JavaScript-heavy pages may return little text, and only the first 2,500 characters are kept.
- **Feeds can fail.** Sites sometimes block automated requests or rate-limit them. Failed sources are skipped and logged.
- **Scraped text is untrusted.** Posts and pages are passed to the model as-is, so skim the output before sharing it widely.
- Check each site's terms before scraping, and keep the volume low.

## Roadmap

- [x] Move the API key and recipients into Script Properties
- [ ] Filter feed items by publish date
- [ ] Source health summary at the end of each run
- [ ] Optional Slack or Telegram delivery

## Author

Built by [Umang Srivastava](https://www.linkedin.com/in/umang1617/).
