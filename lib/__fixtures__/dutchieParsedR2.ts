// lib/__fixtures__/dutchieParsedR2.ts
//
// `GET /receipt/{sid}/parsed` bodies in the exact Dutchie r2 shape:
// Papex_RDH_Backend docs/CONTRACT-dutchie-r2.md (feat/dutchie-extractor-r2
// @ 60970da).
//
// GENERATED, not hand-written: each capture went through the r2 indexer's
// indexObject() (the row it writes, incl. receiptDetailFields) and the r2 fetch
// handler's toReceipt(), taken from the backend agent's r2 worktree on
// 2026-10-07 (handler.js sha256 8844dc5e..., lib/dutchieReceipt.js 1ca21f04...,
// fetch/handler.js 35fa01d3...). The envelope (sid, merchantId, parseStatus,
// hasImage, uploadedAt) is the contract's.
//
// Sources: the backend's scrubbed fixtures (customer/patient/cashier ids
// overwritten) and its variants/v05b_cart_disc_line.txt. rawText went through
// the indexer's redaction. Placeholder sid.

/** Dutchie Pay + Pay By Bank Fee, 25% employee discount on one item (order 140018846's layout; the contract's example). Source: employee-discount-dutchie-pay. */
export const DUTCHIE_R2_FEE = {
  "sid": "0000000000000000",
  "merchantId": "union-street-cannabis-club",
  "parseStatus": "ok",
  "hasImage": false,
  "uploadedAt": "2026-10-07T20:00:00.000Z",
  "receipt": {
    "merchantName": "Union Cannabis Club",
    "merchantAddress": "2030 Union Street, San Francisco, CA 94123",
    "date": "10/6/2026 9:49:40 PM",
    "subtotal": 6,
    "tax": 1.5,
    "taxComponents": [
      {
        "label": "CA Sales 8.625%",
        "name": "CA Sales",
        "rate": 8.625,
        "rateText": "8.625%",
        "amount": 0.6
      },
      {
        "label": "CA Excise 15%",
        "name": "CA Excise",
        "rate": 15,
        "rateText": "15%",
        "amount": 0.9
      }
    ],
    "total": 7.76,
    "lineItems": [
      {
        "name": "ST IDES - TEA - LYCHEE PEAR",
        "quantity": 1,
        "price": 10,
        "sku": null,
        "brand": null,
        "discount": -2.5,
        "discountNotes": "ALL - 25% OFF - EMPLOYEE DISCOUNT",
        "quantityUnit": "ea",
        "unitPrice": 10
      }
    ],
    "paymentMethod": "Dutchie Pay",
    "cardBrand": null,
    "cardLast4": null,
    "receiptNumber": "140018846",
    "confidence": "medium",
    "extractorEngine": "rdh-dutchie-escpos",
    "orderNumber": "140018846",
    "receiptKind": "sale",
    "isTestPrint": false,
    "isReprint": false,
    "printedSubtotal": 8.5,
    "taxInclusive": true,
    "fees": [
      {
        "label": "Pay By Bank Fee",
        "amount": 0.26
      }
    ],
    "discountTotal": -2.5,
    "cartDiscount": 0,
    "cartDiscountLines": [],
    "payments": [
      {
        "method": "Dutchie Pay",
        "amount": 7.76
      }
    ],
    "changeDue": 0,
    "loyalty": {
      "enrolled": null
    },
    "rawText": "\nUnion Cannabis Club\n2030 Union Street\nSan Francisco, CA 94123\n\n10/6/2026 9:49:40 PM\nOrder: 140018846\nCashier: 10003\nRegister: Register 1\nCustomer:: [redacted]\n\n\n\nST IDES - TEA - LYCHEE PEAR (.10g)\n1A4060300048D3D006913126\n  Category: Beverage\n  Batch: 1A4060300048D3D006913126\n  1 @ 10.00 ea                             10.00\n--ALL - 25% OFF - EMPLOYEE DISCOUNT      -$2.50\n\n\n\n\nSubtotal: $8.50\nCA Sales 8.625%: $.60\nCA Excise 15%: $.90\nTotal Tax: $1.50\nPay By Bank Fee: $0.26\nTotal Discount: $2.50\n_________________________\nTotal: $7.76\n\nPayment (Dutchie Pay): $7.76\n\nDue Customer: $0.00\n\nTotal Items: 1\nTotal Grams: .10\nStarting Allotment: 36.50g\nRemaining Allotment: 36.40g\n\n\nThank you for stopping by!\nPlease  review on\nYELP or GOOGLE\n\n\nALL SALES ARE FINAL\nDefective Cartridges may be returned or\nexchanged within 7 days with receipt.\nThank you!"
  }
};

