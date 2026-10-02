/**
 * GMIAS - Gaming Market Intelligence Automation System
 *
 * Pulls fresh posts and articles from RSS feeds and web pages, sends them to
 * the Gemini API for analysis, saves the report as a Google Doc, and emails
 * the link to your recipients.
 *
 * SETUP: add these in Project Settings > Script properties (never in code):
 *   GEMINI_API_KEY      your Gemini API key (required)
 *   REPORT_RECIPIENTS   comma-separated emails to receive the report (required)
 *   GEMINI_MODELS       optional, comma-separated model names to try in order
 */

// ---------- Settings ----------
const DEFAULT_GEMINI_MODELS = ["gemini-3.5-flash", "gemini-2.5-flash"];
const MAX_ITEMS_PER_FEED = 6;     // newest items read from each RSS feed
const MAX_HTML_CHARS = 2500;      // characters kept from each web page
const MAX_RETRIES = 3;            // attempts per model
const TRIGGER_HOUR = 8;           // hour of day for the daily trigger (script time zone)

// Source name -> URL. RSS/Atom feeds and plain web pages are both supported.
const SOURCES = {
  "BlueStacks Community (Reddit)": "https://www.reddit.com/r/BlueStacks/.rss",
  "LDPlayer Blogs": "https://www.ldplayer.net/blog?category=370",
  "LDPlayer Community (Reddit)": "https://www.reddit.com/r/LDPlayerEmulator/.rss",
  "MuMu Player News": "https://www.mumuplayer.com/blog/news/",
  "MuMu Player Community (Reddit)": "https://www.reddit.com/r/MuMuPlayerOfficial/.rss",
  "Google Play Games Community (Reddit)": "https://www.reddit.com/r/googleplay/.rss",
  "Steam Community (Reddit)": "https://www.reddit.com/r/Steam/.rss",
  "Epic Games News": "https://store.epicgames.com/news",
  "AI News (TechCrunch)": "https://techcrunch.com/category/artificial-intelligence/feed/",
  "AI News (AI News Network)": "https://www.artificialintelligence-news.com/feed/",
  "AI News (Reddit r/artificial)": "https://www.reddit.com/r/artificial/.rss",
  "Social Trends (Discord Blog)": "https://discord.com/blog",
  "Social Trends (Meta Newsroom)": "https://about.fb.com/news/",
  "Social Media Marketing (Reddit)": "https://www.reddit.com/r/SocialMediaMarketing/.rss",
  "Gaming Community (r/gachagaming)": "https://www.reddit.com/r/gachagaming/.rss",
  "Gaming Community (r/AndroidGaming)": "https://www.reddit.com/r/AndroidGaming/.rss",
  "Gaming Community (r/MobileGaming)": "https://www.reddit.com/r/MobileGaming/.rss",
  "Gaming Community (r/MMORPG)": "https://www.reddit.com/r/MMORPG/.rss",
  "Gaming Community (r/emulators)": "https://www.reddit.com/r/emulators/.rss",
  "Gaming Community (r/gaming)": "https://www.reddit.com/r/gaming/.rss",
  "Gaming News (IGN Mobile)": "https://in.ign.com/mobile",
  "Gaming News (GameSpot)": "https://www.gamespot.com/category/news/",
  "Gaming News (PC Gamer)": "https://www.pcgamer.com/",
  "Gaming News (Android Authority)": "https://www.androidauthority.com/mobile-games/",
  "Gaming News (Pocket Gamer)": "https://www.pocketgamer.com/news/"
};

// ---------- Main entry point ----------
function generateAndEmailGamingReport() {
  const config = getConfig_();
  const dateString = new Date().toISOString().split("T")[0];
  const reportTitle = "Daily Gaming & Emulator Market Report - " + dateString;

  try {
    Logger.log("Scraping all brand, community, and publisher sources...");
    const reportContext = fetchAllSources_();

    const reportText = callGemini_(buildPrompt_(dateString, reportContext), config);
    const docUrl = createReportDoc_(reportTitle, reportText, config.recipients);

    GmailApp.sendEmail(
      config.recipients,
      "Ready: " + reportTitle,
      "Your automated Daily Gaming & Emulator Market Report for " + dateString +
        " has been generated.\n\nOpen it here:\n" + docUrl +
        "\n\n(The document is private and shared only with the report recipients.)"
    );
    Logger.log("Report generated and emailed: " + docUrl);
  } catch (error) {
    Logger.log("Error generating report: " + error.message);
    GmailApp.sendEmail(
      config.recipients,
      "Error: " + reportTitle,
      "There was an error generating your automated report today.\n\nError details: " + error.message
    );
  }
}

