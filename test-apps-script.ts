import fetch from "node-fetch";

async function testSpecialGetParams() {
  const webAppUrl = "https://script.google.com/macros/s/AKfycbwL5_x-u2IxiDNi6drinsUTNuRvDNoh3KKOhvHKa9lBIEsKVSLKwzMZJwBYwejbEgkLQQ/exec";

  const queries = [
    "?name=all",
    "?name=list",
    "?name=*",
    "?name=ANYTHING&action=list",
    "?name=all&action=list"
  ];

  for (const q of queries) {
    console.log(`\n--- Test GET with query: "${q}" ---`);
    try {
      const res = await fetch(webAppUrl + q);
      const text = await res.text();
      console.log(`Result:`, text.substring(0, 300));
    } catch (err: any) {
      console.error(`Error:`, err.message);
    }
  }
}

testSpecialGetParams();