/** A cart-level "--CART - $5 OFF ORDER" line on no item; not a loyalty member. Source: variants/v05b_cart_disc_line. */
export const DUTCHIE_R2_CART = {
  "sid": "0000000000000000",
  "merchantId": "union-street-cannabis-club",
  "parseStatus": "ok",
  "hasImage": false,
  "uploadedAt": "2026-10-07T20:00:00.000Z",
  "receipt": {
    "merchantName": "Union Cannabis Club",
    "merchantAddress": "2030 Union Street, San Francisco, CA 94123",
    "date": "10/7/2026 12:14:17 PM",
    "subtotal": 38.43,
    "tax": 9.57,
    "taxComponents": [
      {
        "label": "CA Sales 8.625%",
        "name": "CA Sales",
        "rate": 8.625,
        "rateText": "8.625%",
        "amount": 3.81
      },
      {
        "label": "CA Excise 15%",
        "name": "CA Excise",
        "rate": 15,
        "rateText": "15%",
        "amount": 5.76
      }
    ],
    "total": 48,
    "lineItems": [
      {
        "name": "SPACE GEM - 20PK - MINI GEMS - SATIVA - VIBRANT FOCUS",
        "quantity": 1,
        "price": 28,
        "sku": null,
        "brand": null,
        "discount": null,
        "discountNotes": null,
        "quantityUnit": "ea",
        "unitPrice": 28
      },
      {
        "name": "WYLD - 10PK - THC:THCV - KIWI 1:1",
        "quantity": 1,
        "price": 25,
        "sku": null,
        "brand": null,
        "discount": null,
        "discountNotes": null,
        "quantityUnit": "ea",
        "unitPrice": 25
      }
    ],
    "paymentMethod": "Cash",
    "cardBrand": null,
    "cardLast4": null,
    "receiptNumber": "140023547",
    "confidence": "medium",
    "extractorEngine": "rdh-dutchie-escpos",
    "orderNumber": "140023547",
    "receiptKind": "sale",
    "isTestPrint": false,
    "isReprint": false,
    "printedSubtotal": 43.43,
    "taxInclusive": true,
    "fees": [],
    "discountTotal": -5,
    "cartDiscount": -5,
    "cartDiscountLines": [
      {
        "label": "CART - $5 OFF ORDER",
        "amount": -5
      }
    ],
    "payments": [
      {
        "method": "Cash",
        "amount": 50
      }
    ],
    "changeDue": 2,
    "loyalty": {
      "enrolled": false
    },
    "rawText": "\nUnion Cannabis Club\n2030 Union Street\nSan Francisco, CA 94123\n\n10/7/2026 12:14:17 PM\nOrder: 140023547\nCashier: 10002\nRegister: Register 2\nCustomer:: [redacted]\n\n\n\nSPACE GEM - 20PK - MINI GEMS (.10g)\n - SATIVA - VIBRANT FOCUS\n1A4060300048D3D006370991\n  Category: Edible\n  Batch: 1A4060300048D3D006370991\n  1 @ 28.00 ea                             28.00\n\nWYLD - 10PK - THC:THCV - KIW (.10g)\nI 1:1\n1A406030005AACB000281333\n  Category: Edible\n  Batch: 1A406030005AACB000281333\n  1 @ 25.00 ea                             25.00\n\n--CART - $5 OFF ORDER                      -$5.00\n\n\nSubtotal: $43.43\nCA Sales 8.625%: $3.81\nCA Excise 15%: $5.76\nTotal Tax: $9.57\nTotal Discount: $5.00\n_________________________\nTotal: $48.00\n\nPayment (Cash): $50.00\n\nDue Customer: $2.00\n\nTotal Items: 2\nTotal Grams: .20\nStarting Allotment: 36.50g\nRemaining Allotment: 36.30g\n\nLoyalty Points: ** Not opted-into program **\n\n\nThank you for stopping by!\nPlease  review on\nYELP or GOOGLE\n\n\nALL SALES ARE FINAL\nDefective Cartridges may be returned or\nexchanged within 7 days with receipt.\nThank you!"
  }
};

