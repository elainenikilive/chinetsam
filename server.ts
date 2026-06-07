import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { WEDDING_DETAILS } from "./src/data/weddingDetails";
import { collection, doc, getDocs, setDoc, deleteDoc, writeBatch, getDocFromServer } from "firebase/firestore";
import { db, OperationType, handleFirestoreError } from "./src/lib/firebase";

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

// Test Firebase connection on boot
async function testFirebaseConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firestore connection test: SUCCESS");
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration.");
    } else {
      console.log("Firestore connection test: PASSED (ignored or expected rules warning)");
    }
  }
}
testFirebaseConnection();

// FIRESTORE OPERATIONS

// Get all RSVPs from Firestore
async function getFirestoreRSVPs(): Promise<any[]> {
  try {
    const rsvpsColl = collection(db, "rsvps");
    const snapshot = await getDocs(rsvpsColl);
    const rsvps: any[] = [];
    snapshot.forEach((doc) => {
      rsvps.push(doc.data());
    });
    return rsvps;
  } catch (error: any) {
    console.warn("getFirestoreRSVPs failed (using offline cached file):", error?.message || error);
    return [];
  }
}

// Save RSVP to Firestore
async function saveFirestoreRSVP(rsvp: {
  name: string;
  attending: boolean;
  withPlusOne: boolean;
  plusOneName: string;
  submittedAt: string;
}) {
  try {
    const docRef = doc(db, "rsvps", rsvp.name);
    await setDoc(docRef, rsvp);
  } catch (error: any) {
    console.warn(`saveFirestoreRSVP failed for ${rsvp.name}:`, error?.message || error);
  }
}

// Delete RSVP from Firestore
async function deleteFirestoreRSVP(name: string) {
  try {
    const docRef = doc(db, "rsvps", name);
    await deleteDoc(docRef);
  } catch (error: any) {
    console.warn(`deleteFirestoreRSVP failed for ${name}:`, error?.message || error);
  }
}

