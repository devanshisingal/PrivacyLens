import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { execSync } from "child_process";
import {
 findBestNoise
}
from "./backend/optimizer";
import cors from "cors";



dotenv.config();

const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json());

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Lowdb-like simple JSON database persistence
const DB_FILE = path.join(process.cwd(), "database.json");

interface DBStore {
  users: Array<{ id: string; email: string; createdAt: string }>;
  history: Array<{ id: string; userId: string; domain: string; category: string; timestamp: string }>;
  predictions: Record<string, any>;
}

const DEFAULT_USER_ID = "user_devanshi1896";
const DEFAULT_USER_EMAIL = "devanshi1896@gmail.com";

const SEED_HISTORY = [
  { id: "h1", userId: DEFAULT_USER_ID, domain: "github.com", category: "Programming", timestamp: new Date(Date.now() - 3600000 * 8).toISOString() },
  { id: "h2", userId: DEFAULT_USER_ID, domain: "leetcode.com", category: "Programming", timestamp: new Date(Date.now() - 3600000 * 7).toISOString() },
  { id: "h3", userId: DEFAULT_USER_ID, domain: "stackoverflow.com", category: "Programming", timestamp: new Date(Date.now() - 3600000 * 6).toISOString() },
  { id: "h4", userId: DEFAULT_USER_ID, domain: "python.org", category: "Programming", timestamp: new Date(Date.now() - 3600000 * 5).toISOString() },
  { id: "h5", userId: DEFAULT_USER_ID, domain: "openai.com", category: "AI / ML", timestamp: new Date(Date.now() - 3600000 * 4.5).toISOString() },
  { id: "h6", userId: DEFAULT_USER_ID, domain: "huggingface.co", category: "AI / ML", timestamp: new Date(Date.now() - 3600000 * 4).toISOString() },
  { id: "h7", userId: DEFAULT_USER_ID, domain: "espn.com", category: "Sports", timestamp: new Date(Date.now() - 3600000 * 3).toISOString() },
  { id: "h8", userId: DEFAULT_USER_ID, domain: "netflix.com", category: "Entertainment", timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: "h9", userId: DEFAULT_USER_ID, domain: "amazon.com", category: "Shopping", timestamp: new Date(Date.now() - 3600000 * 1).toISOString() }
];

function readDB(): DBStore {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading database file, using defaults", error);
  }

  const initialDB: DBStore = {
    users: [{ id: DEFAULT_USER_ID, email: DEFAULT_USER_EMAIL, createdAt: new Date().toISOString() }],
    history: SEED_HISTORY,
    predictions: {}
  };
  writeDB(initialDB);
  return initialDB;
}

function writeDB(data: DBStore) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing to database file", error);
  }
}

function getInterestPredictions(historyText: string) {
  try {
    const output = execSync(
      `python backend/predict.py "${historyText}"`
    ).toString();

    return JSON.parse(output);
  } catch (err) {
    console.error("Interest prediction failed", err);

    return {
      "Programming": 0.05,
      "AI / ML": 0.05,
      "Gaming": 0.05,
      "Social Media": 0.05,
      "Finance": 0.05,
      "Entertainment": 0.05,
      "Sports": 0.05,
      "Shopping": 0.05,
      "Cooking": 0.05,
      "Travel": 0.05,
      "Photography": 0.05,
      "Gardening": 0.05,
      "General Search & News": 0.05
    };
  }
}

function getProfilePredictions(
  historyText: string
) {

  try {

    const output = execSync(
      `python backend/profile_predict.py "${historyText}"`
    ).toString();

    return JSON.parse(output);

  } catch(err) {

    console.error(
      "Profile prediction failed",
      err
    );

    return {
      Developer:0.2,
      Gamer:0.2,
      Student:0.2,
      TechBuyer:0.2,
      CryptoEnthusiast:0.1,
      LifestyleBuyer:0.1
    };
  }
}