/** Loyalty member: earned 0.96, used 0, balance 13.3. A $10 bundle discount on a qty-2 line. Source: qty2-bundle-discount-cash-reprint-loyalty-points. */
export const DUTCHIE_R2_MEMBER = {
  "sid": "0000000000000000",
  "merchantId": "union-street-cannabis-club",
  "parseStatus": "ok",
  "hasImage": false,
  "uploadedAt": "2026-10-07T20:00:00.000Z",
  "receipt": {
    "merchantName": "Union Cannabis Club",
    "merchantAddress": "2030 Union Street, San Francisco, CA 94123",
    "date": "10/6/2026 9:15:43 PM",
    "subtotal": 32.02,
    "tax": 7.98,
    "taxComponents": [
      {
        "label": "CA Sales 8.625%",
        "name": "CA Sales",
        "rate": 8.625,
        "rateText": "8.625%",
        "amount": 3.18
      },
      {
        "label": "CA Excise 15%",
        "name": "CA Excise",
        "rate": 15,
        "rateText": "15%",
        "amount": 4.8
      }
    ],
    "total": 40,
    "lineItems": [
      {
        "name": "KIVA - CAMINO - MIDNIGHT BLUEBERRY",
        "quantity": 2,
        "price": 50,
        "sku": null,
        "brand": null,
        "discount": -10,
        "discountNotes": "RHCC - UCC - KIVA CAMINO 2X $40",
        "quantityUnit": "ea",
        "unitPrice": 25
      }
    ],
    "paymentMethod": "Cash",
    "cardBrand": null,
    "cardLast4": null,
    "receiptNumber": "140018797",
    "confidence": "medium",
    "extractorEngine": "rdh-dutchie-escpos",
    "orderNumber": "140018797",
    "receiptKind": "sale",
    "isTestPrint": false,
    "isReprint": false,
    "printedSubtotal": 42.02,
    "taxInclusive": true,
    "fees": [],
    "discountTotal": -10,
    "cartDiscount": 0,
    "cartDiscountLines": [],
    "payments": [
      {
        "method": "Cash",
        "amount": 40
      }
    ],
    "changeDue": 0,
    "loyalty": {
      "enrolled": true,
      "pointsEarned": 0.96,
      "pointsRedeemed": 0,
      "pointsBalance": 13.3
    },
    "rawText": "\nUnion Cannabis Club\n2030 Union Street\nSan Francisco, CA 94123\n\n10/6/2026 9:15:43 PM\nOrder: 140018797\nCashier: 10003\nRegister: Register 1\nCustomer:: [redacted]\n\n\n\nKIVA - CAMINO - MIDNIGHT BLU (.10g)\nEBERRY\n1A406030001E1A5001866576\n  Category: Edible\n  Batch: 1A406030001E1A5001866576\n  2 @ 25.00 ea                             50.00\n--RHCC - UCC - KIVA CAMINO 2X $40        -$5.00\n\n\n\n\nSubtotal: $42.02\nCA Sales 8.625%: $3.18\nCA Excise 15%: $4.80\nTotal Tax: $7.98\nTotal Discount: $10.00\n_________________________\nTotal: $40.00\n\nPayment (Cash): $40.00\n\nDue Customer: $0.00\n\nTotal Items: 2\nTotal Grams: .20\nStarting Allotment: 36.50g\nRemaining Allotment: 36.30g\n\nLoyalty Points Earned: 0.96\nLoyalty Points Used: 0.00\nLoyalty Points Total: 13.30\n\n\nThank you for stopping by!\nPlease  review on\nYELP or GOOGLE\n\n\nALL SALES ARE FINAL\nDefective Cartridges may be returned or\nexchanged within 7 days with receipt.\nThank you!"
  }
};