// Run this once to schedule the report daily. Re-running replaces the old trigger.
function setupDailyTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(function (t) { return t.getHandlerFunction() === "generateAndEmailGamingReport"; })
    .forEach(function (t) { ScriptApp.deleteTrigger(t); });

  ScriptApp.newTrigger("generateAndEmailGamingReport")
    .timeBased()
    .everyDays(1)
    .atHour(TRIGGER_HOUR)
    .create();
  Logger.log("Daily trigger set for around " + TRIGGER_HOUR + ":00.");
}

// ---------- Configuration ----------
function getConfig_() {
  const props = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty("GEMINI_API_KEY");
  const recipients = props.getProperty("REPORT_RECIPIENTS");
  if (!apiKey || !recipients) {
    throw new Error("Set GEMINI_API_KEY and REPORT_RECIPIENTS in Project Settings > Script properties.");
  }
  const modelList = props.getProperty("GEMINI_MODELS");
  const models = modelList
    ? modelList.split(",").map(function (m) { return m.trim(); }).filter(Boolean)
    : DEFAULT_GEMINI_MODELS;
  return { apiKey: apiKey, recipients: recipients, models: models };
}

// ---------- Step 1: fetch and parse sources ----------
function fetchAllSources_() {
  let reportContext = "";

  for (const sourceName in SOURCES) {
    try {
      const url = SOURCES[sourceName];
      const response = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true,
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MarketReportBot/1.0" }
      });

      let text = response.getContentText();
      let extractedData = "";

      if (url.includes(".rss") || url.includes("feed") || text.includes("<item>") || text.includes("<entry>")) {
        // RSS / Atom: keep the newest item titles
        const items = text.match(/<item>[\s\S]*?<\/item>|<entry>[\s\S]*?<\/entry>/g) || [];
        for (let i = 0; i < Math.min(MAX_ITEMS_PER_FEED, items.length); i++) {
          const titleMatch = items[i].match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
          if (titleMatch) {
            extractedData += "- " + (titleMatch[1] || titleMatch[2]) + "\n";
          }
        }
      } else {
        // Web page: strip scripts, styles and tags, keep the first chunk of text
        text = text
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ");
        extractedData = text.substring(0, MAX_HTML_CHARS) + "...";
      }

      reportContext += "\n--- SOURCE DATA: " + sourceName + " ---\n" +
        (extractedData || "No readable fresh data extracted.") + "\n";
    } catch (e) {
      Logger.log("Failed to extract from " + sourceName + ": " + e.toString());
    }
  }
  return reportContext;
}

