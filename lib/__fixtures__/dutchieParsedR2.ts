// lib/__fixtures__/dutchieParsedR2.ts
//
// `GET /receipt/{sid}/parsed` bodies carrying the Dutchie r2 fields
// (taxComponents, fees, discountTotal, loyalty).
//
// PROVISIONAL SHAPE: built before Papex_RDH_Backend feat/dutchie-extractor-r2
// published CONTRACT-dutchie-r2.md. The r2 fields here are a projection of
// what the live extractor (6e7294f) already computes: summary.taxComponents,
// dutchie.fees, dutchie.discountTotal (negative, as the extractor stores it)
// and dutchie.loyalty mapped to {enrolled, pointsEarned, pointsRedeemed,
// pointsBalance, tier, programName}. Re-generate from the contract when it lands.
//
// Sources: the backend's scrubbed fixtures (employee-discount-dutchie-pay,
// qty2-bundle-discount-cash-reprint-loyalty-points,
// one-item-cash-exact-reprint-loyalty-banner) and the verifier's
// v05_cart_discount variant with its cashier and customer ids overwritten.
// rawText went through the indexer's redaction. Placeholder sid.

/** Dutchie Pay + Pay By Bank Fee, 25% item discount (order 140018846's layout). */
export const DUTCHIE_R2_FEE = {
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
    "rawText": "\nUnion Cannabis Club\n2030 Union Street\nSan Francisco, CA 94123\n\n10/6/2026 9:49:40 PM\nOrder: 140018846\nCashier: 10003\nRegister: Register 1\nCustomer:: [redacted]\n\n\n\nST IDES - TEA - LYCHEE PEAR (.10g)\n1A4060300048D3D006913126\n  Category: Beverage\n  Batch: 1A4060300048D3D006913126\n  1 @ 10.00 ea                             10.00\n--ALL - 25% OFF - EMPLOYEE DISCOUNT      -$2.50\n\n\n\n\nSubtotal: $8.50\nCA Sales 8.625%: $.60\nCA Excise 15%: $.90\nTotal Tax: $1.50\nPay By Bank Fee: $0.26\nTotal Discount: $2.50\n_________________________\nTotal: $7.76\n\nPayment (Dutchie Pay): $7.76\n\nDue Customer: $0.00\n\nTotal Items: 1\nTotal Grams: .10\nStarting Allotment: 36.50g\nRemaining Allotment: 36.40g\n\n\nThank you for stopping by!\nPlease  review on\nYELP or GOOGLE\n\n\nALL SALES ARE FINAL\nDefective Cartridges may be returned or\nexchanged within 7 days with receipt.\nThank you!",
    "taxComponents": [
      {
        "label": "CA Sales 8.625%",
        "amount": 0.6
      },
      {
        "label": "CA Excise 15%",
        "amount": 0.9
      }
    ],
    "fees": [
      {
        "label": "Pay By Bank Fee",
        "amount": 0.26
      }
    ],
    "discountTotal": -2.5,
    "loyalty": null
  }
};