/** "Loyalty Points: ** Not opted-into program **" -> {enrolled: false}. Source: one-item-cash-exact-reprint-loyalty-banner. */
export const DUTCHIE_R2_NONMEMBER = {
  "sid": "0000000000000000",
  "merchantId": "union-street-cannabis-club",
  "parseStatus": "ok",
  "hasImage": false,
  "uploadedAt": "2026-10-07T20:00:00.000Z",
  "receipt": {
    "merchantName": "Union Cannabis Club",
    "merchantAddress": "2030 Union Street, San Francisco, CA 94123",
    "date": "10/7/2026 11:36:11 AM",
    "subtotal": 20.01,
    "tax": 4.99,
    "taxComponents": [
      {
        "label": "CA Sales 8.625%",
        "name": "CA Sales",
        "rate": 8.625,
        "rateText": "8.625%",
        "amount": 1.99
      },
      {
        "label": "CA Excise 15%",
        "name": "CA Excise",
        "rate": 15,
        "rateText": "15%",
        "amount": 3
      }
    ],
    "total": 25,
    "lineItems": [
      {
        "name": "KIVA - CAMINO - SOURS - BLACKBERRY DREAM 1:1:1",
        "quantity": 1,
        "price": 25,
        "sku": null,
        "brand": null,
        "discount": null,
        "discountNotes": null,
        "quantityUnit": "ea",
        "unitPrice": 25
      }
    ],
    "paymentMethod": "Cash",
    "cardBrand": null,
    "cardLast4": null,
    "receiptNumber": "140022945",
    "confidence": "medium",
    "extractorEngine": "rdh-dutchie-escpos",
    "orderNumber": "140022945",
    "receiptKind": "sale",
    "isTestPrint": false,
    "isReprint": false,
    "printedSubtotal": 20.01,
    "taxInclusive": true,
    "fees": [],
    "discountTotal": 0,
    "cartDiscount": 0,
    "cartDiscountLines": [],
    "payments": [
      {
        "method": "Cash",
        "amount": 25
      }
    ],
    "changeDue": 0,
    "loyalty": {
      "enrolled": false
    },
    "rawText": "\nUnion Cannabis Club\n2030 Union Street\nSan Francisco, CA 94123\n\n10/7/2026 11:36:11 AM\nOrder: 140022945\nCashier: 10002\nRegister: Register 2\nCustomer:: [redacted]\n\n\n\nKIVA - CAMINO - SOURS - BLAC (.10g)\nKBERRY DREAM 1:1:1\n1A406030001E1A5001876173\n  Category: Edible\n  Batch: 1A406030001E1A5001876173\n  1 @ 25.00 ea                             25.00\n\n\n\n\nSubtotal: $20.01\nCA Sales 8.625%: $1.99\nCA Excise 15%: $3.00\nTotal Tax: $4.99\nTotal Discount: $0.00\n_________________________\nTotal: $25.00\n\nPayment (Cash): $25.00\n\nDue Customer: $0.00\n\nTotal Items: 1\nTotal Grams: .10\nStarting Allotment: 36.50g\nRemaining Allotment: 36.40g\n\nLoyalty Points: ** Not opted-into program **\n\n\nThank you for stopping by!\nPlease  review on\nYELP or GOOGLE\n\n\nALL SALES ARE FINAL\nDefective Cartridges may be returned or\nexchanged within 7 days with receipt.\nThank you!"
  }
};

