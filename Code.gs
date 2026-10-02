function generateAndEmailGamingReport() {
  // 1. Configuration
  const apiKey = "your_API_KEY_here"; 
  const recipientEmail = "Example@xyz.com"; //Multiple emails can be provided seprated by comma  
  
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  const reportTitle = `Daily Gaming & Emulator Market Report - ${dateString}`;

  // 2. Fetch Live Data From All Your Custom Sources
  Logger.log("🌐 Scraping all custom brand, community, and publisher sources...");
  let reportContext = "";

  // Helper object mapping sources to their target sections
  const sources = {
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
    // Brand New Gaming News Publishers Added
    "Gaming News (IGN Mobile)": "https://in.ign.com/mobile",
    "Gaming News (GameSpot)": "https://www.gamespot.com/category/news/",
    "Gaming News (PC Gamer)": "https://www.pcgamer.com/",
    "Gaming News (Android Authority)": "https://www.androidauthority.com/mobile-games/",
    "Gaming News (Pocket Gamer)": "https://www.pocketgamer.com/news/"
  };

  for (let sourceName in sources) {
    try {
      let url = sources[sourceName];
      let response = UrlFetchApp.fetch(url, { 
        muteHttpExceptions: true,
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MarketReportBot/1.0" }
      });
      
      let text = response.getContentText();
      let extractedData = "";

      if (url.includes(".rss") || url.includes("feed") || text.includes("<item>") || text.includes("<entry>")) {
        // --- RSS Parsing Logic (Reddit & Feeds) ---
        let items = text.match(/<item>[\s\S]*?<\/item>|<entry>[\s\S]*?<\/entry>/g) || [];
        for (let i = 0; i < Math.min(6, items.length); i++) {
          let titleMatch = items[i].match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
          if (titleMatch) {
            extractedData += `- ${titleMatch[1] || titleMatch[2]}\n`;
          }
        }
      } else {
        // --- HTML Parsing Logic (Company Blogs & Publisher Web Links) ---
        text = text.replace(/<script[\s\S]*?<\/script>/gi, '')
                   .replace(/<style[\s\S]*?<\/style>/gi, '')
                   .replace(/<[^>]+>/g, ' ')
                   .replace(/\s+/g, ' ');
        extractedData = text.substring(0, 2500) + "...";
      }

      reportContext += `\n--- SOURCE DATA: ${sourceName} ---\n${extractedData || "No readable fresh data extracted."}\n`;
    } catch (e) {
      Logger.log(`Failed to extract from ${sourceName}: ${e.toString()}`);
    }
  }

  // 3. Prompt (Timeframe constraints kept at 24 to 48 hours, new Gaming News section included)
  const promptText = `
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

  // 4. Call the Gemini API (With Model Fallback)
  let json;
  let success = false;
  const models = ["gemini-3.5-flash", "gemini-2.5-flash"];

  for (let model of models) {
    if (success) break;
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const payload = {
      "contents": [{ "parts": [{ "text": promptText }] }],
      "generationConfig": { "temperature": 0.2 }
    };
    const options = {
      "method": "post",
      "contentType": "application/json",
      "payload": JSON.stringify(payload),
      "muteHttpExceptions": true
    };

    let delayTime = 4000;
    for (let i = 0; i < 3; i++) {
      try {
        Logger.log(`🤖 Executing analysis via model: ${model} (Attempt ${i + 1}/3)...`);
        const response = UrlFetchApp.fetch(apiUrl, options);
        json = JSON.parse(response.getContentText());
        
        if (json.error) {
          if (json.error.message.includes("high demand") || json.error.code == 429 || json.error.code == 503) {
            Utilities.sleep(delayTime);
            delayTime *= 2;
            continue;
          }
          throw new Error(json.error.message);
        }
        
        success = true;
        break; 
      } catch (e) {
        Logger.log(`Fetch error with ${model}: ` + e.toString());
        Utilities.sleep(delayTime);
        delayTime *= 2;
      }
    }
  }

  // 5. Create Google Document and Send Email
  try {
    if (!success) {
      throw new Error("Failed to generate report after trying all fallback models due to high API demand.");
    }

    let reportContent = json.candidates[0].content.parts[0].text;

    const doc = DocumentApp.create(reportTitle);
    const body = doc.getBody();
    
    body.insertParagraph(0, reportContent);
    doc.saveAndClose();
    
    const fileId = doc.getId();
    const file = DriveApp.getFileById(fileId);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    
    const docUrl = doc.getUrl();

    const emailSubject = `✅ Ready: ${reportTitle}`;
    const emailBody = `Your automated Daily Gaming & Emulator Market Report for ${dateString} has been successfully generated.\n\nYou can access and edit the report here:\n${docUrl}\n\n(Note: Anyone with this link has Editor access to this document.)`;

    GmailApp.sendEmail(recipientEmail, emailSubject, emailBody);
    Logger.log("Report generated and emailed successfully: " + docUrl);

  } catch (error) {
    Logger.log("Error generating report: " + error.toString());
    GmailApp.sendEmail(
      recipientEmail, 
      `❌ Error: ${reportTitle}`, 
      `There was an error generating your automated report today.\n\nError details: ${error.toString()}`
    );
  }
}
