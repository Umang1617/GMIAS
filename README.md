# 📊 GMIAS: Gaming Market Intelligence Automation System

**A lightweight Google Apps Script that scans 25 gaming, emulator, AI and social sources every day, asks Gemini to analyze them, and emails you a ready-to-read market report as a Google Doc.**

![Google Apps Script](https://img.shields.io/badge/Google_Apps_Script-4285F4?style=flat-square&logo=google&logoColor=white)
![Gemini API](https://img.shields.io/badge/Gemini_API-8E75B2?style=flat-square&logo=googlegemini&logoColor=white)
![Google Docs](https://img.shields.io/badge/Google_Docs-4285F4?style=flat-square&logo=googledocs&logoColor=white)
![Gmail](https://img.shields.io/badge/Gmail-EA4335?style=flat-square&logo=gmail&logoColor=white)

No servers, no database, no dependencies. Everything runs inside your Google account.

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
Google Doc (private, shared only with recipients)
        │
        ▼
Gmail: link sent to your recipients
```

If the AI call fails, you get an error email instead of silence. If the first model is busy, the script retries with backoff and falls back to the next model.

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

Add or remove sources by editing the `SOURCES` object at the top of `Code.gs`. RSS/Atom feeds and plain web pages both work.

## Setup (about 10 minutes)

1. Go to [script.google.com](https://script.google.com) and create a **New project**.
2. Replace the contents of `Code.gs` with the file from this repo. In **Project Settings**, tick *Show "appsscript.json" manifest file* and paste in `appsscript.json` too (optional, but it sets the time zone and permissions).
3. Open **Project Settings → Script properties** and add:

   | Property | Value |
   |---|---|
   | `GEMINI_API_KEY` | Your key from [Google AI Studio](https://aistudio.google.com/app/apikey) |
   | `REPORT_RECIPIENTS` | One or more emails, separated by commas |
   | `GEMINI_MODELS` | *(optional)* Models to try in order, e.g. `gemini-2.5-flash` |

4. Select `generateAndEmailGamingReport` and click **Run**. Approve the permission prompts the first time.
5. Check your inbox. Then run `setupDailyTrigger` once to schedule the report daily (set `TRIGGER_HOUR` in `Code.gs` to change the time).

Prefer the command line? [clasp](https://github.com/google/clasp) works too: `clasp create --type standalone`, then `clasp push`.

## Configuration

| Setting | Where | Default |
|---|---|---|
| API key | Script property `GEMINI_API_KEY` | none (required) |
| Recipients | Script property `REPORT_RECIPIENTS` | none (required) |
| Models | Script property `GEMINI_MODELS` | `gemini-3.5-flash`, `gemini-2.5-flash` |
| Items read per feed | `MAX_ITEMS_PER_FEED` in `Code.gs` | 6 |
| Text kept per web page | `MAX_HTML_CHARS` in `Code.gs` | 2500 |
| Retries per model | `MAX_RETRIES` in `Code.gs` | 3 |
| Daily run hour | `TRIGGER_HOUR` in `Code.gs` | 8 |

Check the model names against what's currently available in Google AI Studio and update `GEMINI_MODELS` if needed.

## Security

- The API key and recipient emails live in **Script properties**, never in the code, so the code is safe to publish.
- The key is sent in a request header rather than the URL, so it can't leak through logs or error messages.
- Report docs are **private** and shared only with `REPORT_RECIPIENTS`.
- If a key was ever pasted into code you shared or committed, revoke it in Google AI Studio and create a new one.

## Limitations

- **Freshness comes from the prompt, not the parser.** The script collects feed titles and page text without publish dates, so the 24-48 hour rule is something the model is asked to follow, not something the code checks. Treat the report as a draft to review.
- **Web pages are a rough read.** JavaScript-heavy pages may return little text, and only the first 2,500 characters are kept.
- **Feeds can fail.** Sites sometimes block automated requests or rate-limit them. Failed sources are skipped and logged.
- **Scraped text is untrusted.** Posts and pages are passed to the model as-is, so skim the output before sharing it widely.
- Check each site's terms before scraping, and keep the volume low.

## Roadmap

- [ ] Filter feed items by publish date in code
- [ ] Source health summary at the end of each run
- [ ] Optional Slack or Telegram delivery
- [ ] Week-over-week trend comparison

## Author

Built by [Umang Srivastava](https://www.linkedin.com/in/umang1617/).
