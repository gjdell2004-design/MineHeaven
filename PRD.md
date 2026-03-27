# GoMining Portfolio Tracker - PRD

## Original Problem Statement
A GoMining portfolio tracker that tracks the daily payout of a NFT miner with whatever TH and wattage the client enters. A BTC tracker and GoMining token tracker in the top left. A full spreadsheet on a separate tab with the daily payout. Trackers for total invested and total profit. And modifiable tabs that the user can create to track certain things.

## User Choices
- Miner count: Fleet overview
- Payout log: Auto-calculated
- Custom tabs usage: Expenses & costs, Other crypto holdings, Custom spreadsheets, Notes & milestones
- Price display: Live ticker style
- Price data source: CoinGecko API (free tier)
- Mining calculation: GoMining formula with default fees
- Data persistence: localStorage
- Theme: Terminal/crypto-style dark theme

## Architecture

### Backend (FastAPI)
- `/api/prices` - Fetch BTC and GoMining (gmt-token) prices from CoinGecko
- `/api/price/{coin_id}` - Fetch single coin price
- `/api/calculate-payout` - Calculate mining payout using GoMining formula

### Frontend (React)
- Terminal/crypto dark theme with neon green (#00FF41) accents
- Components: Header, FleetOverview, PayoutLog, CustomTabs, InvestmentTracker
- localStorage persistence for all user data

### Mining Calculation Formula
```
Net BTC Reward = Daily BTC Reward - Electricity Fees - Service Fees
- Network hashrate: ~700 EH/s
- Block reward: 3.125 BTC (post-2024 halving)
- Default electricity: $0.05/kWh
- Default service fee: 10%
```

## User Personas
1. **Casual Miner**: Owns 1-5 NFT miners, wants simple daily tracking
2. **Fleet Manager**: Owns 10+ miners, needs detailed expense tracking
3. **Investor**: Tracks ROI and break-even timeline

## Core Requirements (Static)
- [x] Live BTC and GoMining token price tickers
- [x] Fleet overview with miner management
- [x] Mining payout calculator
- [x] Daily payout log with spreadsheet view
- [x] Investment and profit trackers
- [x] Custom tabs (Expenses, Holdings, Spreadsheets, Notes)
- [x] Data persistence in localStorage
- [x] CSV export for payout log
- [x] Terminal/crypto dark theme

## What's Been Implemented (v1.0 - March 2026)
1. Live price tickers for BTC and GoMining token via CoinGecko
2. Fleet Overview with add/edit/delete miners
3. Mining payout calculation using GoMining formula
4. Payout Log with CSV export
5. Custom Tabs: Expenses, Holdings, Notes, Spreadsheet
6. Investment tracker with ROI and break-even calculation
7. localStorage persistence for all data
8. Terminal/crypto dark theme with neon accents

## Prioritized Backlog

### P0 (Critical)
- ✅ All P0 features implemented

### P1 (High Priority)
- Historical price chart for BTC/GMT
- Auto-payout logging based on calculation
- Multiple miner profiles/groups

### P2 (Nice to Have)
- Dark/light theme toggle
- Mobile responsive improvements
- Notification when price hits threshold
- Integration with GoMining API (if available)

## Next Tasks
1. Add historical price chart visualization
2. Implement auto-payout logging from estimated values
3. Add miner grouping/tagging feature
4. Mobile-first responsive redesign
