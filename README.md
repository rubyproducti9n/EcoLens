# CarbonLens 🌿

## Chosen Vertical
Personal Carbon Footprint Tracker

## Approach and Logic
CarbonLens helps users understand, log, and reduce their lifestyle emissions through an integrated interactive pipeline. The flow begins with a multi-step lifestyle calculator that computes the user's annual carbon footprint across key lifestyle categories. Results are immediately analyzed in the insights dashboard, which visualizes the footprint breakdown against global baselines and feeds into a historical monthly progress tracker to maintain streak awareness and reduction rates.

## How the Solution Works
- **Calculator**: 4-step form computing annual CO₂e using IPCC-aligned emission coefficients
- **Insights**: Personalized analysis comparing user data to global averages with actionable recommendations  
- **Tracker**: Month-by-month SVG line chart with streak tracking and reduction percentage
- **Tips Library**: 12 filterable action cards with estimated annual savings per action

## Assumptions
- Emission coefficients based on global averages (IPCC AR6 reference values)
- All data stored client-side in localStorage (no server, no tracking)
- Target user: individuals in developed economies, annual average ~4,800 kg CO₂e baseline

## Tech Stack
Pure HTML5, CSS3, Vanilla JS — zero dependencies, zero build tools

## Testing
Run the test suite locally with:
```bash
node tests.js
```
Tests cover: transport/energy/food/shopping emission calculations, sustainability score,
status label thresholds, localStorage safe-parse, and input clamping.
All calculation functions are pure (no side effects) and tested in isolation.

Verify: node tests.js prints all ✅ and exits with code 0.