// ---------- Step 2: build the prompt ----------
function buildPrompt_(dateString, reportContext) {
  return `
You are an expert market research AI. Generate the "Daily Gaming & Emulator Market Report".
Confirm today's actual date: ${dateString}. 

CRITICAL DIRECTIVE 1: Every single piece of information, update, bug, complaint, trend, or news item included in this report MUST have occurred strictly within the last 24 to 48 hours based on the live source data streams provided below. Do not look into your past historical training data or guess.

CRITICAL DIRECTIVE 2: If the provided source data does not show any new posts, changes, bugs, or articles within this 24 to 48 hour window, explicitly state "No new notable activity in the last 24 to 48 hours." DO NOT under any circumstances invent, predict, or hallucinate fake data to fill out the template.

CRITICAL DIRECTIVE 3: DO NOT print, embed, or mention any URLs, source links, or website addresses anywhere in the body of the report text. Simply summarize the facts, updates, and names of the platforms textually without displaying raw links or using markdown hyperlinks.

LIVE WEB DATA FROM YOUR ASSIGNED LINKS:
${reportContext}

Focus on:
1. Executive Summary: Provide a high-level, cohesive synthesis of the most critical updates, breaking trends, and competitive market shifts observed across all channels over the past 24 to 48 hours.
2. BlueStacks: Summarize latest bugs, user complaints, praise, and updates based exclusively on the BlueStacks Reddit data from the last 24 to 48 hours.
3. Competitor Overview: Group details into LDPlayer, MuMu Player, Google Play Games, Steam, and Epic Games based on their respective scraped site and subreddit data from the last 24 to 48 hours.
4. Head-to-Head Comparisons: Note any comparison talk happening in the emulator data streams from the last 24 to 48 hours.
5. AI News: Break down the latest breaking AI news and breakthroughs strictly into brief, clear bullet points based ONLY on the TechCrunch, AI News, and r/artificial streams over the last 24 to 48 hours.
6. Gaming News: Summarize the biggest gaming industry announcements, mobile releases, and updates strictly from the IGN, GameSpot, PC Gamer, Android Authority, and Pocket Gamer data streams over the last 24 to 48 hours. Break this down using brief bullet points.
7. Gaming Community: Summarize active trends, viral discussions, and major community topics strictly from the r/gachagaming, r/AndroidGaming, r/MobileGaming, r/MMORPG, r/emulators, and r/gaming data streams over the last 24 to 48 hours. Break this down using brief bullet points.
8. Social & Community Trends: Summarize social media movements using Discord, Meta, and SocialMediaMarketing streams from the last 24 to 48 hours.
9. Opportunities for BlueStacks: Analyze competitor complaints, bugs, or general user dissatisfaction highlighted in the data to list specific, actionable competitive openings where BlueStacks can win over users.
10. Recommended Community Posts & Campaign Ideas: Provide practical, concrete social media messaging blueprints or community engagement strategies tailored to today's trending discussions in the subreddits.

Format the output strictly using the exact structure below. DO NOT use any Markdown formatting symbols like # or *:

Daily Gaming & Emulator Market Report
Date: ${dateString}

1. Executive Summary

2. BlueStacks
- User feedback / praise
- Complaints
- Bugs and issues
- Feature requests
- Performance discussions
- New updates or announcements

3. Competitor Overview
- LDPlayer
- MuMu Player
- Google Play Games
- Steam
- Epic Games

4. Head-to-Head Comparisons

5. AI News
- News point 1
- News point 2
- News point 3

6. Gaming News
- News point 1
- News point 2
- News point 3

7. Gaming Community
- Trend/Discussion point 1
- Trend/Discussion point 2
- Trend/Discussion point 3

8. Social & Community Trends

9. Opportunities for BlueStacks
- Opportunity 1
- Opportunity 2

10. Recommended Community Posts & Campaign Ideas
- Idea 1
- Idea 2

11. Overall Sentiment Summary

12. Sources
(List the text names of the publications, forums, or platforms utilized for research in the last 24 to 48 hours, but do not provide raw URLs).
  `;
}

// ---------- Step 3: call Gemini (model fallback + retry) ----------
function callGemini_(promptText, config) {
  const payload = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: { temperature: 0.2 }
  };

  for (let m = 0; m < config.models.length; m++) {
    const model = config.models[m];
    // The key travels in a header, not the URL, so it can't leak into logs or error messages.
    const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent";
    const options = {
      method: "post",
      contentType: "application/json",
      headers: { "x-goog-api-key": config.apiKey },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    let delayTime = 4000;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        Logger.log("Running analysis with " + model + " (attempt " + attempt + "/" + MAX_RETRIES + ")...");
        const json = JSON.parse(UrlFetchApp.fetch(apiUrl, options).getContentText());

        if (json.error) {
          const message = String(json.error.message || "");
          if (message.includes("high demand") || json.error.code == 429 || json.error.code == 503) {
            Utilities.sleep(delayTime);
            delayTime *= 2;
            continue;
          }
          throw new Error(message || "Unknown API error");
        }

        const text = json.candidates && json.candidates[0] &&
          json.candidates[0].content && json.candidates[0].content.parts &&
          json.candidates[0].content.parts[0] && json.candidates[0].content.parts[0].text;
        if (!text) {
          throw new Error("The API returned no report text.");
        }
        return text;
      } catch (e) {
        Logger.log("Fetch error with " + model + ": " + e.message);
        Utilities.sleep(delayTime);
        delayTime *= 2;
      }
    }
  }
  throw new Error("Failed to generate the report after trying all models (high API demand or an API error).");
}

// ---------- Step 4: save the report as a private Google Doc ----------
function createReportDoc_(title, content, recipients) {
  const doc = DocumentApp.create(title);
  doc.getBody().setText(content);
  doc.saveAndClose();

  // Docs are private by default. Share only with the people who should read it.
  const emails = recipients.split(",").map(function (e) { return e.trim(); }).filter(Boolean);
  DriveApp.getFileById(doc.getId()).addViewers(emails);

  return doc.getUrl();
}
