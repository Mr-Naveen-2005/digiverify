# Sample data (SYNTHETIC DEMO ONLY)

This folder is reserved for **synthetic** demo documents and photos used to
exercise the DigiVerify pipeline during SIH evaluation. **Do not place real
identity documents in this folder.**

The provided scaffolding intentionally does not ship binary sample files; the
team should generate synthetic samples (e.g. with a generator script) before
the demo. Synthetic data should:

- Not contain real Aadhaar, passport, voter ID, or any government-issued
  identifier.
- Use clearly fictional names, addresses, and document numbers.
- Be clearly labelled "SYNTHETIC DEMO DATA" on the visual.

Example synthetic fields you can put on a generated PNG/PDF:

```
Name: Aarav Demo
DOB: 14-08-2002
Document No: DV-0001
Gender: Male
Address: 12 Sample Lane, Test City
```

The verification type select on the front-end starts at
"General Identity Verification" by default.
