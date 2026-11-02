// Generated from copilot/config/standards/*.yaml, settings.yaml, evals/golden_set.json and the eval runs (2026-10-31).
window.DATA = {
 "standards": [
  {
   "id": "P1",
   "title": "Limitation of Liability",
   "weight": 5,
   "critical": true,
   "silent": "risk",
   "ideal": "Cap at 12 months' Fees; no indirect loss",
   "accept": "Data-breach super-cap up to 24 months",
   "never": "Unlimited, or a cap above 24 months",
   "flags": [
    "unlimited",
    "uncapped",
    "without limit",
    "without any limit"
   ],
   "context": [],
   "numeric": {
    "unit": "months of Fees (cap)",
    "pattern": "\\(?(\\d+)\\)?\\s*months",
    "pick": "max",
    "bands": [
     {
      "max": 12,
      "status": "Compliant"
     },
     {
      "max": 24,
      "status": "Partial"
     },
     {
      "status": "Conflicting"
     }
    ]
   }
  },
  {
   "id": "P2",
   "title": "Indemnification",
   "weight": 5,
   "critical": true,
   "silent": "ok",
   "ideal": "Mutual, third-party claims, fault-based, capped",
   "accept": "One-way from PayNest, named claims, capped",
   "never": "“Any and all claims”, regardless of fault",
   "flags": [
    "any and all claims",
    "regardless of fault",
    "howsoever arising"
   ],
   "context": [],
   "numeric": null
  },
  {
   "id": "P3",
   "title": "Security Incident Notification",
   "weight": 5,
   "critical": true,
   "silent": "ok",
   "ideal": "Notice within 24 hours of confirming",
   "accept": "A fixed 12–23 hour window",
   "never": "“Immediately”, or under 12 hours",
   "flags": [
    "immediately",
    "forthwith",
    "without any delay"
   ],
   "context": [
    "security incident",
    "data breach",
    "personal data breach"
   ],
   "numeric": {
    "unit": "hours (notification window)",
    "pattern": "\\(?(\\d+)\\)?\\s*hours",
    "pick": "min",
    "bands": [
     {
      "max": 11,
      "status": "Conflicting"
     },
     {
      "max": 23,
      "status": "Partial"
     },
     {
      "status": "Compliant"
     }
    ]
   }
  },
  {
   "id": "P4",
   "title": "Service Levels and Service Credits",
   "weight": 4,
   "critical": false,
   "silent": "ok",
   "ideal": "99.5% uptime; credits are the only remedy",
   "accept": "Up to 99.9%, or credits capped at 20%",
   "never": "Above 99.9%, or uncapped penalties",
   "flags": [
    "99.99%",
    "uncapped penalt",
    "in addition to service credits"
   ],
   "context": [],
   "numeric": {
    "unit": "% availability",
    "pattern": "(9\\d(?:\\.\\d+)?)\\s*%",
    "pick": "max",
    "bands": [
     {
      "max": 99.5,
      "status": "Compliant"
     },
     {
      "max": 99.9,
      "status": "Partial"
     },
     {
      "status": "Conflicting"
     }
    ]
   }
  },
  {
   "id": "P5",
   "title": "Audit and Inspection Rights",
   "weight": 3,
   "critical": false,
   "silent": "ok",
   "ideal": "Once a year, 30 days' written notice",
   "accept": "Twice a year, or 15 days' notice",
   "never": "“At any time”, unannounced, unlimited",
   "flags": [
    "at any time",
    "without notice",
    "without prior notice",
    "unannounced"
   ],
   "context": [],
   "numeric": {
    "unit": "days' notice (audit)",
    "pattern": "\\(?(\\d+)\\)?\\s*days\\W*(?:prior\\s+)?(?:written\\s+)?notice",
    "pick": "min",
    "bands": [
     {
      "max": 14,
      "status": "Conflicting"
     },
     {
      "max": 29,
      "status": "Partial"
     },
     {
      "status": "Compliant"
     }
    ]
   }
  },
  {
   "id": "P6",
   "title": "Return and Deletion of Client Data",
   "weight": 3,
   "critical": false,
   "silent": "ok",
   "ideal": "Return and delete within 30 days",
   "accept": "Within 8–29 days",
   "never": "7 days or less, or “immediately”",
   "flags": [
    "immediately upon termination",
    "direct access to"
   ],
   "context": [],
   "numeric": {
    "unit": "days (return and deletion)",
    "pattern": "\\(?(\\d+)\\)?\\s*(?:business\\s+)?days",
    "pick": "min",
    "bands": [
     {
      "max": 7,
      "status": "Conflicting"
     },
     {
      "max": 29,
      "status": "Partial"
     },
     {
      "status": "Compliant"
     }
    ]
   }
  },
  {
   "id": "P7",
   "title": "Confidentiality",
   "weight": 4,
   "critical": false,
   "silent": "risk",
   "ideal": "Mutual, covers PayNest's security docs",
   "accept": "One-way, with a separate NDA",
   "never": "Share security reports with third parties",
   "flags": [
    "service providers on request",
    "publish"
   ],
   "context": [],
   "numeric": null
  },
  {
   "id": "P8",
   "title": "Fees, Invoicing and Payment",
   "weight": 2,
   "critical": false,
   "silent": "risk",
   "ideal": "Pay within 30 days; right to suspend",
   "accept": "Pay within 31–60 days",
   "never": "Over 60 days, or “if satisfied”",
   "flags": [
    "satisfaction of the client",
    "client's satisfaction",
    "withhold payment"
   ],
   "context": [],
   "numeric": {
    "unit": "days (payment)",
    "pattern": "\\(?(\\d+)\\)?\\s*(?:business\\s+)?days",
    "pick": "max",
    "bands": [
     {
      "max": 30,
      "status": "Compliant"
     },
     {
      "max": 60,
      "status": "Partial"
     },
     {
      "status": "Conflicting"
     }
    ]
   }
  },
  {
   "id": "P9",
   "title": "Term and Termination",
   "weight": 2,
   "critical": false,
   "silent": "risk",
   "ideal": "90 days' notice to end for convenience",
   "accept": "30–89 days' notice",
   "never": "Under 30 days, or refunds of fees",
   "flags": [
    "full refund",
    "refund of all fees"
   ],
   "context": [],
   "numeric": {
    "unit": "days' notice (termination for convenience)",
    "pattern": "\\(?(\\d+)\\)?\\s*days\\W*(?:prior\\s+)?(?:written\\s+)?notice",
    "pick": "min",
    "bands": [
     {
      "max": 29,
      "status": "Conflicting"
     },
     {
      "max": 89,
      "status": "Partial"
     },
     {
      "status": "Compliant"
     }
    ]
   }
  },
  {
   "id": "P10",
   "title": "Governing Law and Dispute Resolution",
   "weight": 2,
   "critical": false,
   "silent": "risk",
   "ideal": "Indian law, Bengaluru courts or seat",
   "accept": "Indian law, another Indian city",
   "never": "Foreign law or a foreign seat",
   "flags": [
    "laws of singapore",
    "laws of england",
    "courts of london",
    "new york"
   ],
   "context": [],
   "numeric": null
  }
 ],
 "golden": {
  "carewell": {
   "score": 49,
   "band": "High",
   "labels": {
    "P1": "Conflicting",
    "P2": "Partial",
    "P3": "Conflicting",
    "P4": "Partial",
    "P5": "Compliant",
    "P6": "Partial",
    "P7": "Compliant",
    "P8": "Partial",
    "P9": "Compliant",
    "P10": "Compliant"
   }
  },
  "northstar": {
   "score": 43,
   "band": "Medium",
   "labels": {
    "P1": "Partial",
    "P2": "Compliant",
    "P3": "Partial",
    "P4": "Compliant",
    "P5": "Conflicting",
    "P6": "Compliant",
    "P7": "Conflicting",
    "P8": "Partial",
    "P9": "Partial",
    "P10": "Partial"
   }
  },
  "lexmore": {
   "score": 3,
   "band": "Low",
   "labels": {
    "P1": "Compliant",
    "P2": "Compliant",
    "P3": "Compliant",
    "P4": "Silent (OK)",
    "P5": "Silent (OK)",
    "P6": "Compliant",
    "P7": "Compliant",
    "P8": "Partial",
    "P9": "Compliant",
    "P10": "Compliant"
   }
  },
  "brightretail": {
   "score": 29,
   "band": "High",
   "labels": {
    "P1": "Missing",
    "P2": "Silent (OK)",
    "P3": "Compliant",
    "P4": "Compliant",
    "P5": "Silent (OK)",
    "P6": "Compliant",
    "P7": "Compliant",
    "P8": "Missing",
    "P9": "Partial",
    "P10": "Missing"
   }
  },
  "orbit": {
   "score": 18,
   "band": "Low",
   "labels": {
    "P1": "Compliant",
    "P2": "Partial",
    "P3": "N/A",
    "P4": "N/A",
    "P5": "N/A",
    "P6": "N/A",
    "P7": "Compliant",
    "P8": "Compliant",
    "P9": "Partial",
    "P10": "Compliant"
   }
  }
 },
 "carewellReview": [
  {
   "id": "P1",
   "llm": "Conflicting",
   "final": "Conflicting",
   "expected": "Conflicting",
   "reason": "The clause allows for unlimited liability for data breaches, which conflicts with PayNest's standard of a maximum twenty-four (24) months' Fees super-cap."
  },
  {
   "id": "P2",
   "llm": "Partial",
   "final": "Partial",
   "expected": "Partial",
   "reason": "The indemnity is limited to data breaches caused by PayNest and capped at twice the annual fees, which can be accepted."
  },
  {
   "id": "P3",
   "llm": "Conflicting",
   "final": "Conflicting",
   "expected": "Conflicting",
   "reason": "The clause requires immediate notification, which is not acceptable as it does not provide a defined time window."
  },
  {
   "id": "P4",
   "llm": "Compliant",
   "final": "Partial",
   "expected": "Partial",
   "reason": "The provision offers a service-credit cap that is within PayNest's acceptable range and does not exceed the ideal standard."
  },
  {
   "id": "P5",
   "llm": "Compliant",
   "final": "Compliant",
   "expected": "Compliant",
   "reason": "The provision limits the audit frequency and scope in a manner that aligns with PayNest's standards."
  },
  {
   "id": "P6",
   "llm": "Partial",
   "final": "Partial",
   "expected": "Partial",
   "reason": "The clause allows for a deletion period of up to fifteen days, which is within the acceptable range but not ideal."
  },
  {
   "id": "P7",
   "llm": "Partial",
   "final": "Partial",
   "expected": "Compliant",
   "reason": "The confidentiality obligations are one-way, protecting only the Client's information, which is less favorable than mutual protection."
  },
  {
   "id": "P8",
   "llm": "Partial",
   "final": "Partial",
   "expected": "Partial",
   "reason": "The payment term is within the acceptable range but exceeds the ideal period of 30 days."
  },
  {
   "id": "P9",
   "llm": "Compliant",
   "final": "Compliant",
   "expected": "Compliant",
   "reason": "The provision allows termination for convenience with a period of 90 days, which is compliant with PayNest's standards."
  },
  {
   "id": "P10",
   "llm": "Compliant",
   "final": "Compliant",
   "expected": "Compliant",
   "reason": "The clause is ideal as it specifies Indian law and exclusive jurisdiction in Bengaluru."
  }
 ],
 "carewellScore": 54,
 "results": [
  {
   "id": "carewell",
   "score": 54,
   "band": "High",
   "exact": 9,
   "expected": 49,
   "expectedBand": "High"
  },
  {
   "id": "northstar",
   "score": 37,
   "band": "Medium",
   "exact": 9,
   "expected": 43,
   "expectedBand": "Medium"
  },
  {
   "id": "lexmore",
   "score": 3,
   "band": "Low",
   "exact": 10,
   "expected": 3,
   "expectedBand": "Low"
  },
  {
   "id": "brightretail",
   "score": 54,
   "band": "High",
   "exact": 5,
   "expected": 29,
   "expectedBand": "High"
  },
  {
   "id": "orbit",
   "score": 18,
   "band": "Low",
   "exact": 5,
   "expected": 18,
   "expectedBand": "Low"
  }
 ],
 "scoring": {
  "gap": {
   "Compliant": 0,
   "Partial": 0.5,
   "Conflicting": 1,
   "Missing": 1,
   "Silent (OK)": 0,
   "Needs review": 1
  },
  "excluded": [
   "N/A"
  ],
  "bands": [
   {
    "max": 20,
    "band": "Low"
   },
   {
    "max": 45,
    "band": "Medium"
   },
   {
    "max": 70,
    "band": "High"
   },
   {
    "max": 100,
    "band": "Critical"
   }
  ],
  "floor": {
   "statuses": [
    "Missing",
    "Conflicting"
   ],
   "min_band": "High"
  }
 }
};
window.DATA.carewellChunks = {"pages": 11, "chunks": [{"h": "Cover page, parties and recitals", "p": 1, "n": 1151}, {"h": "Cover page, parties and recitals", "p": 1, "n": 878}, {"h": "1.1 DEFINITIONS AND INTERPRETATION", "p": 2, "n": 1032}, {"h": "1.1 DEFINITIONS AND INTERPRETATION", "p": 2, "n": 1153}, {"h": "1.1 DEFINITIONS AND INTERPRETATION", "p": 2, "n": 441}, {"h": "1.2 DEFINITIONS AND INTERPRETATION", "p": 3, "n": 394}, {"h": "2.1 APPOINTMENT AND TERM", "p": 3, "n": 190}, {"h": "2.2 APPOINTMENT AND TERM", "p": 3, "n": 316}, {"h": "3.1 SERVICES", "p": 3, "n": 383}, {"h": "3.2 SERVICES", "p": 4, "n": 156}, {"h": "3.3 SERVICES", "p": 4, "n": 246}, {"h": "4.1 IMPLEMENTATION", "p": 4, "n": 282}, {"h": "4.2 IMPLEMENTATION", "p": 4, "n": 190}, {"h": "4.3 IMPLEMENTATION", "p": 4, "n": 209}, {"h": "5.1 SERVICE LEVELS", "p": 4, "n": 180}, {"h": "5.2 SERVICE LEVELS", "p": 4, "n": 362}, {"h": "5.3 SERVICE LEVELS", "p": 4, "n": 159}, {"h": "6.1 CLIENT OBLIGATIONS", "p": 4, "n": 188}, {"h": "6.2 CLIENT OBLIGATIONS", "p": 4, "n": 121}, {"h": "6.3 CLIENT OBLIGATIONS", "p": 4, "n": 146}, {"h": "7.1 FEES, INVOICING AND PAYMENT", "p": 4, "n": 139}, {"h": "7.2 FEES, INVOICING AND PAYMENT", "p": 4, "n": 123}, {"h": "7.3 FEES, INVOICING AND PAYMENT", "p": 5, "n": 64}, {"h": "7.4 FEES, INVOICING AND PAYMENT", "p": 5, "n": 251}, {"h": "7.5 FEES, INVOICING AND PAYMENT", "p": 5, "n": 331}, {"h": "8.1 DATA PROTECTION", "p": 5, "n": 157}, {"h": "8.2 DATA PROTECTION", "p": 5, "n": 183}, {"h": "8.3 DATA PROTECTION", "p": 5, "n": 99}, {"h": "8.4 DATA PROTECTION", "p": 5, "n": 189}, {"h": "9 INFORMATION SECURITY AND SECURITY INCIDENTS", "p": 5, "n": 46}, {"h": "9.1 INFORMATION SECURITY AND SECURITY INCIDENTS", "p": 5, "n": 319}, {"h": "9.2 INFORMATION SECURITY AND SECURITY INCIDENTS", "p": 5, "n": 186}, {"h": "9.3 INFORMATION SECURITY AND SECURITY INCIDENTS", "p": 5, "n": 128}, {"h": "9.4 INFORMATION SECURITY AND SECURITY INCIDENTS", "p": 5, "n": 266}, {"h": "10.1 AUDIT", "p": 5, "n": 194}, {"h": "10.2 AUDIT", "p": 5, "n": 249}, {"h": "10.3 AUDIT", "p": 5, "n": 203}, {"h": "11.1 CONFIDENTIALITY", "p": 6, "n": 218}, {"h": "11.2 CONFIDENTIALITY", "p": 6, "n": 285}, {"h": "11.3 CONFIDENTIALITY", "p": 6, "n": 324}, {"h": "11.4 CONFIDENTIALITY", "p": 6, "n": 119}, {"h": "12.1 INTELLECTUAL PROPERTY", "p": 6, "n": 197}, {"h": "12.2 INTELLECTUAL PROPERTY", "p": 6, "n": 237}, {"h": "13.1 WARRANTIES", "p": 6, "n": 176}, {"h": "13.2 WARRANTIES", "p": 6, "n": 190}, {"h": "14.1 INDEMNIFICATION", "p": 6, "n": 219}, {"h": "14.2 INDEMNIFICATION", "p": 6, "n": 221}, {"h": "15.1 LIMITATION OF LIABILITY", "p": 6, "n": 137}, {"h": "15.2 LIMITATION OF LIABILITY", "p": 7, "n": 250}, {"h": "15.3 LIMITATION OF LIABILITY", "p": 7, "n": 165}, {"h": "16.1 The Service Provider shall maintain, with reputable insurers, professional indemnity", "p": 7, "n": 278}, {"h": "17.1 TERM AND TERMINATION", "p": 7, "n": 243}, {"h": "17.2 TERM AND TERMINATION", "p": 7, "n": 121}, {"h": "17.3 TERM AND TERMINATION", "p": 7, "n": 120}, {"h": "17.4 TERM AND TERMINATION", "p": 7, "n": 197}, {"h": "18 CONSEQUENCES OF TERMINATION; RETURN AND DELETION OF CLIENT DATA", "p": 7, "n": 67}, {"h": "18.1 CONSEQUENCES OF TERMINATION; RETURN AND DELETION OF CLIENT DATA", "p": 7, "n": 197}, {"h": "18.2 CONSEQUENCES OF TERMINATION; RETURN AND DELETION OF CLIENT DATA", "p": 7, "n": 177}, {"h": "18.3 CONSEQUENCES OF TERMINATION; RETURN AND DELETION OF CLIENT DATA", "p": 7, "n": 132}, {"h": "19.1 FORCE MAJEURE", "p": 7, "n": 348}, {"h": "20 GOVERNING LAW AND DISPUTE RESOLUTION", "p": 7, "n": 40}, {"h": "20.1 GOVERNING LAW AND DISPUTE RESOLUTION", "p": 8, "n": 92}, {"h": "20.2 GOVERNING LAW AND DISPUTE RESOLUTION", "p": 8, "n": 240}, {"h": "20.3 GOVERNING LAW AND DISPUTE RESOLUTION", "p": 8, "n": 156}, {"h": "21.1 GENERAL", "p": 8, "n": 219}, {"h": "21.2 GENERAL", "p": 8, "n": 207}, {"h": "21.3 GENERAL", "p": 8, "n": 221}, {"h": "21.4 GENERAL", "p": 8, "n": 146}, {"h": "21.5 GENERAL", "p": 8, "n": 153}, {"h": "21.6 GENERAL", "p": 8, "n": 711}, {"h": "Schedule 1 DESCRIPTION OF SERVICES", "p": 9, "n": 1116}, {"h": "Schedule 1 DESCRIPTION OF SERVICES", "p": 9, "n": 481}, {"h": "Schedule 2 FEES", "p": 10, "n": 665}, {"h": "Schedule 3 SERVICE LEVELS AND SERVICE CREDITS", "p": 11, "n": 819}]};