/** A .00 cart-level discount on no item; not a loyalty member. */
export const DUTCHIE_R2_CART = {
  "sid": "0000000000000000",
  "parseStatus": "ok",
  "hasImage": false,
  "uploadedAt": "2026-10-07T00:00:00.000Z",
  "receipt": {
    "merchantName": "Union Cannabis Club",
    "merchantAddress": "2030 Union Street, San Francisco, CA 94123",
    "date": "10/7/2026 12:14:17 PM",
    "subtotal": 38.43,
    "tax": 9.57,
    "total": 48,
    "lineItems": [
      {
        "name": "SPACE GEM - 20PK - MINI GEMS - SATIVA - VIBRANT FOCUS",
        "quantity": 1,
        "price": 28,
        "sku": null,
        "brand": null,
        "discount": null
      },
      {
        "name": "WYLD - 10PK - THC:THCV - KIWI 1:1",
        "quantity": 1,
        "price": 25,
        "sku": null,
        "brand": null,
        "discount": null
      }
    ],
    "paymentMethod": "Cash",
    "cardBrand": null,
    "cardLast4": null,
    "receiptNumber": "140023547",
    "confidence": "medium",
    "extractorEngine": "rdh-dutchie-escpos",
    "rawText": "\nUnion Cannabis Club\n2030 Union Street\nSan Francisco, CA 94123\n\n10/7/2026 12:14:17 PM\nOrder: 140023547\nCashier: 10003\nRegister: Register 2\nCustomer:: [redacted]\n\n\n\nSPACE GEM - 20PK - MINI GEMS (.10g)\n - SATIVA - VIBRANT FOCUS\n1A4060300048D3D006370991\n  Category: Edible\n  Batch: 1A4060300048D3D006370991\n  1 @ 28.00 ea                             28.00\n\nWYLD - 10PK - THC:THCV - KIW (.10g)\nI 1:1\n1A406030005AACB000281333\n  Category: Edible\n  Batch: 1A406030005AACB000281333\n  1 @ 25.00 ea                             25.00\n\n\n\n\nSubtotal: $43.43\nCA Sales 8.625%: $3.81\nCA Excise 15%: $5.76\nTotal Tax: $9.57\nTotal Discount: $5.00\n_________________________\nTotal: $48.00\n\nPayment (Cash): $50.00\n\nDue Customer: $2.00\n\nTotal Items: 2\nTotal Grams: .20\nStarting Allotment: 36.50g\nRemaining Allotment: 36.30g\n\nLoyalty Points: ** Not opted-into program **\n\n\nThank you for stopping by!\nPlease  review on\nYELP or GOOGLE\n\n\nALL SALES ARE FINAL\nDefective Cartridges may be returned or\nexchanged within 7 days with receipt.\nThank you!",
    "taxComponents": [
      {
        "label": "CA Sales 8.625%",
        "amount": 3.81
      },
      {
        "label": "CA Excise 15%",
        "amount": 5.76
      }
    ],
    "fees": [],
    "discountTotal": -5,
    "loyalty": {
      "enrolled": false,
      "pointsEarned": null,
      "pointsRedeemed": null,
      "pointsBalance": null,
      "tier": null,
      "programName": null
    }
  }
};

/** Loyalty member: earned 0.96, used 0.00, balance 13.30. */
export const DUTCHIE_R2_MEMBER = {
  "sid": "0000000000000000",
  "parseStatus": "ok",
  "hasImage": false,
  "uploadedAt": "2026-10-07T00:00:00.000Z",
  "receipt": {
    "merchantName": "Union Cannabis Club",
    "merchantAddress": "2030 Union Street, San Francisco, CA 94123",
    "date": "10/6/2026 9:15:43 PM",
    "subtotal": 32.02,
    "tax": 7.98,
    "total": 40,
    "lineItems": [
      {
        "name": "KIVA - CAMINO - MIDNIGHT BLUEBERRY",
        "quantity": 2,
        "price": 50,
        "sku": null,
        "brand": null,
        "discount": -10
      }
    ],
    "paymentMethod": "Cash",
    "cardBrand": null,
    "cardLast4": null,
    "receiptNumber": "140018797",
    "confidence": "medium",
    "extractorEngine": "rdh-dutchie-escpos",
    "rawText": "\nUnion Cannabis Club\n2030 Union Street\nSan Francisco, CA 94123\n\n10/6/2026 9:15:43 PM\nOrder: 140018797\nCashier: 10003\nRegister: Register 1\nCustomer:: [redacted]\n\n\n\nKIVA - CAMINO - MIDNIGHT BLU (.10g)\nEBERRY\n1A406030001E1A5001866576\n  Category: Edible\n  Batch: 1A406030001E1A5001866576\n  2 @ 25.00 ea                             50.00\n--RHCC - UCC - KIVA CAMINO 2X $40        -$5.00\n\n\n\n\nSubtotal: $42.02\nCA Sales 8.625%: $3.18\nCA Excise 15%: $4.80\nTotal Tax: $7.98\nTotal Discount: $10.00\n_________________________\nTotal: $40.00\n\nPayment (Cash): $40.00\n\nDue Customer: $0.00\n\nTotal Items: 2\nTotal Grams: .20\nStarting Allotment: 36.50g\nRemaining Allotment: 36.30g\n\nLoyalty Points Earned: 0.96\nLoyalty Points Used: 0.00\nLoyalty Points Total: 13.30\n\n\nThank you for stopping by!\nPlease  review on\nYELP or GOOGLE\n\n\nALL SALES ARE FINAL\nDefective Cartridges may be returned or\nexchanged within 7 days with receipt.\nThank you!",
    "taxComponents": [
      {
        "label": "CA Sales 8.625%",
        "amount": 3.18
      },
      {
        "label": "CA Excise 15%",
        "amount": 4.8
      }
    ],
    "fees": [],
    "discountTotal": -10,
    "loyalty": {
      "enrolled": true,
      "pointsEarned": 0.96,
      "pointsRedeemed": 0,
      "pointsBalance": 13.3,
      "tier": null,
      "programName": null
    }
  }
};