function predictRisk(
  confidence:number,
  uniqueness:number,
  exposure:number
){

  try{

    const output=
      execSync(
`python backend/risk_predict.py ${confidence} ${uniqueness} ${exposure}`
      ).toString();

    return JSON.parse(output);

  }catch(err){

    console.error(
      "Risk prediction failed",
      err
    );

    return {
      risk:50
    };
  }
}

function getShapValues(
  historyText:string
){

 try{

  const output=
   execSync(
`python backend/shap_profile.py "${historyText}"`
   ).toString();

  return JSON.parse(output);

 }catch(err){

  console.error(
   "SHAP failed",
   err
  );

  return [];
 }
}

// Standard baseline rule-based categorization
function categorizeDomainOffline(domain: string): string {
  const d = domain.toLowerCase().trim();
  if (d.includes("github.com") || d.includes("github.io") || d.includes("gitlab.com")) return "Programming";
  if (d.includes("leetcode.com") || d.includes("hackerrank.com") || d.includes("codewars.com")) return "Programming";
  if (d.includes("stackoverflow.com") || d.includes("stackexchange.com")) return "Programming";
  if (d.includes("python.org") || d.includes("typescriptlang.org") || d.includes("npmjs.com") || d.includes("rust-lang")) return "Programming";
  if (d.includes("aws.") || d.includes("console.aws") || d.includes("google.cloud") || d.includes("supabase.co") || d.includes("vercel.com")) return "Programming";
  
  if (d.includes("openai.com") || d.includes("chatgpt.com") || d.includes("claude.ai") || d.includes("anthropic.com")) return "AI / ML";
  if (d.includes("huggingface.co") || d.includes("replicate.com") || d.includes("deepmind.com") || d.includes("cohere.com")) return "AI / ML";
  if (d.includes("midjourney.com") || d.includes("stability.ai")) return "AI / ML";

  if (d.includes("steam") || d.includes("steampowered.com") || d.includes("epicgames.com") || d.includes("riotgames.com") || d.includes("valorant")) return "Gaming";
  if (d.includes("twitch.tv") || d.includes("discord.com") || d.includes("roblox.com") || d.includes("ign.com") || d.includes("kotaku.com")) return "Gaming";

  if (d.includes("youtube.com") || d.includes("youtu.be") || d.includes("netflix.com") || d.includes("spotify.com") || d.includes("disneyplus.com") || d.includes("hulu.com")) return "Entertainment";

  if (d.includes("espn.com") || d.includes("nba.com") || d.includes("nfl.com") || d.includes("sports.yahoo.com") || d.includes("bleacherreport.com")) return "Sports";

  if (d.includes("twitter.com") || d.includes("x.com") || d.includes("instagram.com") || d.includes("instagr.am") || d.includes("tiktok.com") || d.includes("facebook.com") || d.includes("linkedin.com")) return "Social Media";

  if (d.includes("amazon.com") || d.includes("ebay.com") || d.includes("target.com") || d.includes("walmart.com") || d.includes("aliexpress.com") || d.includes("shopify.com")) return "Shopping";

  if (d.includes("fidelity.com") || d.includes("robinhood.com") || d.includes("coinbase.com") || d.includes("bloomberg.com") || d.includes("chase.com") || d.includes("paypal.com")) return "Finance";

  if (d.includes("recipe") || d.includes("cooking.com") || d.includes("foodnetwork.com") || d.includes("allrecipes.com") || d.includes("seriouseats.com")) return "Cooking";
  if (d.includes("travel") || d.includes("expedia.com") || d.includes("airbnb.com") || d.includes("booking.com") || d.includes("lonelyplanet.com")) return "Travel";
  if (d.includes("camera") || d.includes("photography") || d.includes("dpreview.com") || d.includes("unsplash.com") || d.includes("flickr.com")) return "Photography";
  if (d.includes("gardening") || d.includes("gardeners.com") || d.includes("royalhorticultural.org") || d.includes("backyardgardener.com")) return "Gardening";

  return "General Search & News";
}