// Clear all RSVPs from Firestore
async function clearAllFirestoreRSVPs() {
  try {
    const rsvpsColl = collection(db, "rsvps");
    const snapshot = await getDocs(rsvpsColl);
    const batch = writeBatch(db);
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  } catch (error: any) {
    console.warn("clearAllFirestoreRSVPs failed:", error?.message || error);
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

// API: Serve client-side Firebase configuration properties
app.get("/api/firebase-config", (req, res) => {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      res.json(config);
    } else {
      res.status(404).json({ error: "Firebase config not found" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Get verified RSVPs (attending only) synced with Firestore and Google Sheet
const GOOGLE_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQtcoxDTCAB2q8SczwA73ugqocfyRVAJ5cUO3wQ6F6xRZqepBR8oAKLnFasJ5bBvwzj9fNpP82Ga3ar/pub?gid=0&single=true&output=csv";

interface ParsedSheetRow {
  name: string;
  rsvpStatus: string;
  plusOneName: string;
  allowedPlusOne: boolean;
}

async function fetchGuestsFromGoogleSheet(): Promise<ParsedSheetRow[]> {
  try {
    const response = await fetch(GOOGLE_CSV_URL);
    if (!response.ok) {
      throw new Error(`Google Sheet CSV returned status ${response.status}`);
    }
    const text = await response.text();
    const lines = text.split(/\r?\n/);
    if (lines.length <= 1) return [];

    const parsed: ParsedSheetRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Robust CSV line parser supporting quoted cells
      const parts: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          parts.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      parts.push(current.trim());

      const nameRaw = parts[0] ? parts[0].replace(/^"|"$/g, '').trim() : "";
      if (!nameRaw) continue;

      const rsvpStatus = parts[1] ? parts[1].replace(/^"|"$/g, '').trim() : "";
      const plusOneName = parts[2] ? parts[2].replace(/^"|"$/g, '').trim() : "";
      const allowedPlusOneRaw = parts[3] ? parts[3].replace(/^"|"$/g, '').trim() : "";
      const allowedPlusOne = allowedPlusOneRaw.toLowerCase() === "yes";

      parsed.push({
        name: nameRaw,
        rsvpStatus,
        plusOneName,
        allowedPlusOne
      });
    }
    return parsed;
  } catch (err: any) {
    console.error("fetchGuestsFromGoogleSheet failed:", err.message);
    return [];
  }
}

app.get("/api/rsvps", async (req, res) => {
  try {
    // 1. Fetch live checklist from the user's published Google Sheet CSV
    const sheetGuests = await fetchGuestsFromGoogleSheet();
    const sheetAttending: any[] = [];
    
    sheetGuests.forEach(g => {
      const statusLower = g.rsvpStatus.toLowerCase();
      const isAttending = statusLower === "attending" || statusLower === "yes" || statusLower === "confirmed";
      if (isAttending) {
        sheetAttending.push({
          name: g.name,
          attending: true,
          withPlusOne: g.allowedPlusOne && !!g.plusOneName,
          plusOneName: g.plusOneName || "",
          submittedAt: new Date().toISOString()
        });
      }
    });

    // 2. Fetch from Firestore RSVPs as persistent backup
    const firestoreRSVPs = await getFirestoreRSVPs();

    // Merge: Sheets is primary source, but include any newly added Firestore RSVPs
    const mergedList = [...sheetAttending];
    firestoreRSVPs.forEach(f => {
      const isAttending = f.attending === true || f.attending === "Yes";
      if (isAttending) {
        const alreadyInMerged = mergedList.some(m => matchNames(m.name, f.name));
        if (!alreadyInMerged) {
          mergedList.push({
            name: f.name,
            attending: true,
            withPlusOne: !!f.withPlusOne,
            plusOneName: f.plusOneName || "",
            submittedAt: f.submittedAt || new Date().toISOString()
          });
        }
      }
    });

    // Sync to local file cache
    writeRSVPs(mergedList);
    res.json(mergedList);
  } catch (err: any) {
    console.warn("Failed to retrieve synced RSVPs, using local fallback...", err?.message);
    const local = readRSVPs();
    res.json(local.filter(r => r.attending));
  }
});

// API: Check a guest on the Google Sheet
app.get("/api/check-guest", async (req, res) => {
  const nameQuery = req.query.name as string;
  if (!nameQuery) {
    return res.status(400).json({ error: "Name query parameter is required." });
  }

  try {
    console.log(`Checking guest lookup via published Sheet CSV: ${nameQuery}`);
    const sheetGuests = await fetchGuestsFromGoogleSheet();
    const matchedRow = sheetGuests.find(g => matchNames(nameQuery, g.name));

    if (matchedRow) {
      console.log(`Successful match in Google Sheet CSV: ${matchedRow.name}`);
      const rsvps = await getFirestoreRSVPs();
      const existingRSVP = rsvps.find(r => matchNames(r.name, matchedRow.name));

      const statusLower = matchedRow.rsvpStatus.toLowerCase();
      const isConfirmedOnSheet = statusLower === "attending" || statusLower === "declined" || statusLower === "yes" || statusLower === "no" || statusLower === "confirmed";

      // Reconstruct RSVP if confirmed in sheets but missing from local Firestore
      let resolvedRSVP = existingRSVP || null;
      if (!resolvedRSVP && isConfirmedOnSheet) {
        resolvedRSVP = {
          name: matchedRow.name,
          attending: statusLower === "attending" || statusLower === "yes" || statusLower === "confirmed",
          withPlusOne: matchedRow.allowedPlusOne && !!matchedRow.plusOneName,
          plusOneName: matchedRow.plusOneName || "",
          submittedAt: new Date().toISOString()
        };
      }

      return res.json({
        found: true,
        guestName: matchedRow.name, // Display the guest's full name exactly as stored in the sheet
        allowedPlusOne: matchedRow.allowedPlusOne, // Check if they are allowed to bring a person "Yes" (others "No" of course)
        alreadySubmitted: isConfirmedOnSheet || !!existingRSVP,
        existingRSVP: resolvedRSVP,
      });
    }
  } catch (err: any) {
    console.warn("Published Sheet CSV check failed, attempting registry fallback:", err.message);
  }

  // Backup fallback: check offline registry from weddingDetails.ts
  try {
    const offlineGuests = getOfflineGuests();
    const matchedGuest = offlineGuests.find(g => matchNames(nameQuery, g.name));

    if (matchedGuest) {
      console.log(`Successful match in offline database for: ${matchedGuest.name}`);
      const rsvps = await getFirestoreRSVPs();
      const existingRSVP = rsvps.find(r => matchNames(r.name, matchedGuest.name) || matchNames(r.name, nameQuery));

      return res.json({
        found: true,
        guestName: matchedGuest.name,
        allowedPlusOne: matchedGuest.allowedPlusOne,
        alreadySubmitted: !!existingRSVP,
        existingRSVP: existingRSVP || null,
      });
    }

    // Direct firestore RSVP backup lookup
    const rsvps = await getFirestoreRSVPs();
    const existingRSVP = rsvps.find(r => matchNames(r.name, nameQuery));
    if (existingRSVP) {
      console.log(`Successful match in Firestore RSVPs: ${existingRSVP.name}`);
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

  return res.json({ found: false });
});

// API: Save or Update RSVP
app.post("/api/rsvp", async (req, res) => {
  const { name, attending, plusOneName, withPlusOne } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required for RSVP." });
  }

  let isAllowedToBring = false;
  try {
    const sheetGuests = await fetchGuestsFromGoogleSheet();
    const matchedRow = sheetGuests.find(g => matchNames(name, g.name));
    if (matchedRow) {
      isAllowedToBring = matchedRow.allowedPlusOne;
    } else {
      const offlineGuests = getOfflineGuests();
      const matchedOffline = offlineGuests.find(g => matchNames(name, g.name));
      if (matchedOffline) {
        isAllowedToBring = matchedOffline.allowedPlusOne;
      }
    }
  } catch (err: any) {
    console.error("Failed to verify allowedPlusOne during submit:", err.message);
  }

  // Enforce seating policies and plus-one rules
  const finalWithPlusOne = isAllowedToBring ? (!!withPlusOne) : false;
  const finalPlusOneName = finalWithPlusOne ? (plusOneName || "") : "";

  const now = new Date().toISOString();
  const updatedRSVP = {
    name,
    attending: attending === true || attending === "Yes",
    withPlusOne: finalWithPlusOne,
    plusOneName: finalPlusOneName,
    submittedAt: now,
  };

  // 1. Save to cloud Firestore database
  await saveFirestoreRSVP(updatedRSVP);

  // 2. Sync to local rsvps.json cache
  const rsvps = readRSVPs();
  const targetClean = cleanString(name);
  const index = rsvps.findIndex((r) => cleanString(r.name) === targetClean);
  if (index >= 0) {
    rsvps[index] = updatedRSVP;
  } else {
    rsvps.push(updatedRSVP);
  }
  writeRSVPs(rsvps);

  // 3. Send update to Apps Script Web App
  try {
    const webAppUrl = "https://script.google.com/macros/s/AKfycby1OLKgaKexZwzeN7SJzJWcycP1_yQoWM6LY9QeLuE6JHZVc9pLq_WUS5JbOeFMHVKz6A/exec";
    
    // Core requirements:
    // - Attending maps to "attending"
    // - Declined/Not attending maps to "No"
    // - Plus-One Name contains companion name if allowed and bringing, otherwise empty string ""
    const statusVal = (attending === true || attending === "Yes") ? "attending" : "No";
    const companionVal = finalWithPlusOne ? (finalPlusOneName || "") : "";

    const payload = {
      name: name,
      attending: statusVal,
      rsvpStatus: statusVal,
      "RSVP Status": statusVal,
      plusOneName: companionVal,
      "Plus One Name": companionVal,
      allowedPlusOne: isAllowedToBring ? "Yes" : "No",
      "Allowed Plus One?": isAllowedToBring ? "Yes" : "No",
      timestamp: now
    };

    const urlParams = new URLSearchParams({
      name: name,
      attending: statusVal,
      rsvpStatus: statusVal,
      "RSVP Status": statusVal,
      plusOneName: companionVal,
      "Plus One Name": companionVal,
      allowedPlusOne: isAllowedToBring ? "Yes" : "No",
      "Allowed Plus One?": isAllowedToBring ? "Yes" : "No",
      timestamp: now
    });

    const targetUrl = `${webAppUrl}?${urlParams.toString()}`;

    console.log("Forwarding RSVP to Google Sheets Web App...", payload);
    
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
      
      if (responseText.includes("doPost") || response.status !== 200) {
        console.warn("POST method is not supported or missing doPost. Trying GET fallback...");
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

// ADMIN API: Clear all RSVPs from cache & Firestore
app.post("/api/admin/clear-rsvps", async (req, res) => {
  const { pin } = req.body;
  if (pin !== "0718" && pin !== "1206") {
    return res.status(401).json({ error: "Invalid host admin PIN." });
  }
  await clearAllFirestoreRSVPs();
  writeRSVPs([]);
  res.json({ success: true, message: "All RSVPs have been cleared." });
});

// ADMIN API: Remove a single RSVP from cache & Firestore
app.post("/api/admin/delete-rsvp", async (req, res) => {
  const { name, pin } = req.body;
  if (pin !== "0718" && pin !== "1206") {
    return res.status(401).json({ error: "Invalid host admin PIN." });
  }
  if (!name) {
    return res.status(400).json({ error: "Name is required." });
  }
  await deleteFirestoreRSVP(name);
  
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