/** "Loyalty Points: ** Not opted-into program **". */
export const DUTCHIE_R2_NONMEMBER = {
  "sid": "0000000000000000",
  "parseStatus": "ok",
  "hasImage": false,
  "uploadedAt": "2026-10-07T00:00:00.000Z",
  "receipt": {
    "merchantName": "Union Cannabis Club",
    "merchantAddress": "2030 Union Street, San Francisco, CA 94123",
    "date": "10/7/2026 11:36:11 AM",
    "subtotal": 20.01,
    "tax": 4.99,
    "total": 25,
    "lineItems": [
      {
        "name": "KIVA - CAMINO - SOURS - BLACKBERRY DREAM 1:1:1",
        "quantity": 1,
        "price": 25,
        "sku": null,
        "brand": null,
        "discount": null
      }
    ],
    "paymentMethod": "Cash",
    "cardBrand": null,
    "cardLast4": null,
    "receiptNumber": "140022945",
    "confidence": "medium",
    "extractorEngine": "rdh-dutchie-escpos",
    "rawText": "\nUnion Cannabis Club\n2030 Union Street\nSan Francisco, CA 94123\n\n10/7/2026 11:36:11 AM\nOrder: 140022945\nCashier: 10002\nRegister: Register 2\nCustomer:: [redacted]\n\n\n\nKIVA - CAMINO - SOURS - BLAC (.10g)\nKBERRY DREAM 1:1:1\n1A406030001E1A5001876173\n  Category: Edible\n  Batch: 1A406030001E1A5001876173\n  1 @ 25.00 ea                             25.00\n\n\n\n\nSubtotal: $20.01\nCA Sales 8.625%: $1.99\nCA Excise 15%: $3.00\nTotal Tax: $4.99\nTotal Discount: $0.00\n_________________________\nTotal: $25.00\n\nPayment (Cash): $25.00\n\nDue Customer: $0.00\n\nTotal Items: 1\nTotal Grams: .10\nStarting Allotment: 36.50g\nRemaining Allotment: 36.40g\n\nLoyalty Points: ** Not opted-into program **\n\n\nThank you for stopping by!\nPlease  review on\nYELP or GOOGLE\n\n\nALL SALES ARE FINAL\nDefective Cartridges may be returned or\nexchanged within 7 days with receipt.\nThank you!",
    "taxComponents": [
      {
        "label": "CA Sales 8.625%",
        "amount": 1.99
      },
      {
        "label": "CA Excise 15%",
        "amount": 3
      }
    ],
    "fees": [],
    "discountTotal": 0,
    "loyalty": {
      "enrolled": false,
      "pointsEarned": null,
      "pointsRedeemed": null,
      "pointsBalance": null,
      "tier": null,
      "programName": null
    }
  }
};