// Predict domain category with Gemini or fallback
async function predictCategory(domain: string): Promise<string> {
  if (!ai) {
    return categorizeDomainOffline(domain);
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Categorize the domain "${domain}" into exactly one of these pre-defined categories based on its primary function or typical advertiser relevance:
- Programming (coding tools, developer services like Github, Stackoverflow)
- AI / ML (artificial intelligence, machine learning tools like OpenAI, Claude, HuggingFace)
- Gaming (steam, console games, twitch, esports)
- Social Media (twitter, reddit, instagram, etc.)
- Finance (banking, stock trading, crypto like robinhood, coinbase, fidelity)
- Entertainment (streaming, music, youtube, netflix)
- Sports (news, scores, leagues like espn)
- Shopping (retailers like amazon, target)
- Cooking (recipe blogs, kitchen apps)
- Travel (flights, hotels, trip planners)
- Photography (cameras, editing software, image bases)
- Gardening (plants, yards, agricultural logs)
- General Search & News (generic search engines, news publishers like nytimes, wikipedia)

Respond with ONLY the name of the category (e.g. "Programming", "AI / ML", "Social Media", etc.). Do not include punctuation, explanations, or any other characters.`,
    });
    const content = response.text ? response.text.trim() : "";
    const allowed = ["Programming", "AI / ML", "Gaming", "Social Media", "Finance", "Entertainment", "Sports", "Shopping", "Cooking", "Travel", "Photography", "Gardening", "General Search & News"];
    const found = allowed.find(cat => content.toLowerCase().includes(cat.toLowerCase()));
    return found || categorizeDomainOffline(domain);
  } catch (error) {
    console.error("Gemini domain categorization failed, using offline lookup", error);
    return categorizeDomainOffline(domain);
  }
}

// Compute all statistical engine outputs
function computeTelemetry(
  history: Array<{
    category: string;
    domain?: string;
  }>
) {
  const categoriesCount: Record<string, number> = {};
  history.forEach(item => {
    categoriesCount[item.category] = (categoriesCount[item.category] || 0) + 1;
  });

  const totalHits = history.length || 1;

  const allCategories = [
    "Programming", "AI / ML", "Gaming", "Social Media", 
    "Finance", "Entertainment", "Sports", "Shopping", 
    "Cooking", "Travel", "Photography", "Gardening", "General Search & News"
  ];

  const historyText = history
  .map((h: any) => h.domain || h.category)
  .join(" ");

const interests = getInterestPredictions(historyText);
const profiles =
  getProfilePredictions(
    historyText
  );
  

  const shapValues = {
  global: []
};

  // Calculate Privacy Risk details: Risk = Confidence + Uniqueness + Tracker Exposure
  const profileScores = Object.values(profiles).sort((a,b) => b-a);
  const maxProfileScore = profileScores[0] || 0.1;
  const runnerProfileScore = profileScores[1] || 0.05;
  const confidence = Math.round(((maxProfileScore + runnerProfileScore) / 2) * 100);

  // Uniqueness: ratio of niche developer or AI visits to general visits
  const techCount = (categoriesCount["Programming"] || 0) + (categoriesCount["AI / ML"] || 0);
  const uniquenessRatio = Math.min(1, techCount / totalHits);
  const uniqueness = Math.round((0.25 + uniquenessRatio * 0.7) * 100);

  // Tracker Exposure: based on ads / tracking networks generally found on commercial vs dev sites
  const generalCommHits = (categoriesCount["Social Media"] || 0) + (categoriesCount["Shopping"] || 0) + (categoriesCount["Entertainment"] || 0);
  const exposureRatio = Math.min(1, (generalCommHits * 1.5 + techCount * 0.8) / totalHits);
  const trackerExposure = Math.min(99, Math.round((0.35 + exposureRatio * 0.6) * 100));

  // Risk = Confidence (40%) + Uniqueness (30%) + Tracker Exposure (30%)
  const riskResult =
predictRisk(
  confidence,
  uniqueness,
  trackerExposure
);

const riskScore =
Math.min(
99,
Math.max(
10,
Math.round(
 riskResult.risk
)
)
);
  const level = riskScore > 75 ? "High" : riskScore > 40 ? "Medium" : "Low";

  return {
    userId: DEFAULT_USER_ID,
    interests,
    profiles,
    shapValues,
    risk: {
      score: riskScore,
      level,
      confidence,
      uniqueness,
      trackerExposure
    }
  };
}


function simulateWithoutDomain(
    history:any[],
    domain:string
){

    const filtered =
        history.filter(
            h => h.domain !== domain
        );

    return computeTelemetry(
        filtered
    );
}

function calculateDomainImpact(
  history: any[]
) {

  const current =
    computeTelemetry(history);

  const currentRisk =
    current.risk.score;

  const domains = [
    ...new Set(
      history.map(
        h => h.domain
      )
    )
  ];

  const results = [];

  for (const domain of domains) {

    const simulated =
      simulateWithoutDomain(
        history,
        domain
      );

    const simulatedRisk =
      simulated.risk.score;

    results.push({

      domain,

      currentRisk,

      simulatedRisk,

      riskReduction:
        currentRisk -
        simulatedRisk,

      currentDeveloper:
        current.profiles
          ?.Developer || 0,

      simulatedDeveloper:
        simulated.profiles
          ?.Developer || 0
    });
  }

  return results.sort(
    (a, b) =>
      b.riskReduction -
      a.riskReduction
  );
}

// REST API Endpoints

// Reset user history to baseline seed data (excellent for interactive demos!)
app.post("/api/reset", (req, res) => {
  const db = readDB();
  db.history = [...SEED_HISTORY];
  db.predictions[DEFAULT_USER_ID] = computeTelemetry(db.history);
  writeDB(db);
  res.json({
    message: "History and predictions reset to baseline successfully",
    history: db.history,
    predictions: db.predictions[DEFAULT_USER_ID]
  });
});

// GET /api/history - Get browsing history list
app.get("/api/history", (req, res) => {
  const db = readDB();
  res.json({ history: db.history });
});

// POST /api/history - Upload browsing data
app.post("/api/history", async (req, res) => {
  const { domain } = req.body;
  if (!domain || typeof domain !== "string") {
    return res.status(400).json({ error: "domain is required of type string" });
  }

  // Pre-process domain host
  let host = domain.trim();
  host = host.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];

  const db = readDB();

  // Find category - either compute offline or query Gemini
  const category = await predictCategory(host);

  const newItem = {
    id: "h_" + Math.random().toString(36).substring(2, 9),
    userId: DEFAULT_USER_ID,
    domain: host,
    category,
    timestamp: new Date().toISOString()
  };

  db.history.unshift(newItem); // put at top of list
  const state = computeTelemetry(db.history);
  db.predictions[DEFAULT_USER_ID] = state;
  writeDB(db);

  res.json({
    message: "Browsing item added successfully and telemetry updated",
    item: newItem,
    predictions: state
  });
});

// DELETE /api/history/:id - Delete a specific history entry to show dynamic live updates!
app.delete("/api/history/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.history = db.history.filter(item => item.id !== id);
  const state = computeTelemetry(db.history);
  db.predictions[DEFAULT_USER_ID] = state;
  writeDB(db);

  res.json({
    message: "Browsing item removed successfully",
    predictions: state
  });
});

// POST /api/predict/interests - Predict interests
app.post("/api/predict/interests", (req, res) => {
  const { history } = req.body;
  if (!Array.isArray(history)) {
    return res.status(400).json({ error: "history must be an array of domains or history items" });
  }

  const items = history.map((item, idx) => {
    const domain = typeof item === "string" ? item : item.domain;
    const cat = typeof item === "object" && item.category ? item.category : categorizeDomainOffline(domain);
    return { category: cat };
  });

  const runState = computeTelemetry(items);
  res.json({ interests: runState.interests });
});

// POST /api/predict/profile - Simulate advertiser matching based on interests
app.post(
 "/api/predict/profile",
 (req,res)=>{

  const { history } = req.body;

  if(!history){
    return res.status(400).json({
      error:"history required"
    });
  }

  const historyText =
    Array.isArray(history)
      ? history.join(" ")
      : history;

  const profiles =
    getProfilePredictions(
      historyText
    );

  res.json({
    profiles
  });
});

// GET /api/risk - Get risk metrics for default user
app.get("/api/risk", (req, res) => {
  const db = readDB();
  const state = db.predictions[DEFAULT_USER_ID] || computeTelemetry(db.history);
  res.json(state.risk);
});

// GET /api/recommendations - Get anti-profiling decoy browsing recommendations
app.get("/api/recommendations", async (req, res) => {
  const db = readDB();
  const state = db.predictions[DEFAULT_USER_ID] || computeTelemetry(db.history);

  // Find top advertiser profiles that need dilution
  const profilesMap = state.profiles || {};
  const activeProfiles = Object.entries(profilesMap)
    .sort((a: any, b: any) => b[1] - a[1])
    .filter((p: any) => p[1] > 0.40)
    .map(p => p[0]);

  const topProfiles = activeProfiles.length > 0 ? activeProfiles : ["Developer", "TechBuyer"];

  // Query Gemini API recursively or fallback deterministically
  const recommendations = await aiGetDecoys(topProfiles);
  res.json({ recommendations });
});

app.post(
 "/api/counterfactual",
 (req,res)=>{

  const { removeDomain } =
      req.body;

  const db = readDB();

  const current =
      computeTelemetry(
        db.history
      );

  const simulated =
      simulateWithoutDomain(
        db.history,
        removeDomain
      );

  res.json({

    removeDomain,

    currentRisk:
      current.risk.score,

    simulatedRisk:
      simulated.risk.score,

    delta:
      current.risk.score -
      simulated.risk.score,

    currentProfiles:
      current.profiles,

    simulatedProfiles:
      simulated.profiles
  });

 });

 app.get(
 "/api/domain-impact",
 (req,res)=>{

  const db = readDB();

  const impacts =
    calculateDomainImpact(
      db.history
    );

  res.json({
    impacts
  });

 });
 
async function aiGetDecoys(topProfiles: string[]) {

  const defaultDecoys = [
    {
      category: "Gardening",
      reason: "Diversifies advertiser assumptions away from technical interests.",
      suggestedDomains: [
        "gardeners.com",
        "almanac.com"
      ],
      suggestedQueries: [
        "best plants for balcony",
        "how to grow tomatoes"
      ]
    },
    {
      category: "Photography",
      reason: "Creates signals associated with creative and visual interests.",
      suggestedDomains: [
        "dpreview.com",
        "flickr.com"
      ],
      suggestedQueries: [
        "best beginner camera",
        "portrait photography tips"
      ]
    },
    {
      category: "Cooking",
      reason: "Adds lifestyle-oriented browsing behavior.",
      suggestedDomains: [
        "allrecipes.com",
        "foodnetwork.com"
      ],
      suggestedQueries: [
        "easy pasta recipe",
        "healthy meal prep"
      ]
    }
  ];

  return defaultDecoys;
}


// Global API Fallbacks / Catch-Alls
app.get("/api/telemetry", (req, res) => {
  const db = readDB();
  const state = db.predictions[DEFAULT_USER_ID] || computeTelemetry(db.history);
  res.json(state);
});

// Configure Vite or Static Assets serving based on Environment
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Configuring Vite Development Server Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Configuring Production Static assets serving...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PrivacyLens backend container running fully on http://0.0.0.0:${PORT}`);
  });
}

// Initialise DB predictions on launch
try {
  const launchDB = readDB();
  launchDB.predictions[DEFAULT_USER_ID] = computeTelemetry(launchDB.history);
  writeDB(launchDB);
} catch (e) {
  console.error("Initial DB boot prediction failed", e);
}

startServer();
