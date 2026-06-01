# Security Specification for Wedding RSVPs

## 1. Data Invariants
- An RSVP must have a unique identifier representing the guest's name (slugified or exact).
- The RSVP fields `name`, `attending`, `withPlusOne`, `plusOneName`, and `submittedAt` are mandatory.
- `name` and `plusOneName` must be strings of size less than 200 characters to prevent denial-of-wallet payload attacks.
- Only safe alphanumeric characters and spaces are allowed as keys or identifiers.
- Deletions are forbidden on the client side.

## 2. The "Dirty Dozen" Payloads
Below are 12 malicious payloads designed to test rules against bypasses:
1. **Empty Payload**: Creating an empty document. (Expected: REJECTED)
2. **Missing SubmittedAt**: Schema bypass with missing timestamp. (Expected: REJECTED)
3. **Invalid Attending Type**: `attending` is set as a string instead of a boolean. (Expected: REJECTED)
4. **Extra/Shadow Fields**: Injecting `isAdmin: true` or `isVerified: true` into the RSVP. (Expected: REJECTED)
5. **Overlong Name**: Name exceeding 200 character limits to exhaust space. (Expected: REJECTED)
6. **Negative Size Keys**: Injecting garbage parameters. (Expected: REJECTED)
7. **Malicious ID injection**: Injecting special chars into the RSVP Document ID. (Expected: REJECTED)
8. **Malicious Client Deletion**: Attempting to delete an RSVP. (Expected: REJECTED)
9. **Malicious Client Batch Write**: Write with missing fields. (Expected: REJECTED)
10. **Malicious PlusOne Type**: `withPlusOne` set to string or number. (Expected: REJECTED)
11. **Malicious PlusOneName Type**: Companion name set to boolean. (Expected: REJECTED)
12. **Out of bounds string size**: Extremely long companion name. (Expected: REJECTED)

## 3. Test Runner Definition
Since we enforce server-authoritative API routing, server-side writes bypass standard client rules and are verified at the controller level. Standard clients are locked down.

---

# Draft Firestore Rules (`DRAFT_firestore.rules`)
To secure our data, we construct a strict, schema-validated ruleset.
