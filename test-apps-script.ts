import fetch from "node-fetch";

async function testRsvpStatusText() {
  const webAppUrl = "https://script.google.com/macros/s/AKfycbwL5_x-u2IxiDNi6drinsUTNuRvDNoh3KKOhvHKa9lBIEsKVSLKwzMZJwBYwejbEgkLQQ/exec";
  const name = "MARY ROSE IBARRA";

  console.log("--- 1. Querying before submission ---");
  let res = await fetch(`${webAppUrl}?name=${encodeURIComponent(name)}`);
  let data = await res.json();
  console.log("Response:", JSON.stringify(data));

  console.log("\n--- 2. Submitting RSVP ---");
  const urlParams = new URLSearchParams({
    name: name,
    attending: "Yes",
    plusOneName: "",
    allowedPlusOne: "No",
    timestamp: new Date().toISOString()
  });
  let submitRes = await fetch(`${webAppUrl}?${urlParams.toString()}`);
  let submitData = await submitRes.json();
  console.log("Response from RSVP write:", JSON.stringify(submitData));

  console.log("\n--- 3. Querying after submission ---");
  res = await fetch(`${webAppUrl}?name=${encodeURIComponent(name)}`);
  data = await res.json();
  console.log("Response:", JSON.stringify(data));
}

testRsvpStatusText();
