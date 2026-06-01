import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { WEDDING_DETAILS } from "./src/data/weddingDetails";

const app = express();
const PORT = 3000;
const RSVP_FILE = path.join(process.cwd(), "rsvps.json");

// Parse JSON and URL encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper to ensure RSVP file exists
function initRSVPFile() {
  if (!fs.existsSync(RSVP_FILE)) {
    try {
      fs.writeFileSync(RSVP_FILE, JSON.stringify([], null, 2), "utf8");
    } catch (err) {
      console.error("Failed to initialize rsvps.json:", err);
    }
  }
}
initRSVPFile();

// Helper to read RSVPs
function readRSVPs(): any[] {
  try {
    initRSVPFile();
    const data = fs.readFileSync(RSVP_FILE, "utf8");
    return JSON.parse(data || "[]");
  } catch (err) {
    console.error("Failed to read rsvps.json:", err);
    return [];
  }
}

// Helper to write RSVPs
function writeRSVPs(rsvps: any[]) {
  try {
    fs.writeFileSync(RSVP_FILE, JSON.stringify(rsvps, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write rsvps.json:", err);
  }
}

// Simple text cleaner for case-insensitive and tolerance checks
function cleanString(str: string): string {
  if (!str) return "";
  // Strip common abbreviations/titles (like Hon, Doc, Engr, Boss, Judge)
  let clean = str.toLowerCase();
  clean = clean.replace(/\b(hon\.|hon|doc\.|doc|engr\.|engr|judge\.|judge|boss|sp04\.|sp04|pems\.|pems|lt\.|capt\.)\b/g, "");
  // Replace multiple spaces/non-alphanumeric with simple spaces
  clean = clean.replace(/[^a-z0-9]/g, " ");
  clean = clean.replace(/\s+/g, " ").trim();
  return clean;
}

// Compare names with high tolerance for typos, abbreviation differences, and word ordering
function matchNames(nameA: string, nameB: string): boolean {
  const cleanA = cleanString(nameA);
  const cleanB = cleanString(nameB);
  if (!cleanA || !cleanB) return false;
  
  // 1. Direct match
  if (cleanA === cleanB) return true;
  
  // 2. Substring containment
  if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) {
    const shorter = cleanA.length < cleanB.length ? cleanA : cleanB;
    const words = shorter.split(" ").filter(w => w.length > 1);
    if (words.length >= 2 || shorter.length >= 5) {
      return true;
    }
  }
  
  // 3. Word overlap (for out-of-order names, e.g. "Tugay Sam Ashly" vs "Sam Ashly Tugay")
  const wordsA = cleanA.split(" ").filter(w => w.length > 2);
  const wordsB = cleanB.split(" ").filter(w => w.length > 2);
  if (wordsA.length >= 2 && wordsB.length >= 2) {
    let matches = 0;
    for (const w of wordsA) {
      if (wordsB.includes(w)) {
        matches++;
      }
    }
    if (matches >= 2) {
      return true;
    }
  }
  
  return false;
}

interface OfflineGuest {
  name: string;
  allowedPlusOne: boolean;
}

// Dynamically compile a fully flattened invited guest list from the wedding details
function getOfflineGuests(): OfflineGuest[] {
  const guests: OfflineGuest[] = [];
  
  // Couple themselves
  guests.push({ name: "Sam Ashly", allowedPlusOne: true });
  guests.push({ name: "Sam Ashly Tugay", allowedPlusOne: true });
  guests.push({ name: "Jhon Chineth", allowedPlusOne: true });
  guests.push({ name: "Jhon Chineth Nacuspag", allowedPlusOne: true });
  
  // Parents
  if (WEDDING_DETAILS.parents) {
    if (Array.isArray(WEDDING_DETAILS.parents.bride)) {
      WEDDING_DETAILS.parents.bride.forEach(n => guests.push({ name: n, allowedPlusOne: true }));
    }
    if (Array.isArray(WEDDING_DETAILS.parents.groom)) {
      WEDDING_DETAILS.parents.groom.forEach(n => guests.push({ name: n, allowedPlusOne: true }));
    }
  }

  // Maid of Honor / Best Man
  if (WEDDING_DETAILS.maidOfHonor) {
    guests.push({ name: WEDDING_DETAILS.maidOfHonor, allowedPlusOne: true });
  }
  if (WEDDING_DETAILS.bestMan) {
    guests.push({ name: WEDDING_DETAILS.bestMan, allowedPlusOne: true });
  }

  // Sponsors
  if (Array.isArray(WEDDING_DETAILS.sponsors)) {
    WEDDING_DETAILS.sponsors.forEach(p => {
      if (p.lady) guests.push({ name: p.lady, allowedPlusOne: true });
      if (p.gentleman) guests.push({ name: p.gentleman, allowedPlusOne: true });
    });
  }

  // Bridesmaids & Groomsmen
  if (Array.isArray(WEDDING_DETAILS.bridesmaidsGroomsmen)) {
    WEDDING_DETAILS.bridesmaidsGroomsmen.forEach(pair => {
      if (pair.brideSide) guests.push({ name: pair.brideSide, allowedPlusOne: true });
      if (pair.groomSide) guests.push({ name: pair.groomSide, allowedPlusOne: true });
    });
  }

  // Special Sponsors
  if (WEDDING_DETAILS.specialSponsors) {
    const spec = WEDDING_DETAILS.specialSponsors;
    if (Array.isArray(spec.cord)) {
      spec.cord.forEach(n => guests.push({ name: n, allowedPlusOne: true }));
    }
    if (Array.isArray(spec.veil)) {
      spec.veil.forEach(n => guests.push({ name: n, allowedPlusOne: true }));
    }
    if (Array.isArray(spec.candle)) {
      spec.candle.forEach(n => guests.push({ name: n, allowedPlusOne: true }));
    }
  }

  // Bearers
  if (WEDDING_DETAILS.bearers) {
    const b = WEDDING_DETAILS.bearers;
    if (b.ring) guests.push({ name: b.ring, allowedPlusOne: false });
    if (b.coin) guests.push({ name: b.coin, allowedPlusOne: false });
    if (b.bible) guests.push({ name: b.bible, allowedPlusOne: false });
    if (b.littleBride) guests.push({ name: b.littleBride, allowedPlusOne: false });
    if (b.littleGroom) guests.push({ name: b.littleGroom, allowedPlusOne: false });
  }

  // Flower Girls
  if (Array.isArray(WEDDING_DETAILS.flowerGirls)) {
    WEDDING_DETAILS.flowerGirls.forEach(n => guests.push({ name: n, allowedPlusOne: false }));
  }

  // Sign Bearers
  if (WEDDING_DETAILS.signBearers) {
    const sb = WEDDING_DETAILS.signBearers;
    if (Array.isArray(sb.bride)) {
      sb.bride.forEach(n => guests.push({ name: n, allowedPlusOne: false }));
    }
    if (Array.isArray(sb.groom)) {
      sb.groom.forEach(n => guests.push({ name: n, allowedPlusOne: false }));
    }
  }

  return guests;
}

// API: Get verified RSVPs (attending only) synced with Google Sheet
app.get("/api/rsvps", async (req, res) => {
  let list = readRSVPs();

  try {
    const webAppUrl = "https://script.google.com/macros/s/AKfycbwL5_x-u2IxiDNi6drinsUTNuRvDNoh3KKOhvHKa9lBIEsKVSLKwzMZJwBYwejbEgkLQQ/exec";
    const params = new URLSearchParams({ action: "list" });
    const response = await fetch(`${webAppUrl}?${params.toString()}`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        console.log(`Synced ${data.length} RSVPs from Google Sheet.`);
        const synchronizedList = data.map((item: any) => {
          const name = item.name || item.Name || "";
          const attending = item.attending === true || item.attending === "Yes" || item.Attending === "Yes" || item.Attending === true;
          const withPlusOne = item.withPlusOne === true || item.withPlusOne === "Yes" || item.allowedPlusOne === "Yes" || item.allowedPlusOne === true || !!(item.plusOneName || item.PlusOneName);
          const plusOneName = item.plusOneName || item.PlusOneName || "";
          const submittedAt = item.submittedAt || item.timestamp || item.Timestamp || new Date().toISOString();
          return {
            name,
            attending,
            withPlusOne,
            plusOneName,
            submittedAt
          };
        }).filter((item: any) => item.name);

        writeRSVPs(synchronizedList);
        list = synchronizedList;
      } else {
        console.log("Response from Google Sheet is not an array, using local cached RSVPs.");
      }
    } else {
      console.log(`Google Sheet Web App responded with code ${response.status}, using local cached RSVPs.`);
    }
  } catch (err: any) {
    console.warn("Failed to sync RSVPs from Google Sheet (falling back to locally cached RSVPs):", err.message);
  }

  const attending = list.filter((r) => r.attending === true || r.attending === "Yes");
  res.json(attending);
});

