# Recurrence Detection Specification

This document outlines the canonical rules for identifying recurring transaction series
within the Transaction Calendar application. Keep this specification up to date whenever
recurrence logic evolves.

## Detection Heuristics

- Group key is a combination of normalised payee, amount sign, and tolerance band:
  - 0–50 → ±0.50
  - 50–500 → ±1%
  - 500+ → ±0.5%
- Minimum 3 occurrences spanning at least 90 days.
- Allow weekday drift to accommodate end-of-month utilities.
- Each `RecurringSeries` records an `explanation` capturing observed dates, gaps, and amount deltas.

## Normalisation Guidelines

- Normalise merchants/payees before grouping (strip punctuation, lower case, collapse whitespace).
- Amounts are compared within tolerance bands to absorb small rounding differences.
- Treat transfers differently by considering direction (`inflow`/`outflow`).

## Future Improvements

Document proposed changes here before implementing them to ensure downstream consumers
are aware of contract updates.
