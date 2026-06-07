import React, { useState, useEffect, useRef } from "react";
import { 
  Heart, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  ChevronRight, 
  X, 
  Check, 
  Search, 
  AlertCircle, 
  Image as ImageIcon, 
  Music, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ThumbsUp, 
  TrendingUp, 
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Settings,
  ArrowLeft
} from "lucide-react";
import { WEDDING_DETAILS } from "./data/weddingDetails";
import { RSVPData, GuestCheckResponse } from "./types";

interface OfflineGuestLocal {
  name: string;
  allowedPlusOne: boolean;
}

function cleanStringLocal(str: string): string {
  if (!str) return "";
  let clean = str.toLowerCase();
  clean = clean.replace(/\b(hon\.|hon|doc\.|doc|engr\.|engr|judge\.|judge|boss|sp04\.|sp04|pems\.|pems|lt\.|capt\.)\b/g, "");
  clean = clean.replace(/[^a-z0-9]/g, " ");
  clean = clean.replace(/\s+/g, " ").trim();
  return clean;
}

function matchNamesLocal(nameA: string, nameB: string): boolean {
  const cleanA = cleanStringLocal(nameA);
  const cleanB = cleanStringLocal(nameB);
  if (!cleanA || !cleanB) return false;
  if (cleanA === cleanB) return true;
  if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) {
    const shorter = cleanA.length < cleanB.length ? cleanA : cleanB;
    const words = shorter.split(" ").filter(w => w.length > 1);
    if (words.length >= 2 || shorter.length >= 5) {
      return true;
    }
  }
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