/** Printed before the store enabled loyalty -> {enrolled: null}. Cash with change. Source: three-items-bundle-discount-cash-change. */
export const DUTCHIE_R2_NO_LOYALTY = {
  "sid": "0000000000000000",
  "merchantId": "union-street-cannabis-club",
  "parseStatus": "ok",
  "hasImage": false,
  "uploadedAt": "2026-10-07T20:00:00.000Z",
  "receipt": {
    "merchantName": "Union Cannabis Club",
    "merchantAddress": "2030 Union Street, San Francisco, CA 94123",
    "date": "10/6/2026 9:36:37 PM",
    "subtotal": 32.02,
    "tax": 7.98,
    "taxComponents": [
      {
        "label": "CA Sales 8.625%",
        "name": "CA Sales",
        "rate": 8.625,
        "rateText": "8.625%",
        "amount": 3.18
      },
      {
        "label": "CA Excise 15%",
        "name": "CA Excise",
        "rate": 15,
        "rateText": "15%",
        "amount": 4.8
      }
    ],
    "total": 40,
    "lineItems": [
      {
        "name": "SUNSET CONNECT - 1G - HYBRID - FULTON 5ER",
        "quantity": 2,
        "price": 12,
        "sku": null,
        "brand": null,
        "discount": -2,
        "discountNotes": "ALL - 5ER 4 FOR $20",
        "quantityUnit": "ea",
        "unitPrice": 6
      },
      {
        "name": "SUNSET CONNECT - 1G - SATIVA - FULTON 5ER",
        "quantity": 2,
        "price": 12,
        "sku": null,
        "brand": null,
        "discount": -2,
        "discountNotes": "ALL - 5ER 4 FOR $20",
        "quantityUnit": "ea",
        "unitPrice": 6
      },
      {
        "name": "ST IDES - TEA - HIGH PUNCH",
        "quantity": 2,
        "price": 20,
        "sku": null,
        "brand": null,
        "discount": null,
        "discountNotes": null,
        "quantityUnit": "ea",
        "unitPrice": 10
      }
    ],
    "paymentMethod": "Cash",
    "cardBrand": null,
    "cardLast4": null,
    "receiptNumber": "140018833",
    "confidence": "medium",
    "extractorEngine": "rdh-dutchie-escpos",
    "orderNumber": "140018833",
    "receiptKind": "sale",
    "isTestPrint": false,
    "isReprint": false,
    "printedSubtotal": 36.02,
    "taxInclusive": true,
    "fees": [],
    "discountTotal": -4,
    "cartDiscount": 0,
    "cartDiscountLines": [],
    "payments": [
      {
        "method": "Cash",
        "amount": 50
      }
    ],
    "changeDue": 10,
    "loyalty": {
      "enrolled": null
    },
    "rawText": "\nUnion Cannabis Club\n2030 Union Street\nSan Francisco, CA 94123\n\n10/6/2026 9:36:37 PM\nOrder: 140018833\nCashier: 10003\nRegister: Register 1\nCustomer:: [redacted]\n\n\n\nSUNSET CONNECT - 1G - HYBRID (1.00g)\n - FULTON 5ER\n1A406030001E1A5001848541\n  Category: Pre-Rolls\n  Batch: 1A406030001E1A5001848541\n  2 @ 6.00 ea                              12.00\n--ALL - 5ER 4 FOR $20                    -$1.00\n\nSUNSET CONNECT - 1G - SATIVA (1.00g)\n - FULTON 5ER\n1A406030001E1A5001876189\n  Category: Pre-Rolls\n  Batch: 1A406030001E1A5001876189\n  2 @ 6.00 ea                              12.00\n--ALL - 5ER 4 FOR $20                    -$1.00\n\nST IDES - TEA - HIGH PUNCH (.10g)\n1A4060300048D3D006585252\n  Category: Beverage\n  Batch: 1A4060300048D3D006585252\n  2 @ 10.00 ea                             20.00\n\n\n\n\nSubtotal: $36.02\nCA Sales 8.625%: $3.18\nCA Excise 15%: $4.80\nTotal Tax: $7.98\nTotal Discount: $4.00\n_________________________\nTotal: $40.00\n\nPayment (Cash): $50.00\n\nDue Customer: $10.00\n\nTotal Items: 6\nTotal Grams: 4.20\nStarting Allotment: 36.50g\nRemaining Allotment: 32.30g\n\n\nThank you for stopping by!\nPlease  review on\nYELP or GOOGLE\n\n\nALL SALES ARE FINAL\nDefective Cartridges may be returned or\nexchanged within 7 days with receipt.\nThank you!"
  }
};