// API: Check a guest on the Google Sheet
app.get("/api/check-guest", async (req, res) => {
  const nameQuery = req.query.name as string;
  if (!nameQuery) {
    return res.status(400).json({ error: "Name query parameter is required." });
  }

  let foundInGoogle = false;
  let googleData: any = null;

  try {
    const webAppUrl = "https://script.google.com/macros/s/AKfycbwL5_x-u2IxiDNi6drinsUTNuRvDNoh3KKOhvHKa9lBIEsKVSLKwzMZJwBYwejbEgkLQQ/exec";
    const params = new URLSearchParams({ name: nameQuery.trim() });
    
    console.log(`Checking guest lookup via Apps Script: ${nameQuery}`);
    const response = await fetch(`${webAppUrl}?${params.toString()}`);
    if (response.ok) {
      googleData = await response.json();
      if (googleData && googleData.found) {
        foundInGoogle = true;
      }
    } else {
      console.warn(`Google Sheet Web App responded with non-200 status code: ${response.status}`);
    }
  } catch (err: any) {
    console.warn("Apps Script check failed, falling back to local and offline registry:", err.message);
  }

  // If found in Google Sheets, process and return the result
  if (foundInGoogle && googleData) {
    let guestName = nameQuery.trim();
    if (googleData.message && googleData.message.includes(" is on the list")) {
      const parts = googleData.message.split(" is on the list");
      if (parts[0] && parts[0].trim()) {
        guestName = parts[0].trim();
      }
    }

    if (guestName === guestName.toLowerCase() || guestName === guestName.toUpperCase()) {
      guestName = guestName
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    const rsvps = readRSVPs();
    const existingRSVP = rsvps.find((r) => matchNames(r.name, guestName));

    return res.json({
      found: true,
      guestName,
      allowedPlusOne: !!googleData.allowedPlusOne,
      alreadySubmitted: !!existingRSVP,
      existingRSVP: existingRSVP || null,
    });
  }

  // Double Check Offline Local Databases to prevent "Server check error" and rate-limiting lockouts:
  // 1. Search in the official pre-invited guest list in `weddingDetails.ts` using our smart matching logic
  try {
    const offlineGuests = getOfflineGuests();
    const matchedGuest = offlineGuests.find(g => matchNames(nameQuery, g.name));

    if (matchedGuest) {
      console.log(`Successful match in offline database for: ${matchedGuest.name}`);
      const rsvps = readRSVPs();
      const existingRSVP = rsvps.find((r) => matchNames(r.name, matchedGuest.name) || matchNames(r.name, nameQuery));

      return res.json({
        found: true,
        guestName: matchedGuest.name,
        allowedPlusOne: matchedGuest.allowedPlusOne,
        alreadySubmitted: !!existingRSVP,
        existingRSVP: existingRSVP || null,
      });
    }

    // 2. Search in existing RSVPs in case they already RSVP'd
    const rsvps = readRSVPs();
    const existingRSVP = rsvps.find((r) => matchNames(r.name, nameQuery));
    if (existingRSVP) {
      console.log(`Successful match in local submitted RSVPs: ${existingRSVP.name}`);
      return res.json({
        found: true,
        guestName: existingRSVP.name,
        allowedPlusOne: !!existingRSVP.withPlusOne,
        alreadySubmitted: true,
        existingRSVP,
      });
    }
  } catch (localErr) {
    console.error("Local/Offline fallback match failure:", localErr);
  }

  // Safe and friendly "Not found" response mapping (resolves to standard 200 Not Found on the frontend rather than 500 Network error)
  return res.json({ found: false });
});

// API: Save or Update RSVP
app.post("/api/rsvp", async (req, res) => {
  const { name, attending, plusOneName, withPlusOne } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required for RSVP." });
  }

  const rsvps = readRSVPs();
  // Find or create
  const now = new Date().toISOString();
  const targetClean = cleanString(name);

  const index = rsvps.findIndex((r) => cleanString(r.name) === targetClean);

  const updatedRSVP = {
    name,
    attending: attending === true || attending === "Yes",
    withPlusOne: !!withPlusOne,
    plusOneName: withPlusOne ? plusOneName || "" : "",
    submittedAt: now,
  };

  if (index >= 0) {
    rsvps[index] = updatedRSVP;
  } else {
    rsvps.push(updatedRSVP);
  }

  writeRSVPs(rsvps);

  // Send to Google Apps Script Web App
  try {
    const webAppUrl = "https://script.google.com/macros/s/AKfycbwL5_x-u2IxiDNi6drinsUTNuRvDNoh3KKOhvHKa9lBIEsKVSLKwzMZJwBYwejbEgkLQQ/exec";
    
    const payload = {
      name: name,
      attending: (attending === true || attending === "Yes") ? "Yes" : "No",
      plusOneName: withPlusOne ? (plusOneName || "") : "",
      allowedPlusOne: withPlusOne ? "Yes" : "No",
      timestamp: now
    };

    const urlParams = new URLSearchParams({
      name: name,
      attending: (attending === true || attending === "Yes") ? "Yes" : "No",
      plusOneName: withPlusOne ? (plusOneName || "") : "",
      allowedPlusOne: withPlusOne ? "Yes" : "No",
      timestamp: now
    });

    const targetUrl = `${webAppUrl}?${urlParams.toString()}`;

    console.log("Forwarding RSVP to Google Sheets Web App via POST...", payload);
    
    let useGetFallback = false;
    try {
      const response = await fetch(webAppUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log(`POST to Apps Script returned status: ${response.status}`);
      
      // If doPost is not implemented/configured, it returns an HTML error page containing 'doPost'
      if (responseText.includes("doPost") || response.status !== 200) {
        console.warn("POST method is not supported (likely missing doPost). Opting for GET fallback...");
        useGetFallback = true;
      } else {
        console.log("RSVP forwarded successfully via POST.");
      }
    } catch (postErr: any) {
      console.warn("POST to Apps Script failed, attempting GET fallback:", postErr.message);
      useGetFallback = true;
    }

    if (useGetFallback) {
      console.log(`Forwarding RSVP via GET: ${targetUrl}`);
      const getResponse = await fetch(targetUrl, { method: "GET" });
      const getText = await getResponse.text();
      console.log(`GET fallback status: ${getResponse.status} response size: ${getText.length}`);
    }
  } catch (err) {
    console.error("Failed to forward RSVP to Google Apps Script:", err);
  }

  res.json({ success: true, rsvp: updatedRSVP });
});

// ADMIN API: Clear all RSVPs from cache
app.post("/api/admin/clear-rsvps", (req, res) => {
  const { pin } = req.body;
  // Allow July 18 wedding date PIN '0718' or default '1206'
  if (pin !== "0718" && pin !== "1206") {
    return res.status(401).json({ error: "Invalid host admin PIN." });
  }
  writeRSVPs([]);
  res.json({ success: true, message: "All RSVPs have been cleared from local list." });
});

// ADMIN API: Remove a single RSVP from cache
app.post("/api/admin/delete-rsvp", (req, res) => {
  const { name, pin } = req.body;
  if (pin !== "0718" && pin !== "1206") {
    return res.status(401).json({ error: "Invalid host admin PIN." });
  }
  if (!name) {
    return res.status(400).json({ error: "Name is required." });
  }
  const cleanTarget = cleanString(name);
  let list = readRSVPs();
  list = list.filter((item) => cleanString(item.name) !== cleanTarget);
  writeRSVPs(list);
  res.json({ success: true, message: `RSVP for ${name} removed.` });
});

// Start server
async function start() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
