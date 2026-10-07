// lib/__fixtures__/dutchieParsed.ts
//
// `GET /receipt/{sid}/parsed` bodies for two Dutchie text receipts, as the
// RDH backend produces them once the Dutchie extractor indexed the row.
//
// Generated, not hand-written: Papex_RDH_Backend feat/dutchie-receipt-extractor
// @ 6e7294f, fixtures lambdas/indexer/tests/fixtures/dutchie/
// {three-items-bundle-discount-cash-change,employee-discount-dutchie-pay}.bin
// -> lib/escpos.js parseEscPos -> lib/dutchieReceipt.js summarizeDutchie ->
// the row handler.js writes (rawText through redactStoredRawText) -> the
// deployed papex-rdh-fetch toReceipt() projection (2026-09-04 build).
//
// PII: the backend fixtures already carry overwritten customer and cashier
// ids, and rawText went through the indexer's redaction, so the customer line
// reads `Customer:: [redacted]`. The sid is a placeholder, never a real one:
// a real sid is the capability for the public raw-bytes endpoint.

/** 3 lines, qty 2 each; a "4 FOR $20" bundle discount on two of them; cash. */
export const DUTCHIE_PARSED_BUNDLE = {
  "sid": "0000000000000000",
  "parseStatus": "ok",
  "hasImage": false,
  "uploadedAt": "2026-10-07T00:00:00.000Z",
  "receipt": {
    "merchantName": "Union Cannabis Club",
    "merchantAddress": "2030 Union Street, San Francisco, CA 94123",
    "date": "10/6/2026 9:36:37 PM",
    "subtotal": 32.02,
    "tax": 7.98,
    "total": 40,
    "lineItems": [
      {
        "name": "SUNSET CONNECT - 1G - HYBRID - FULTON 5ER",
        "quantity": 2,
        "price": 12,
        "sku": null,
        "brand": null,
        "discount": -2
      },
      {
        "name": "SUNSET CONNECT - 1G - SATIVA - FULTON 5ER",
        "quantity": 2,
        "price": 12,
        "sku": null,
        "brand": null,
        "discount": -2
      },
      {
        "name": "ST IDES - TEA - HIGH PUNCH",
        "quantity": 2,
        "price": 20,
        "sku": null,
        "brand": null,
        "discount": null
      }
    ],
    "paymentMethod": "Cash",
    "cardBrand": null,
    "cardLast4": null,
    "receiptNumber": "140018833",
    "confidence": "medium",
    "extractorEngine": "rdh-dutchie-escpos",
    "rawText": "\nUnion Cannabis Club\n2030 Union Street\nSan Francisco, CA 94123\n\n10/6/2026 9:36:37 PM\nOrder: 140018833\nCashier: 10003\nRegister: Register 1\nCustomer:: [redacted]\n\n\n\nSUNSET CONNECT - 1G - HYBRID (1.00g)\n - FULTON 5ER\n1A406030001E1A5001848541\n  Category: Pre-Rolls\n  Batch: 1A406030001E1A5001848541\n  2 @ 6.00 ea                              12.00\n--ALL - 5ER 4 FOR $20                    -$1.00\n\nSUNSET CONNECT - 1G - SATIVA (1.00g)\n - FULTON 5ER\n1A406030001E1A5001876189\n  Category: Pre-Rolls\n  Batch: 1A406030001E1A5001876189\n  2 @ 6.00 ea                              12.00\n--ALL - 5ER 4 FOR $20                    -$1.00\n\nST IDES - TEA - HIGH PUNCH (.10g)\n1A4060300048D3D006585252\n  Category: Beverage\n  Batch: 1A4060300048D3D006585252\n  2 @ 10.00 ea                             20.00\n\n\n\n\nSubtotal: $36.02\nCA Sales 8.625%: $3.18\nCA Excise 15%: $4.80\nTotal Tax: $7.98\nTotal Discount: $4.00\n_________________________\nTotal: $40.00\n\nPayment (Cash): $50.00\n\nDue Customer: $10.00\n\nTotal Items: 6\nTotal Grams: 4.20\nStarting Allotment: 36.50g\nRemaining Allotment: 32.30g\n\n\nThank you for stopping by!\nPlease  review on\nYELP or GOOGLE\n\n\nALL SALES ARE FINAL\nDefective Cartridges may be returned or\nexchanged within 7 days with receipt.\nThank you!"
  }
};