/** The Backoffice "Example Receipt" (receiptKind test_print). Source: example-test-print. */
export const DUTCHIE_R2_TEST_PRINT = {
  "sid": "0000000000000000",
  "merchantId": "union-street-cannabis-club",
  "parseStatus": "ok",
  "hasImage": false,
  "uploadedAt": "2026-10-07T20:00:00.000Z",
  "receipt": {
    "merchantName": "Union Cannabis Club",
    "merchantAddress": "City, State",
    "date": "10/7/2026 11:48:45AM",
    "subtotal": 30,
    "tax": 0,
    "taxComponents": [
      {
        "label": "Sales Tax",
        "name": "Sales Tax",
        "rate": null,
        "rateText": null,
        "amount": 0
      }
    ],
    "total": 30,
    "lineItems": [
      {
        "name": "Product Name - 123456",
        "quantity": 1,
        "price": 20,
        "sku": null,
        "brand": null,
        "discount": null,
        "discountNotes": null,
        "quantityUnit": null,
        "unitPrice": null
      },
      {
        "name": "Product Name - flower",
        "quantity": 1,
        "price": 10,
        "sku": null,
        "brand": null,
        "discount": null,
        "discountNotes": null,
        "quantityUnit": null,
        "unitPrice": null
      }
    ],
    "paymentMethod": null,
    "cardBrand": null,
    "cardLast4": null,
    "receiptNumber": "2545937",
    "confidence": "medium",
    "extractorEngine": "rdh-dutchie-escpos",
    "orderNumber": "2545937",
    "receiptKind": "test_print",
    "isTestPrint": true,
    "isReprint": null,
    "printedSubtotal": 30,
    "taxInclusive": null,
    "fees": [],
    "discountTotal": 0,
    "cartDiscount": 0,
    "cartDiscountLines": [],
    "payments": [],
    "changeDue": 0,
    "loyalty": {
      "enrolled": true,
      "pointsEarned": 0,
      "pointsRedeemed": 0,
      "pointsBalance": 0
    },
    "rawText": "Example Receipt\nUnion Cannabis Club\nCity, State\n\n10/7/2026 11:48:45AM\nOrder: 2545937\nCashier: Example\nPatient: [redacted]\n\n\n\nProduct Name - 123456 (2.00g)\n  Batch: Package ID - 654321\nUnit Price                               20.00\n\nProduct Name - flower (3.00g)\n  Batch: Batch name\nUnit Price                               10.00\n\n\n\n\nSubtotal: $30.00\nSales Tax: $0.00\nTotal Discount: $0.00\n_________________________\nTotal: $30.00\n\n\nDue Customer: $0\n\nTotal Items: 2\n\nLoyalty Points Earned: 0.00\nLoyalty Points Used: 0.00\nLoyalty Points Total: 0.00000\n\n\n\n\nSignature: ___________________________________"
  }
};