function getOfflineGuestsLocal(): OfflineGuestLocal[] {
  const guests: OfflineGuestLocal[] = [];
  guests.push({ name: "Sam Ashly", allowedPlusOne: true });
  guests.push({ name: "Sam Ashly Tugay", allowedPlusOne: true });
  guests.push({ name: "Jhon Chineth", allowedPlusOne: true });
  guests.push({ name: "Jhon Chineth Nacuspag", allowedPlusOne: true });
  
  if (WEDDING_DETAILS.parents) {
    if (Array.isArray(WEDDING_DETAILS.parents.bride)) {
      WEDDING_DETAILS.parents.bride.forEach(n => guests.push({ name: n, allowedPlusOne: true }));
    }
    if (Array.isArray(WEDDING_DETAILS.parents.groom)) {
      WEDDING_DETAILS.parents.groom.forEach(n => guests.push({ name: n, allowedPlusOne: true }));
    }
  }

  if (WEDDING_DETAILS.maidOfHonor) {
    guests.push({ name: WEDDING_DETAILS.maidOfHonor, allowedPlusOne: true });
  }
  if (WEDDING_DETAILS.bestMan) {
    guests.push({ name: WEDDING_DETAILS.bestMan, allowedPlusOne: true });
  }

  if (Array.isArray(WEDDING_DETAILS.sponsors)) {
    WEDDING_DETAILS.sponsors.forEach(p => {
      if (p.lady) guests.push({ name: p.lady, allowedPlusOne: true });
      if (p.gentleman) guests.push({ name: p.gentleman, allowedPlusOne: true });
    });
  }

  if (Array.isArray(WEDDING_DETAILS.bridesmaidsGroomsmen)) {
    WEDDING_DETAILS.bridesmaidsGroomsmen.forEach(pair => {
      if (pair.brideSide) guests.push({ name: pair.brideSide, allowedPlusOne: true });
      if (pair.groomSide) guests.push({ name: pair.groomSide, allowedPlusOne: true });
    });
  }

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

  if (WEDDING_DETAILS.bearers) {
    const b = WEDDING_DETAILS.bearers;
    if (b.ring) guests.push({ name: b.ring, allowedPlusOne: false });
    if (b.coin) guests.push({ name: b.coin, allowedPlusOne: false });
    if (b.bible) guests.push({ name: b.bible, allowedPlusOne: false });
    if (b.littleBride) guests.push({ name: b.littleBride, allowedPlusOne: false });
    if (b.littleGroom) guests.push({ name: b.littleGroom, allowedPlusOne: false });
  }

  if (Array.isArray(WEDDING_DETAILS.flowerGirls)) {
    WEDDING_DETAILS.flowerGirls.forEach(n => guests.push({ name: n, allowedPlusOne: false }));
  }

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

export default function App() {
  // Navigation & Envelope State
  const [isOpen, setIsOpen] = useState(false);
  const [isEnvelopePopped, setIsEnvelopePopped] = useState(false);

  // Audio control state
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // RSVP Process States
  const [isRSVPModalOpen, setIsRSVPModalOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<GuestCheckResponse | null>(null);
  const [rsvpError, setRsvpError] = useState("");
  
  // RSVP Decision States
  const [attendingResponse, setAttendingResponse] = useState<boolean | null>(null);
  const [withPlusOne, setWithPlusOne] = useState(false);
  const [plusOneName, setPlusOneName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRSVPPresence, setSubmittedRSVPPresence] = useState(false);

  // Attending Guests List State
  const [attendingGuests, setAttendingGuests] = useState<RSVPData[]>([]);
  const [isLoadingGuests, setIsLoadingGuests] = useState(true);

  // Host Admin States
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState("");
  const [adminPinError, setAdminPinError] = useState("");
  const [adminPinForVerify, setAdminPinForVerify] = useState("");

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOver: false
  });

  // Current active gallery photo
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Filter principal sponsors by search query
  const [sponsorFilter, setSponsorFilter] = useState("");

  // Initialize and load RSVPs
  useEffect(() => {
    fetchAttendingGuests();
    // Setup audio
    audioRef.current = new Audio("https://www.mfiles.co.uk/mp3-downloads/debussy-claire-de-lune.mp3"); // Beautiful acoustic piano instrumental (Debussy's Clair de Lune) for wedding
    audioRef.current.loop = true;
    audioRef.current.volume = 0.4;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Update audio state based on user choice
  const togglePlayMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.log("Audio play blocked", err));
      setIsPlaying(true);
    }
  };

  const fetchAttendingGuests = async () => {
    try {
      const res = await fetch("/api/rsvps");
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setAttendingGuests(data);
          return;
        }
      }
      throw new Error("Unable to fetch JSON from server");
    } catch (err) {
      console.warn("Failed to load attending list from server, trying direct Google Sheet fetch:", err);
      try {
        const webAppUrl = "https://script.google.com/macros/s/AKfycby1OLKgaKexZwzeN7SJzJWcycP1_yQoWM6LY9QeLuE6JHZVc9pLq_WUS5JbOeFMHVKz6A/exec";
        const resDirect = await fetch(`${webAppUrl}?action=list`);
        if (resDirect.ok) {
          const data = await resDirect.json();
          if (Array.isArray(data)) {
            const mappedList = data.map((item: any) => {
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
            }).filter((item: any) => item.name && item.attending);
            setAttendingGuests(mappedList);
            return;
          }
        }
      } catch (sheetsErr) {
        console.error("Direct Google Sheets fetch failed too:", sheetsErr);
      }

      try {
        const localRSVPsRaw = localStorage.getItem("wedding_rsvps") || "[]";
        const localRSVPs: RSVPData[] = JSON.parse(localRSVPsRaw);
        setAttendingGuests(localRSVPs.filter(r => r.attending));
      } catch (storageErr) {
        console.error("Failed to read from local storage:", storageErr);
      }
    } finally {
      setIsLoadingGuests(false);
    }
  };

  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPinInput === "0718" || adminPinInput === "1206") {
      setIsAdminAuthenticated(true);
      setAdminPinForVerify(adminPinInput);
      setIsAdminModalOpen(false);
      setAdminPinInput("");
      setAdminPinError("");
    } else {
      setAdminPinError("Invalid Admin Access PIN");
    }
  };

  const handleDeleteGuest = async (name: string) => {
    try {
      const response = await fetch("/api/admin/delete-rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, pin: adminPinForVerify })
      });
      if (response.ok) {
        fetchAttendingGuests();
      } else {
        console.warn("Failed to delete guest RSVP");
      }
    } catch (err) {
      console.error("Delete guest API failed", err);
    }
  };

  const handleClearAllGuests = async () => {
    if (!isConfirmingClear) {
      setIsConfirmingClear(true);
      setTimeout(() => setIsConfirmingClear(false), 5000); // reset after 5 seconds
      return;
    }
    
    try {
      const response = await fetch("/api/admin/clear-rsvps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: adminPinForVerify })
      });
      if (response.ok) {
        setIsConfirmingClear(false);
        fetchAttendingGuests();
      } else {
        console.warn("Failed to clear guests RSVP");
      }
    } catch (err) {
      console.error("Clear all guests API failed", err);
    }
  };

  // Countdown timer calculations
  useEffect(() => {
    const targetDate = new Date(WEDDING_DETAILS.countdownDate).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds, isOver: false });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle Envelope Open Action
  const handleOpenEnvelope = () => {
    setIsEnvelopePopped(true);
    // Auto trigger background music on click to respect browser autoplay policies
    setTimeout(() => {
      if (audioRef.current && !isPlaying) {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }, 300);
    
    // Animate transition to main screen
    setTimeout(() => {
      setIsOpen(true);
    }, 850);
  };

  // Handle Check Guest (RSVP part 1)
  const handleCheckGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchName.trim()) {
      setRsvpError("Please enter your full name.");
      return;
    }

    setIsChecking(true);
    setRsvpError("");
    setCheckResult(null);

    try {
      const res = await fetch(`/api/check-guest?name=${encodeURIComponent(searchName.trim())}`);
      if (!res.ok) throw new Error("Verification failed");
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Local fallback mode: static host output");
      }
      
      const data: GuestCheckResponse = await res.json();
      
      if (data.found && data.guestName) {
        setCheckResult(data);
        // Pre-fill fields if they have existing RSVP
        if (data.existingRSVP) {
          setAttendingResponse(data.existingRSVP.attending);
          setWithPlusOne(data.existingRSVP.withPlusOne);
          setPlusOneName(data.existingRSVP.plusOneName || "");
        } else {
          setAttendingResponse(true); // Default to yes
          setWithPlusOne(false);
          setPlusOneName("");
        }
      } else {
        // Fallback to local offline check even if server returned not found
        throw new Error("Guest not found on server list");
      }
    } catch (err) {
      console.warn("Server-side check failed or not found, attempting direct Google Sheet lookup...", err);
      
      try {
        const webAppUrl = "https://script.google.com/macros/s/AKfycby1OLKgaKexZwzeN7SJzJWcycP1_yQoWM6LY9QeLuE6JHZVc9pLq_WUS5JbOeFMHVKz6A/exec";
        const params = new URLSearchParams({ name: searchName.trim() });
        const resDirect = await fetch(`${webAppUrl}?${params.toString()}`);
        if (resDirect.ok) {
          const googleData = await resDirect.json();
          if (googleData && googleData.found) {
            let guestName = searchName.trim();
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

            const matchedInExisting = attendingGuests.find(r => matchNamesLocal(r.name, guestName) || matchNamesLocal(r.name, searchName.trim()));

            const sheetsAllowed = googleData.allowedPlusOne === true || googleData.allowedPlusOne === "Yes" || googleData.allowedPlusOne === "yes";
            const data: GuestCheckResponse = {
              found: true,
              guestName,
              allowedPlusOne: sheetsAllowed,
              alreadySubmitted: !!matchedInExisting,
              existingRSVP: matchedInExisting || null
            };

            setCheckResult(data);
            if (matchedInExisting) {
              setAttendingResponse(matchedInExisting.attending);
              setWithPlusOne(matchedInExisting.withPlusOne);
              setPlusOneName(matchedInExisting.plusOneName || "");
            } else {
              setAttendingResponse(true);
              setWithPlusOne(false);
              setPlusOneName("");
            }
            return;
          }
        }
      } catch (sheetsErr) {
        console.warn("Direct Google Sheet lookup failed:", sheetsErr);
      }

      console.log("Proceeding to local list match fallback...");
      const nameQuery = searchName.trim();
      const offlineGuests = getOfflineGuestsLocal();
      const matchedGuest = offlineGuests.find(g => matchNamesLocal(nameQuery, g.name));

      if (matchedGuest) {
        // Check if already in our retrieved RSVPs (or state list)
        const matchedInExisting = attendingGuests.find(r => matchNamesLocal(r.name, matchedGuest.name) || matchNamesLocal(r.name, nameQuery));
        
        const data: GuestCheckResponse = {
          found: true,
          guestName: matchedGuest.name,
          allowedPlusOne: matchedGuest.allowedPlusOne,
          alreadySubmitted: !!matchedInExisting,
          existingRSVP: matchedInExisting || null
        };
        
        setCheckResult(data);
        if (matchedInExisting) {
          setAttendingResponse(matchedInExisting.attending);
          setWithPlusOne(matchedInExisting.withPlusOne);
          setPlusOneName(matchedInExisting.plusOneName || "");
        } else {
          setAttendingResponse(true); // Default to yes
          setWithPlusOne(false);
          setPlusOneName("");
        }
      } else {
        // Double check directly against any existing RSVPs name matches
        const matchedInExisting = attendingGuests.find(r => matchNamesLocal(r.name, nameQuery));
        if (matchedInExisting) {
          const data: GuestCheckResponse = {
            found: true,
            guestName: matchedInExisting.name,
            allowedPlusOne: matchedInExisting.withPlusOne,
            alreadySubmitted: true,
            existingRSVP: matchedInExisting
          };
          setCheckResult(data);
          setAttendingResponse(matchedInExisting.attending);
          setWithPlusOne(matchedInExisting.withPlusOne);
          setPlusOneName(matchedInExisting.plusOneName || "");
        } else {
          setRsvpError("We couldn't find your name on our invitation guest list. Please make sure to print your full name exactly, or connect with the bride or groom.");
        }
      }
    } finally {
      setIsChecking(false);
    }
  };

  // Handle Submit RSVP (RSVP part 2)
  const handleSubmitRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkResult || !checkResult.guestName) return;
    if (attendingResponse === null) {
      setRsvpError("Please select if you will attend.");
      return;
    }
    if (withPlusOne && !plusOneName.trim()) {
      setRsvpError("Please enter your companion's name.");
      return;
    }

    setIsSubmitting(true);
    setRsvpError("");

    const rsvpObj = {
      name: checkResult.guestName,
      attending: attendingResponse === true,
      withPlusOne: withPlusOne,
      plusOneName: withPlusOne ? plusOneName.trim() : ""
    };

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rsvpObj)
      });

      if (!res.ok) throw new Error("RSVP failed");
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Local fallback mode: static host output");
      }
      
      // Save locally to localStorage as redundancy
      try {
        const localRSVPsRaw = localStorage.getItem("wedding_rsvps") || "[]";
        const localRSVPs: RSVPData[] = JSON.parse(localRSVPsRaw);
        const cleanTarget = cleanStringLocal(rsvpObj.name);
        const filtered = localRSVPs.filter(r => cleanStringLocal(r.name) !== cleanTarget);
        filtered.push({ ...rsvpObj, submittedAt: new Date().toISOString() });
        localStorage.setItem("wedding_rsvps", JSON.stringify(filtered, null, 2));
      } catch (storageErr) {
        console.warn("Storage warning:", storageErr);
      }

      setSubmittedRSVPPresence(true);
      fetchAttendingGuests(); // Refresh live RSVPs of those saying yes
    } catch (err) {
      console.warn("Server save RSVP failed, attempting direct Google Sheet API submit:", err);
      
      try {
        const webAppUrl = "https://script.google.com/macros/s/AKfycby1OLKgaKexZwzeN7SJzJWcycP1_yQoWM6LY9QeLuE6JHZVc9pLq_WUS5JbOeFMHVKz6A/exec";
        const now = new Date().toISOString();
        
        const clientStatusVal = rsvpObj.attending ? "attending" : "No";
        const clientCompanionVal = rsvpObj.withPlusOne ? rsvpObj.plusOneName : "";

        const urlParams = new URLSearchParams({
          name: rsvpObj.name,
          attending: clientStatusVal,
          rsvpStatus: clientStatusVal,
          "RSVP Status": clientStatusVal,
          plusOneName: clientCompanionVal,
          "Plus One Name": clientCompanionVal,
          allowedPlusOne: checkResult?.allowedPlusOne ? "Yes" : "No",
          "Allowed Plus One?": checkResult?.allowedPlusOne ? "Yes" : "No",
          timestamp: now
        });
        
        const resDirect = await fetch(`${webAppUrl}?${urlParams.toString()}`);
        if (!resDirect.ok) throw new Error("Direct webapp submission failed");
        
        // Save locally to localStorage in addition
        try {
          const localRSVPsRaw = localStorage.getItem("wedding_rsvps") || "[]";
          const localRSVPs: RSVPData[] = JSON.parse(localRSVPsRaw);
          const cleanTarget = cleanStringLocal(rsvpObj.name);
          const filtered = localRSVPs.filter(r => cleanStringLocal(r.name) !== cleanTarget);
          filtered.push({ ...rsvpObj, submittedAt: now });
          localStorage.setItem("wedding_rsvps", JSON.stringify(filtered, null, 2));
        } catch (lErr) {
          console.warn("Storage write warning:", lErr);
        }

        setSubmittedRSVPPresence(true);
        fetchAttendingGuests(); // Reload to refresh list
        return;
      } catch (directErr) {
        console.error("Direct sheet RSVP save failed too:", directErr);
      }

      const now = new Date().toISOString();
      const fallbackRSVP: RSVPData = {
        name: rsvpObj.name,
        attending: rsvpObj.attending,
        withPlusOne: rsvpObj.withPlusOne,
        plusOneName: rsvpObj.plusOneName,
        submittedAt: now
      };

      try {
        const localRSVPsRaw = localStorage.getItem("wedding_rsvps") || "[]";
        const localRSVPs: RSVPData[] = JSON.parse(localRSVPsRaw);
        const cleanName = cleanStringLocal(fallbackRSVP.name);
        const filtered = localRSVPs.filter(r => cleanStringLocal(r.name) !== cleanName);
        filtered.push(fallbackRSVP);
        localStorage.setItem("wedding_rsvps", JSON.stringify(filtered, null, 2));

        setAttendingGuests(prev => {
          const filteredState = prev.filter(r => cleanStringLocal(r.name) !== cleanName);
          return [fallbackRSVP, ...filteredState];
        });

        setSubmittedRSVPPresence(true);
      } catch (storageErr) {
        console.error("Local storage save failed:", storageErr);
        setRsvpError("Failed to save RSVP. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close and reset RSVP modal
  const handleCloseRSVP = () => {
    setIsRSVPModalOpen(false);
    setSearchName("");
    setCheckResult(null);
    setRsvpError("");
    setSubmittedRSVPPresence(false);
    setAttendingResponse(null);
    setWithPlusOne(false);
    setPlusOneName("");
    fetchAttendingGuests(); // Refresh list to catch the newly submitted RSVPs
  };

  // Filter Sponsors List dynamically
  const filteredSponsors = WEDDING_DETAILS.sponsors.filter(s => 
    s.lady.toLowerCase().includes(sponsorFilter.toLowerCase()) || 
    s.gentleman.toLowerCase().includes(sponsorFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen relative overflow-x-hidden flex flex-col justify-between font-sans selection:bg-pink-200">
      
      {/* Background elegant gradient setup matching color themes plus frosted effect */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-tr from-[#E1EDF7] via-[#FFF1F4] to-[#E9F1F9] opacity-90" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/40 via-[#FFD1DB]/20 to-[#C5D9EC]/20 opacity-80" />

      {/* Floating Ambient Music Controller - Available globally after entry */}
      {isOpen && (
        <button 
          onClick={togglePlayMusic}
          id="music-control-btn"
          className="fixed top-4 right-4 z-40 bg-white/70 backdrop-blur-md hover:bg-white/90 p-3 rounded-full border border-white/80 shadow-md text-slate-700 transition-all duration-300 flex items-center gap-2 group transform active:scale-95"
          title={isPlaying ? "Mute music" : "Play music"}
        >
          {isPlaying ? (
            <>
              <Volume2 className="w-5 h-5 text-pink-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-800 pr-1 max-w-0 overflow-hidden group-hover:max-w-24 transition-all duration-500 whitespace-nowrap">Mute Melodies</span>
            </>
          ) : (
            <>
              <VolumeX className="w-5 h-5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 pr-1 max-w-0 overflow-hidden group-hover:max-w-24 transition-all duration-500 whitespace-nowrap">Play music</span>
            </>
          )}
        </button>
      )}

      {/* ==================== 1. INTRO / ENVELOPE SECTION ==================== */}
      {!isOpen && (
        <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 transition-all duration-1000 ${isEnvelopePopped ? 'scale-105 opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="absolute inset-0 bg-gradient-to-b from-[#FFF0F3] to-[#EAF2FA] opacity-95" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/30 via-transparent to-black/5" />
          
          <div className="relative z-10 text-center max-w-md w-full flex flex-col items-center">
            {/* Elegant invitation header with script font */}
            <h2 id="intro-title" className="text-5xl md:text-6xl text-[#E87390] font-script mb-3 drop-shadow-sm tracking-wide">
              {WEDDING_DETAILS.title}
            </h2>
            <p id="intro-subtitle" className="text-sm font-semibold tracking-widest text-[#567BA2] mb-12 select-none h-4">
              Jhon Chineth & Sam Ashly
            </p>

            {/* Interactive Custom Baby Pink Envelope */}
            <div 
              onClick={handleOpenEnvelope}
              id="interactive-envelope"
              className="relative w-72 h-44 sm:w-80 sm:h-48 md:w-96 md:h-56 bg-[#FFDAE3] rounded-xl shadow-[0_20px_50px_rgba(232,115,144,0.18)] border border-[#FFCCD6] cursor-pointer transform hover:scale-105 hover:-translate-y-1 transition-all duration-500 flex flex-col justify-end overflow-hidden group"
            >
              {/* Flap of the Envelope (Simulated Open State) */}
              <div 
                className="absolute top-0 left-0 right-0 h-1/2 bg-[#FFCCD6] origin-top transition-transform duration-700 ease-out z-20 shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
                style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
              />

              {/* Inside letter sliver */}
              <div className="absolute top-1/4 left-6 right-6 bottom-4 bg-white rounded-t-lg shadow-inner z-10 transition-transform duration-700 translate-y-2 group-hover:translate-y-[-10px] p-4 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="h-1 bg-slate-100 rounded w-1/3 mx-auto"></div>
                  <div className="h-1 bg-slate-100 rounded w-1/2 mx-auto"></div>
                </div>
                <div className="text-[11px] font-sans text-center text-slate-300 font-bold tracking-widest uppercase mb-1">
                  Read Invitation
                </div>
              </div>

              {/* Left and Right Envelope Corner overlays */}
              <div className="absolute bottom-0 left-0 w-1/2 h-full bg-[#FFDAE3] border-r border-[#FFCCD6]/10 z-20" style={{ clipPath: "polygon(0 0, 0 100%, 100% 100%)" }} />
              <div className="absolute bottom-0 right-0 w-1/2 h-full bg-[#FFDAE3] border-l border-[#FFCCD6]/10 z-20" style={{ clipPath: "polygon(100% 0, 0 100%, 100% 100%)" }} />

              {/* Wax Seal - Absolute Core Centerpiece */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-300 group-hover:scale-110">
                <div className="w-16 h-16 sm:w-18 sm:h-18 bg-[#DE5B7B] rounded-full border-4 border-white shadow-xl flex items-center justify-center relative transform rotate-12 transition-all duration-500 hover:rotate-0">
                  {/* Outer Seal Ruffled Wax effect */}
                  <div className="absolute inset-1 rounded-full border border-pink-400/50 opacity-40"></div>
                  <div className="absolute -inset-1 rounded-full bg-[#DE5B7B] border-t-2 border-l-2 border-white/20 -z-10 rounded-br-2xl"></div>
                  
                  {/* Wax Stamp monogram initials J&S on theme */}
                  <span className="text-xl sm:text-2xl font-serif font-black tracking-tighter text-white drop-shadow-md select-none">
                    J&S
                  </span>
                </div>
              </div>

              {/* Click instruction banner overlay at the bottom margin */}
              <div className="absolute bottom-3 left-0 right-0 text-center z-30">
                <p className="text-[9px] text-[#A64B62] font-bold uppercase tracking-[0.25em] animate-pulse">
                  Click to Seal Open
                </p>
              </div>
            </div>

            {/* Instruction standard instruction fonts below */}
            <p id="click-to-open-instruction" className="mt-12 text-sm tracking-widest text-[#567BA2] font-sans uppercase animate-bounce">
              Please click to open
            </p>
          </div>
        </div>
      )}

      {/* ==================== 2. MAIN WEDDING APPLICATION ==================== */}
      <div className={`transition-all duration-1000 flex-1 flex flex-col justify-between ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 pointer-events-none'}`}>
        
        {/* ==================================================================== */}
        {/* TOP BANNER / INVITED GREETINGS CARD */}
        {/* ==================================================================== */}
        <header className="relative w-full max-w-5xl mx-auto px-4 pt-16 pb-8 text-center">
          <div className="relative bg-white/90 backdrop-blur-lg border border-white/80 rounded-3xl p-8 md:p-12 shadow-[0_15px_30px_rgba(197,217,236,0.25)] flex flex-col items-center overflow-hidden">
            {/* Background image overlay with toned down opacity */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none"
              style={{ backgroundImage: "url('https://i.imgur.com/Mgvm3NF.jpg')" }}
            />
            
            <div className="relative inline-flex items-center justify-center gap-2 px-4 py-1.5 bg-pink-100/60 rounded-full border border-pink-200/50 text-[#D95B72] text-[11px] font-bold uppercase tracking-widest mb-6 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" /> Save The Date
            </div>
            
            <p className="font-sans text-xs tracking-[0.25em] uppercase text-[#678BBA] font-semibold mb-3">
              {WEDDING_DETAILS.title}
            </p>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-script text-[#DE5B7B] tracking-wide my-4 leading-tight">
              {WEDDING_DETAILS.names}
            </h1>
            
            <p className="text-slate-500 font-sans max-w-lg text-sm leading-relaxed mt-2">
              Together with our families, we invite you to celebrate a garden chic marriage of love, devotion, and new beginnings.
            </p>

            <span className="w-16 h-0.5 bg-gradient-to-r from-pink-200 via-pink-400 to-blue-200 rounded-full my-6"></span>

            {/* Crucial Info Band: Date, Start, Location in DM Sans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl text-slate-800 text-sm font-sans divide-y md:divide-y-0 md:divide-x divide-[#FFD1DB]/50">
              
              <div className="flex flex-col items-center pt-4 md:pt-0">
                <div className="bg-[#FFF1F4] p-3 rounded-full mb-2">
                  <Calendar className="w-5 h-5 text-pink-500" />
                </div>
                <span className="font-bold text-[#DE5B7B] uppercase tracking-wide">
                  {WEDDING_DETAILS.dateText}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Saturday Afternoon</span>
              </div>
              
              <div className="flex flex-col items-center pt-4 md:pt-0">
                <div className="bg-[#E7F2FC] p-3 rounded-full mb-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <span className="font-bold text-[#567BA2] uppercase tracking-wide">
                  {WEDDING_DETAILS.timeText}
                </span>
                <span className="text-[11px] text-slate-400 font-medium font-mono">UTC +8 Standard</span>
              </div>
              
              <div className="flex flex-col items-center pt-4 md:pt-0">
                <div className="bg-[#FFF1F4] p-3 rounded-full mb-2">
                  <MapPin className="w-5 h-5 text-pink-500" />
                </div>
                <span className="font-bold text-[#DE5B7B] uppercase tracking-wide">
                  {WEDDING_DETAILS.locationText}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Blessing Liturgical Rite</span>
              </div>

            </div>
          </div>
        </header>

        {/* ==================================================================== */}
        {/* COUNTDOWN TIMER COMPONENT (Live display) */}
        {/* ==================================================================== */}
        <section className="w-full max-w-3xl mx-auto px-4 py-6" id="countdown-section">
          <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl p-6 shadow-md text-center">
            <h3 className="text-xs uppercase tracking-[0.2em] text-[#567BA2] font-semibold mb-4 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 inline-block"></span>
              Countdown to the vows
              <span className="w-1.5 h-1.5 rounded-full bg-blue-300 inline-block"></span>
            </h3>
            
            <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-pink-100 shadow-sm flex flex-col justify-center">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#DE5B7B] font-sans">
                  {timeLeft.days}
                </span>
                <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Days</span>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-blue-100 shadow-sm flex flex-col justify-center">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#567BA2] font-sans">
                  {timeLeft.hours}
                </span>
                <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Hours</span>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-pink-100 shadow-sm flex flex-col justify-center">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#DE5B7B] font-sans">
                  {timeLeft.minutes}
                </span>
                <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Mins</span>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-blue-100 shadow-sm flex flex-col justify-center">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#567BA2] font-sans">
                  {timeLeft.seconds}
                </span>
                <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Secs</span>
              </div>
            </div>
            {timeLeft.isOver && (
              <p className="mt-3 text-sm text-[#FF859F] font-bold animate-pulse">
                The Wedding Day is Here! 🎉
              </p>
            )}
          </div>
        </section>

        {/* ==================================================================== */}
        {/* WEDDING BENTO GRID GALLERY (Using beautiful layout with raw imgur) */}
        {/* ==================================================================== */}
        <section className="w-full max-w-5xl mx-auto px-4 py-8">
          <div className="bg-white/50 backdrop-blur-lg border border-white/60 rounded-3xl p-6 md:p-8 shadow-[0_15px_30px_rgba(255,209,219,0.15)] flex flex-col">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-6">
              <div>
                <h3 className="text-xs tracking-[0.25em] text-[#567BA2] uppercase font-bold mb-1">
                  Wedding Lookbook
                </h3>
                <h2 className="text-3xl font-script text-[#DE5B7B] tracking-wide">
                  Captured Memories & Romance
                </h2>
              </div>
              <p className="text-[11px] text-slate-400 max-w-xs mt-2 md:mt-0 italic leading-relaxed">
                A glimpse of our journey together, surrounded by the blooming tranquility of our garden chic style.
              </p>
            </div>

            {/* Dynamic Interactive Gallery Board */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Highlight Big Gallery Frame */}
              <div className="md:col-span-8 bg-white/80 p-3 rounded-2xl border border-pink-100 shadow-sm flex flex-col">
                <div className="aspect-[4/3] w-full rounded-xl overflow-hidden relative group">
                  <img 
                    src={WEDDING_DETAILS.photos[activePhotoIdx]} 
                    alt={`Wedding Photo ${activePhotoIdx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                      // Fallback nicely if imgur link fails
                      const img = e.currentTarget;
                      img.src = `https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex items-end p-4">
                    <span className="text-white text-xs font-semibold uppercase tracking-wider backdrop-blur-md bg-black/30 px-3 py-1 rounded-full">
                      Photo {activePhotoIdx + 1} of 18
                    </span>
                  </div>
                </div>
              </div>

              {/* Smaller thumb strip side gallery */}
              <div className="md:col-span-4 flex flex-col justify-between gap-4 h-full">
                <div className="bg-white/80 p-4 rounded-2xl border border-slate-100 flex-1 flex flex-col justify-center">
                  <h4 className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-2">
                    Click to view details
                  </h4>
                  <div className="grid grid-cols-4 gap-2 h-44 overflow-y-auto pr-1">
                    {WEDDING_DETAILS.photos.map((photo, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePhotoIdx(idx)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all duration-300 relative ${activePhotoIdx === idx ? 'border-[#DE5B7B] scale-95 shadow-inner' : 'border-white/50 hover:border-pink-300'}`}
                      >
                        <img 
                          src={photo} 
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const img = e.currentTarget;
                            img.src = "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=30&w=150";
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-pink-50/40 backdrop-blur-sm p-4 rounded-2xl border border-pink-100 flex flex-col text-center">
                  <p className="text-xs font-semibold text-[#DE5B7B] uppercase tracking-wider mb-1">
                    Garden Grace
                  </p>
                  <p className="text-[10px] text-slate-400 italic">
                    "Two hearts growing side by side, rooted in faith, blooming in grace."
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* ENTOURAGE SECTION (Clean beautiful listing of everything requested) */}
        {/* ==================================================================== */}
        <section className="w-full max-w-5xl mx-auto px-4 py-8" id="entourage-section">
          <div className="bg-white/60 backdrop-blur-lg border border-white/80 rounded-3xl p-6 md:p-12 shadow-[0_20px_40px_rgba(197,217,236,0.15)]">
            
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#567BA2] mb-1 inline-block">
                Honorary Wedding Party
              </span>
              <h2 className="text-5xl font-script text-[#DE5B7B] tracking-wide my-1">
                The Entourage
              </h2>
              <div className="w-12 h-1 bg-gradient-to-r from-pink-300 to-blue-300 mx-auto rounded-full mt-3"></div>
            </div>

            {/* A. Parents Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="bg-white/80 rounded-2xl p-6 border border-pink-100 shadow-sm transition-all duration-300 hover:shadow-md">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#DE5B7B] bg-pink-100/50 px-3 py-1 rounded-full mb-3 inline-block">
                  Parents of the Bride
                </span>
                <div className="space-y-2 mt-2">
                  {WEDDING_DETAILS.parents.bride.map((name, i) => (
                    <div key={i} className="text-base font-bold text-slate-800 uppercase tracking-wide">
                      {name}
                    </div>
                  ))}
                  <p className="text-xs text-slate-400 italic mt-1">Giving their beloved daughter's hand in marriage</p>
                </div>
              </div>

              <div className="bg-white/80 rounded-2xl p-6 border border-blue-100 shadow-sm transition-all duration-300 hover:shadow-md">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#567BA2] bg-blue-50/50 px-3 py-1 rounded-full mb-3 inline-block">
                  Parents of the Groom
                </span>
                <div className="space-y-2 mt-2">
                  {WEDDING_DETAILS.parents.groom.map((name, i) => (
                    <div key={i} className="text-base font-bold text-slate-800 uppercase tracking-wide">
                      {name}
                    </div>
                  ))}
                  <p className="text-xs text-slate-400 italic mt-1">Guiding and standing by their beloved son</p>
                </div>
              </div>
            </div>

            {/* B. Core Union: maidOfHonor, bestMan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="bg-gradient-to-br from-[#FFF8FA] to-white p-6 rounded-2xl border border-pink-200/50 shadow-sm text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#DE5B7B] block mb-1">
                    Maid of Honor
                  </span>
                  <span className="text-base font-extrabold text-slate-800 uppercase tracking-wide block">
                    {WEDDING_DETAILS.maidOfHonor}
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#F5FAFF] to-white p-6 rounded-2xl border border-blue-200/50 shadow-sm text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#567BA2] block mb-1">
                    Best Man
                  </span>
                  <span className="text-base font-extrabold text-[#567BA2] uppercase tracking-wide block">
                    {WEDDING_DETAILS.bestMan}
                  </span>
                </div>
              </div>
            </div>

            {/* C. Principal Sponsors Section (Huge custom layout scrolling option or bento list) */}
            <div className="mb-12 bg-white/50 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/60 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-pink-100">
                <div>
                  <h3 className="text-base font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    Principal Sponsors
                  </h3>
                  <p className="text-xs text-slate-400">Distinguished guides standing as guardians of our home</p>
                </div>
                <div className="relative max-w-xs w-full">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                    <Search className="w-4 h-4" />
                  </span>
                  <input 
                    type="text" 
                    placeholder="Search Sponsor..."
                    value={sponsorFilter}
                    onChange={(e) => setSponsorFilter(e.target.value)}
                    className="w-full text-xs pl-9 pr-4 py-2 border border-pink-200/60 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-pink-300 focus:border-pink-300"
                  />
                </div>
              </div>

              {/* Grid of Sponsors */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {filteredSponsors.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-xs text-slate-400">
                    No sponsor found with that name.
                  </div>
                ) : (
                  filteredSponsors.map((pair, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white/80 p-3 rounded-xl border border-pink-50 hover:bg-pink-50/20 text-[11px] leading-relaxed transition-all duration-200 flex flex-col gap-0.5"
                    >
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-300"></span>
                        <span className="font-semibold text-slate-700 uppercase">{pair.lady}</span>
                      </div>
                      <div className="flex items-center gap-1 pl-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>
                        <span className="text-slate-500 uppercase">{pair.gentleman}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="text-[10px] text-slate-400 text-center mt-3">
                Displaying {filteredSponsors.length} out of {WEDDING_DETAILS.sponsors.length} Sponsors pairs
              </div>
            </div>

            {/* D. Bridesmaids & Groomsmen Section */}
            <div className="mb-12 bg-white/50 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/60 shadow-sm">
              <h3 className="text-base font-bold uppercase tracking-wider text-slate-800 mb-2">
                Bridesmaids & Groomsmen
              </h3>
              <p className="text-xs text-slate-400 mb-6">Our cherished companions walking with us in harmony</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {WEDDING_DETAILS.bridesmaidsGroomsmen.map((pair, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/55 shadow-[0_2px_8px_rgba(197,217,236,0.12)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center text-center animate-fadeIn"
                  >
                    <div className="flex flex-row items-center justify-center gap-3 w-full font-sans py-1.5">
                      <span className="text-xs font-semibold text-slate-700 capitalize tracking-wide">
                        {pair.brideSide.toLowerCase()}
                      </span>
                      <span className="text-xs text-pink-400 font-bold">-</span>
                      <span className="text-xs font-semibold text-slate-600 capitalize tracking-wide">
                        {pair.groomSide.toLowerCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* E. Special Roles: CORD, VEIL, CANDLE */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              
              <div className="bg-white/85 p-5 rounded-2xl border border-pink-100 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-[#DE5B7B] uppercase block mb-1">Veil</span>
                  <p className="text-[11px] text-slate-400 leading-tight mb-4">To clothe humanity in oneness and purity</p>
                </div>
                <div className="space-y-1.5">
                  {WEDDING_DETAILS.specialSponsors.veil.map((name, i) => (
                    <div key={i} className="text-xs font-bold text-slate-700 uppercase">{name}</div>
                  ))}
                </div>
              </div>

              <div className="bg-white/85 p-5 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-[#567BA2] uppercase block mb-1">Cord</span>
                  <p className="text-[11px] text-slate-400 leading-tight mb-4">Symbolizing the union of two hearts eternally bound</p>
                </div>
                <div className="space-y-1.5">
                  {WEDDING_DETAILS.specialSponsors.cord.map((name, i) => (
                    <div key={i} className="text-xs font-bold text-slate-700 uppercase">{name}</div>
                  ))}
                </div>
              </div>

              <div className="bg-white/85 p-5 rounded-2xl border border-pink-100 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-[#DE5B7B] uppercase block mb-1">Candle</span>
                  <p className="text-[11px] text-slate-400 leading-tight mb-4">Invoking divine spark to light the path ahead</p>
                </div>
                <div className="space-y-1.5">
                  {WEDDING_DETAILS.specialSponsors.candle.map((name, i) => (
                    <div key={i} className="text-xs font-bold text-slate-700 uppercase">{name}</div>
                  ))}
                </div>
              </div>

            </div>

            {/* F. Bearers, Flower Girls, Signs, Little ones */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Box 1: Bearers & Little ones */}
              <div className="bg-white/60 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 block">Liturgical Officers</span>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block leading-none">Ring Bearer</span>
                    <strong className="text-slate-800 uppercase">{WEDDING_DETAILS.bearers.ring}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block leading-none">Coin Bearer</span>
                    <strong className="text-slate-800 uppercase">{WEDDING_DETAILS.bearers.coin}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block leading-none">Bible Bearer</span>
                    <strong className="text-slate-800 uppercase">{WEDDING_DETAILS.bearers.bible}</strong>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block">Little Bride</span>
                      <strong className="text-slate-800 uppercase text-[11px]">{WEDDING_DETAILS.bearers.littleBride}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block">Little Groom</span>
                      <strong className="text-slate-800 uppercase text-[11px]">{WEDDING_DETAILS.bearers.littleGroom}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 2: Flower Girls */}
              <div className="bg-white/60 p-5 rounded-2xl border border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 block">Flower Girls</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {WEDDING_DETAILS.flowerGirls.map((name, i) => (
                    <div key={i} className="flex items-center gap-1 bg-white/90 p-2 rounded-lg border border-pink-50">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-300"></span>
                      <span className="font-bold text-slate-700 uppercase text-[10px]">{name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box 3: Sign Bearers */}
              <div className="bg-white/60 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 block">Sign Bearers</span>
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] text-[#DE5B7B] uppercase block font-semibold">"Here Comes the Bride" Sign Bearers:</span>
                      <div className="mt-1 space-y-1">
                        {WEDDING_DETAILS.signBearers.bride.map((name, i) => (
                          <div key={i} className="font-bold text-slate-800 uppercase text-[11px]">{name}</div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#567BA2] uppercase block font-semibold">"Here Comes the Groom" Sign Bearer:</span>
                      <div className="mt-1">
                        {WEDDING_DETAILS.signBearers.groom.map((name, i) => (
                          <div key={i} className="font-bold text-slate-800 uppercase text-[11px]">{name}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ==================================================================== */}
        {/* DETAILS SECTION (Dress color palette circles, Rules, Notes) */}
        {/* ==================================================================== */}
        <section className="w-full max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white/60 backdrop-blur-lg border border-white/80 rounded-3xl p-8 shadow-[0_15px_30px_rgba(255,209,219,0.1)] grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Rules & Colors */}
            <div className="col-span-1 md:col-span-7 flex flex-col justify-center space-y-6">
              <div>
                <h3 className="text-xs uppercase tracking-[0.25em] text-[#567BA2] font-semibold mb-2">Event Etiquette</h3>
                <h2 className="text-3xl font-script text-[#DE5B7B] tracking-wide mb-3">Dress Code Guidelines</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  To capture our dream wedding's garden chic look, we request our beloved guests follow our themed color palette. Gentlemen may wear formal suits/barongs; Ladies may select pastel dresses according to our theme.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 bg-white/90 p-5 rounded-2xl border border-pink-50 shadow-sm w-full">
                
                {/* Color Visualizers */}
                <div className="flex gap-4">
                  <div className="text-center group">
                    <div 
                      className="w-12 h-12 rounded-full border-4 border-white shadow-md transform group-hover:scale-105 transition-all duration-300 flex items-center justify-center cursor-pointer" 
                      style={{ backgroundColor: WEDDING_DETAILS.palette.blue.hex }}
                      title={WEDDING_DETAILS.palette.blue.name}
                    >
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-1.5 block">
                      {WEDDING_DETAILS.palette.blue.name}
                    </span>
                  </div>

                  <div className="text-center group">
                    <div 
                      className="w-12 h-12 rounded-full border-4 border-white shadow-md transform group-hover:scale-105 transition-all duration-300 flex items-center justify-center cursor-pointer" 
                      style={{ backgroundColor: WEDDING_DETAILS.palette.pink.hex }}
                      title={WEDDING_DETAILS.palette.pink.name}
                    >
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-1.5 block">
                      {WEDDING_DETAILS.palette.pink.name}
                    </span>
                  </div>
                </div>

                <div className="h-0.5 sm:h-12 w-12 sm:w-0.5 bg-slate-100"></div>

                <div className="text-center sm:text-left space-y-1">
                  <div className="inline-block bg-red-50 text-[#D95B72] text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-red-100">
                    {WEDDING_DETAILS.dressCode.rule}
                  </div>
                  <p className="text-xs text-slate-600 uppercase font-black tracking-wider block">
                    Attire: {WEDDING_DETAILS.dressCode.attire}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">Strictly formal wear of color codes only.</p>
                </div>

              </div>
            </div>

            {/* Right Column: Inspiration Photo */}
            <div className="col-span-1 md:col-span-5 w-full flex justify-center">
              <div className="bg-white/95 p-3.5 rounded-2xl border border-pink-100 shadow-md max-w-[280px] w-full transform hover:rotate-1 hover:scale-[1.02] transition-all duration-500">
                <div className="overflow-hidden rounded-xl bg-slate-50 border border-slate-100 aspect-[4/5] relative">
                  <img 
                    src="https://i.imgur.com/LeLL5Gk.png" 
                    alt="Dress Code Inspiration" 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.src.endsWith('.jpg')) {
                        img.src = "https://i.imgur.com/LeLL5Gk.jpg";
                      }
                    }}
                  />
                </div>
                <div className="text-center mt-3 font-medium">
                  <span className="font-script text-2xl text-[#DE5B7B]">Style Guide</span>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">Recommended Attire</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ==================================================================== */}
        {/* RSVP FORM SECTION & POPUP (Fully persistent via Sheet / rsvps endpoint) */}
        {/* ==================================================================== */}
        <section className="w-full max-w-4xl mx-auto px-4 py-8 mb-16" id="rsvp-section">
          <div className="bg-gradient-to-br from-[#FFF5F7] to-[#F2FAFF] p-8 md:p-12 rounded-3xl border border-white/50 shadow-xl flex flex-col items-center text-center">
            
            <div className="inline-flex p-3 bg-pink-100/50 rounded-full mb-4">
              <Heart className="w-6 h-6 text-pink-500 animate-pulse" />
            </div>
            
            <h2 className="text-4xl font-script text-[#DE5B7B] mb-2">Be Our Guest</h2>
            <p className="text-slate-600 font-medium text-xs tracking-widest uppercase mb-4">R s v p</p>
            <p className="text-slate-500 max-w-sm text-xs md:text-sm leading-relaxed mb-6 italic">
              "We would be honored to have you celebrate with us."
            </p>

            {/* Click to display popup as requested */}
            <button 
              onClick={() => setIsRSVPModalOpen(true)}
              id="confirm-attendance-btn"
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-sans text-xs md:text-sm font-bold uppercase tracking-widest rounded-xl transition-all duration-300 shadow-[0_10px_25px_rgba(30,41,59,0.25)] hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 text-pink-300" /> Confirm Attendance
            </button>

            {/* LIVE FEED: Guests who said YES to the invitation as requested */}
            <div className="mt-12 w-full max-w-2xl bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/80 text-left">
              <div className="flex justify-between items-center mb-4 border-b border-pink-100/60 pb-2">
                <span className="text-[11px] font-bold text-[#567BA2] uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#DE5B7B]" /> Attending Guests Stream
                </span>
                <span className="px-2.5 py-0.5 bg-pink-100 text-[#DE5B7B] rounded-full text-[10px] font-bold font-mono">
                  {attendingGuests.length} Confirmed
                </span>
              </div>

              {isLoadingGuests ? (
                <p className="text-center text-xs text-slate-400 py-4 animate-pulse">Loading verified guests list...</p>
              ) : attendingGuests.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-4">Be the first to say Yes and secure your seats!</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1 cs-scroll">
                  {attendingGuests.map((guest, i) => (
                    <div key={i} className="bg-white p-2.5 rounded-lg border border-pink-50 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                        </span>
                        <span className="text-xs font-bold text-slate-700 uppercase truncate max-w-44" title={guest.name}>
                          {guest.name}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {guest.withPlusOne && guest.plusOneName && (
                          <span className="text-[8px] font-bold text-slate-400 uppercase bg-slate-50 px-1.5 py-0.5 rounded whitespace-nowrap" title={`Plus one: ${guest.plusOneName}`}>
                            + {guest.plusOneName}
                          </span>
                        )}
                        {isAdminAuthenticated && (
                          <button
                            onClick={() => handleDeleteGuest(guest.name)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors ml-1"
                            title={`Delete RSVP for ${guest.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Host admin tools row inside the stream card */}
              <div className="mt-4 pt-3 border-t border-slate-100/60 flex justify-between items-center">
                {isAdminAuthenticated ? (
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[9px] text-[#567BA2] font-semibold uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Host Admin Mode
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={handleClearAllGuests}
                        className={`text-[9px] font-bold px-2.5 py-1 rounded transition-all uppercase tracking-wider ${
                          isConfirmingClear 
                            ? "bg-red-500 text-white animate-pulse" 
                            : "text-red-500 border border-red-200 bg-red-50/50 hover:bg-red-50"
                        }`}
                      >
                        {isConfirmingClear ? "Confirm Clear" : "Clear All Stream"}
                      </button>
                      <button
                        onClick={() => setIsAdminAuthenticated(false)}
                        className="text-[9px] font-bold text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded transition-colors uppercase tracking-wider"
                      >
                        Exit Admin
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end w-full">
                    <button
                      onClick={() => setIsAdminModalOpen(true)}
                      className="text-[9px] font-bold text-slate-400 hover:text-[#567BA2] uppercase tracking-wider transition-all flex items-center gap-1"
                    >
                      <Settings className="w-3 h-3" /> Host Admin Portal
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>
        </section>

        {/* ==================================================================== */}
        {/* INTERACTIVE RSVP DIALOG POPUP / MODAL PANEL */}
        {/* ==================================================================== */}
        {isRSVPModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" id="rsvp-modal-overlay">
            {/* Dark fuzzy elegant backdrop */}
            <div 
              className="absolute inset-0 bg-slate-900/35 backdrop-blur-md relative"
              onClick={handleCloseRSVP}
            />

            <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-pink-100 max-w-4xl w-full p-4 md:p-6 shrink-0 overflow-hidden z-10 animate-scaleUp flex flex-col max-h-[95vh] md:max-h-[90vh]">
              
              {/* Header Close button */}
              <div className="flex items-center justify-between pb-3 border-b border-pink-100 mb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-pink-400 rounded-full animate-ping" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Wedding RSVP Portal</span>
                </div>
                <button 
                  onClick={handleCloseRSVP}
                  className="p-1.5 bg-slate-100/80 hover:bg-pink-100 text-slate-400 hover:text-[#DE5B7B] rounded-full transition-colors"
                  title="Close RSVP portal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Embedding the Apps Script Web App RSVP Iframe */}
              <div className="flex-1 w-full overflow-hidden bg-slate-50 rounded-xl relative border border-slate-100 min-h-[450px] md:min-h-[580px]">
                <iframe 
                  src="https://script.google.com/macros/s/AKfycby1OLKgaKexZwzeN7SJzJWcycP1_yQoWM6LY9QeLuE6JHZVc9pLq_WUS5JbOeFMHVKz6A/exec"
                  className="w-full h-full border-0"
                  title="Wedding RSVP Portal"
                  id="rsvp-iframe"
                />
              </div>

              {/* Footer row with back button */}
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
                <p className="text-[10px] text-slate-400 font-sans tracking-wide hidden sm:block">
                  Your response will update and reflect on the live attending list automatically.
                </p>
                <button
                  onClick={handleCloseRSVP}
                  className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(30,41,59,0.15)]"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-pink-300" /> Back to Invitation
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* HOST ADMIN ACCESS MODAL */}
        {/* ==================================================================== */}
        {isAdminModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsAdminModalOpen(false)} />
            <div className="relative bg-white/95 backdrop-blur-xl w-full max-w-sm rounded-2xl p-6 border border-pink-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden z-50 animate-scaleUp">
              <button 
                onClick={() => setIsAdminModalOpen(false)} 
                className="absolute top-4 right-4 p-1.5 hover:bg-pink-50 text-slate-400 hover:text-[#DE5B7B] rounded-full transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="text-center mb-5 mt-2">
                <div className="inline-flex p-2 bg-pink-50 text-[#DE5B7B] rounded-full mb-2">
                  <Settings className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wide">Host Admin Portal</h3>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                  Enter Wedding Date PIN to edit guest lists
                </p>
              </div>

              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 text-left">
                    Admin PIN (Wedding Date)
                  </label>
                  <input
                    type="password"
                    placeholder="Enter 4-digit PIN (e.g. July 18 = 0718)"
                    maxLength={4}
                    value={adminPinInput}
                    onChange={(e) => {
                      setAdminPinInput(e.target.value.replace(/\D/g, ""));
                      setAdminPinError("");
                    }}
                    className="w-full bg-slate-100 border border-slate-100 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 font-mono text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-[#DE5B7B] transition-all"
                    autoFocus
                  />
                  {adminPinError && (
                    <p className="text-[10px] text-red-500 font-bold mt-1 text-left flex items-center gap-1 animate-pulse">
                      <AlertCircle className="w-3.5 h-3.5" /> {adminPinError}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-sans text-xs font-bold uppercase tracking-widest transition-all duration-300 hover:scale-102 active:scale-98 shadow-md"
                  >
                    Unlock Guest Controls
                  </button>
                </div>
                
                <p className="text-[10px] text-slate-400 text-center leading-relaxed font-semibold uppercase">
                  Default PIN: <span className="font-bold text-pink-500">0718</span>
                </p>
              </form>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* FOOTER BRIDAL BRANDING NOTES */}
        {/* ==================================================================== */}
        <footer className="w-full py-12 px-4 text-center mt-auto border-t border-dashed border-[#FFD1DB]/50">
          <div className="max-w-md mx-auto">
            <h4 className="font-script text-3xl text-[#DE5B7B] tracking-wide mb-1 select-none">
              Jhon Chineth & Sam Ashly
            </h4>
            <p className="font-sans text-[10px] text-slate-400 capitalize tracking-widest font-semibold mb-2">
              Garden Chic Elegant Celebrations • July 18, 2026
            </p>
            <div className="flex justify-center items-center gap-2 text-[9px] text-[#567BA2] bg-white/70 backdrop-blur-md border border-white/80 py-1.5 px-3 rounded-full shadow-sm max-w-xs mx-auto">
              <span>Cathedral Church Liturgy</span>
              <span className="w-1 h-1 bg-pink-400 rounded-full"></span>
              <span>Off-White Prohibited</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