/** 1 line with a 25% employee discount, paid by Dutchie Pay (+$0.26 bank fee). */
export const DUTCHIE_PARSED_FEE = {
  "sid": "0000000000000000",
  "parseStatus": "ok",
  "hasImage": false,
  "uploadedAt": "2026-10-07T00:00:00.000Z",
  "receipt": {
    "merchantName": "Union Cannabis Club",
    "merchantAddress": "2030 Union Street, San Francisco, CA 94123",
    "date": "10/6/2026 9:49:40 PM",
    "subtotal": 6,
    "tax": 1.5,
    "total": 7.76,
    "lineItems": [
      {
        "name": "ST IDES - TEA - LYCHEE PEAR",
        "quantity": 1,
        "price": 10,
        "sku": null,
        "brand": null,
        "discount": -2.5
      }
    ],
    "paymentMethod": "Dutchie Pay",
    "cardBrand": null,
    "cardLast4": null,
    "receiptNumber": "140018846",
    "confidence": "medium",
    "extractorEngine": "rdh-dutchie-escpos",
    "rawText": "\nUnion Cannabis Club\n2030 Union Street\nSan Francisco, CA 94123\n\n10/6/2026 9:49:40 PM\nOrder: 140018846\nCashier: 10003\nRegister: Register 1\nCustomer:: [redacted]\n\n\n\nST IDES - TEA - LYCHEE PEAR (.10g)\n1A4060300048D3D006913126\n  Category: Beverage\n  Batch: 1A4060300048D3D006913126\n  1 @ 10.00 ea                             10.00\n--ALL - 25% OFF - EMPLOYEE DISCOUNT      -$2.50\n\n\n\n\nSubtotal: $8.50\nCA Sales 8.625%: $.60\nCA Excise 15%: $.90\nTotal Tax: $1.50\nPay By Bank Fee: $0.26\nTotal Discount: $2.50\n_________________________\nTotal: $7.76\n\nPayment (Dutchie Pay): $7.76\n\nDue Customer: $0.00\n\nTotal Items: 1\nTotal Grams: .10\nStarting Allotment: 36.50g\nRemaining Allotment: 36.40g\n\n\nThank you for stopping by!\nPlease  review on\nYELP or GOOGLE\n\n\nALL SALES ARE FINAL\nDefective Cartridges may be returned or\nexchanged within 7 days with receipt.\nThank you!"
  }
};

/**
 * The raw ESC/POS bytes behind DUTCHIE_PARSED_BUNDLE (the backend fixture,
 * customer id already overwritten with zeros), for page-level tests: what
 * `GET /receipt/{sid}` returns and the local text parser reads.
 */
export const DUTCHIE_BUNDLE_BYTES_B64 =
  "G0AbIQEKVW5pb24gQ2FubmFiaXMgQ2x1YgoyMDMwIFVuaW9uIFN0cmVldApTYW4gRnJhbmNpc2NvLCBDQSA5NDEyMwoKMTAvNi8yMDI2IDk6MzY6MzcgUE0KT3JkZXI6IDE0MDAxODgzMwpDYXNoaWVyOiAxMDAwMwpSZWdpc3RlcjogUmVnaXN0ZXIgMQpDdXN0b21lcjo6IDAwMDAwMDAwCgoKClNVTlNFVCBDT05ORUNUIC0gMUcgLSBIWUJSSUQgKDEuMDBnKQogLSBGVUxUT04gNUVSCjFBNDA2MDMwMDAxRTFBNTAwMTg0ODU0MQogIENhdGVnb3J5OiBQcmUtUm9sbHMKICBCYXRjaDogMUE0MDYwMzAwMDFFMUE1MDAxODQ4NTQxCiAgMiBAIDYuMDAgZWEgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAxMi4wMAotLUFMTCAtIDVFUiA0IEZPUiAkMjAgICAgICAgICAgICAgICAgICAgIC0kMS4wMAoKU1VOU0VUIENPTk5FQ1QgLSAxRyAtIFNBVElWQSAoMS4wMGcpCiAtIEZVTFRPTiA1RVIKMUE0MDYwMzAwMDFFMUE1MDAxODc2MTg5CiAgQ2F0ZWdvcnk6IFByZS1Sb2xscwogIEJhdGNoOiAxQTQwNjAzMDAwMUUxQTUwMDE4NzYxODkKICAyIEAgNi4wMCBlYSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDEyLjAwCi0tQUxMIC0gNUVSIDQgRk9SICQyMCAgICAgICAgICAgICAgICAgICAgLSQxLjAwCgpTVCBJREVTIC0gVEVBIC0gSElHSCBQVU5DSCAoLjEwZykKMUE0MDYwMzAwMDQ4RDNEMDA2NTg1MjUyCiAgQ2F0ZWdvcnk6IEJldmVyYWdlCiAgQmF0Y2g6IDFBNDA2MDMwMDA0OEQzRDAwNjU4NTI1MgogIDIgQCAxMC4wMCBlYSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMjAuMDAKCgoKClN1YnRvdGFsOiAkMzYuMDIKQ0EgU2FsZXMgOC42MjUlOiAkMy4xOApDQSBFeGNpc2UgMTUlOiAkNC44MApUb3RhbCBUYXg6ICQ3Ljk4ClRvdGFsIERpc2NvdW50OiAkNC4wMApfX19fX19fX19fX19fX19fX19fX19fX19fClRvdGFsOiAkNDAuMDAKClBheW1lbnQgKENhc2gpOiAkNTAuMDAKCkR1ZSBDdXN0b21lcjogJDEwLjAwCgpUb3RhbCBJdGVtczogNgpUb3RhbCBHcmFtczogNC4yMApTdGFydGluZyBBbGxvdG1lbnQ6IDM2LjUwZwpSZW1haW5pbmcgQWxsb3RtZW50OiAzMi4zMGcKCgpUaGFuayB5b3UgZm9yIHN0b3BwaW5nIGJ5ISAKUGxlYXNlICByZXZpZXcgb24gCllFTFAgb3IgR09PR0xFCgoKQUxMIFNBTEVTIEFSRSBGSU5BTApEZWZlY3RpdmUgQ2FydHJpZGdlcyBtYXkgYmUgcmV0dXJuZWQgb3IKZXhjaGFuZ2VkIHdpdGhpbiA3IGRheXMgd2l0aCByZWNlaXB0LgpUaGFuayB5b3UhCgoKCgoKG2QAGyEHG2kbcAAUFA==";
