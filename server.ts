import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

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

  try {
    const webAppUrl = "https://script.google.com/macros/s/AKfycbwL5_x-u2IxiDNi6drinsUTNuRvDNoh3KKOhvHKa9lBIEsKVSLKwzMZJwBYwejbEgkLQQ/exec";
    const params = new URLSearchParams({ name: nameQuery.trim() });
    
    console.log(`Checking guest lookup via Apps Script: ${nameQuery}`);
    const response = await fetch(`${webAppUrl}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch from Google Apps Script: ${response.statusText}`);
    }

    const data = await response.json() as { found: boolean; allowedPlusOne: boolean; message?: string };
    
    if (!data.found) {
      return res.json({ found: false });
    }

    // Capture or build guest name
    let guestName = nameQuery.trim();
    // Try to extract capitalized guest name from message (if message has it before ' is on the list')
    if (data.message && data.message.includes(" is on the list")) {
      const parts = data.message.split(" is on the list");
      if (parts[0] && parts[0].trim()) {
        guestName = parts[0].trim();
      }
    }

    // Capitalize beautifully if it was typed in all-lowercase or all-caps
    if (guestName === guestName.toLowerCase() || guestName === guestName.toUpperCase()) {
      guestName = guestName
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    // Check if they've already RSVP'd
    const rsvps = readRSVPs();
    const existingRSVP = rsvps.find((r) => cleanString(r.name) === cleanString(guestName));

    res.json({
      found: true,
      guestName,
      allowedPlusOne: !!data.allowedPlusOne,
      alreadySubmitted: !!existingRSVP,
      existingRSVP: existingRSVP || null,
    });
  } catch (err: any) {
    console.error("Error checking guest via Apps Script:", err);
    // As a robust fallback, check local RSVP database in case spreadsheet connection fails or is offline
    try {
      const rsvps = readRSVPs();
      const existingRSVP = rsvps.find((r) => cleanString(r.name) === cleanString(nameQuery));
      if (existingRSVP) {
        return res.json({
          found: true,
          guestName: existingRSVP.name,
          allowedPlusOne: !!existingRSVP.withPlusOne,
          alreadySubmitted: true,
          existingRSVP,
        });
      }
    } catch (localErr) {
      console.error("Local fallback match failure:", localErr);
    }
    res.status(500).json({ error: "Failed to process guest lookup." });
  }
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
