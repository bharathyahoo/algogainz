# Product Requirements Document

# AlgoGainz - Smart Trading Assistant

**Progressive Web Application for Zerodha Kite Trading**

---

**Version:** 1.0  
**Date:** November 18, 2025  
**Status:** Ready for Development

---

## 1. Document Information

| Field | Value |
|-------|-------|
| **Document Owner** | Product Owner / Development Team |
| **Target Platform** | Progressive Web Application (PWA) - Mobile & Desktop Web Browsers |
| **Integration** | Zerodha Kite Connect API |
| **Development Tool** | OpenAI Codex Agent / Claude Code |

---

## 2. Executive Summary

AlgoGainz is a Progressive Web Application (PWA) designed to empower short-term traders with intelligent, data-driven trading capabilities. By integrating seamlessly with the Zerodha Kite Connect API, AlgoGainz provides technical analysis, automated recommendations, portfolio management, and comprehensive profit/loss tracking.

The application exclusively tracks trades executed through AlgoGainz or manually recorded by the user, providing focused portfolio management for app-based trading activities. This approach ensures accurate tracking, clear P&L calculations, and personalized trading insights without interference from external transactions.

---

## 3. Product Overview

### 3.1 Product Vision

Create an intelligent, user-friendly trading platform that empowers traders to make data-driven trading decisions, automate their trading strategies, and efficiently manage their short-term trading portfolio with real-time insights and comprehensive analytics. The application exclusively tracks trades executed through this platform, providing focused portfolio management for app-based trading activities.

### 3.2 Key Objectives

1. Enable systematic stock watchlist management with categorization capabilities
2. Provide AI-powered trading recommendations based on technical analysis
3. Facilitate seamless order execution through Zerodha Kite Connect API
4. Support manual recording of external trades for comprehensive portfolio tracking
5. Implement intelligent exit strategies with profit targets and stop-loss mechanisms
6. Deliver comprehensive profit/loss tracking and portfolio analytics
7. Provide flexible reporting capabilities for transaction analysis

---

## 4. Target Users

### 4.1 Primary User Profile

- **User Type:** Active short-term trader
- **Trading Style:** Short-term trading with focus on momentum strategies
- **Platform:** Zerodha Kite account holder
- **Technical Proficiency:** Moderate to advanced understanding of technical indicators
- **Device Usage:** Access from both mobile devices and desktop/laptop browsers

---

## 5. User Stories

- As a trader, I want to create and organize a watchlist of stocks by categories so that I can focus on specific sectors or strategies.
- As a trader, I want to receive buy/sell recommendations based on technical indicators so that I can make informed trading decisions.
- As a trader, I want to execute orders directly from the app after reviewing recommendations so that I can act quickly on opportunities.
- As a trader, I want to manually record buy transactions made outside this app so that I can track all my positions in one place.
- As a trader, I want to set profit targets and stop-loss levels for each stock so that I can automate my exit strategy.
- As a trader, I want to receive alerts when my exit conditions are met so that I can sell at the right time.
- As a trader, I want to manually record sell transactions made outside this app so that I can properly close positions and calculate P&L.
- As a trader, I want to track all my transactions with detailed profit/loss calculations so that I understand my trading performance.
- As a trader, I want to view my overall portfolio performance on a dashboard so that I can assess my cumulative gains or losses.
- As a trader, I want to see only my current holdings from trades made through this app so that I have focused portfolio tracking.
- As a trader, I want to download Excel reports of my transactions with custom filters so that I can analyze my trading patterns.

---

## 6. Functional Requirements

### 6.1 FR1: Watchlist Management

#### 6.1.1 Description
Users can create, manage, and organize a personalized watchlist of stocks they wish to monitor and trade.

#### 6.1.2 Detailed Requirements

- User shall be able to add stocks to the watchlist by entering stock symbol or searching by company name
- User shall be able to create custom categories (e.g., Technology, Banking, Pharmaceuticals, High Momentum)
- User shall be able to assign multiple categories to a single stock
- User shall be able to edit, delete, and rename categories
- User shall be able to remove stocks from the watchlist
- User shall be able to filter and view stocks by category
- System shall display current price, day change, and percentage change for each watchlist stock
- System shall support drag-and-drop reordering of stocks within the watchlist
- Watchlist data shall be persisted locally and synchronized across devices

---

### 6.2 FR2: Technical Analysis and Trading Recommendations

#### 6.2.1 Description
The system shall analyze watchlist stocks using technical indicators and provide actionable buy/sell recommendations based on momentum and trend-following strategies.

#### 6.2.2 Technical Indicators to Implement

- **Moving Averages:** SMA (50, 200), EMA (9, 21)
- **RSI (Relative Strength Index):** 14-period RSI for overbought/oversold conditions
- **MACD (Moving Average Convergence Divergence):** Standard 12,26,9 configuration
- **Volume Analysis:** Compare current volume to average volume
- **Bollinger Bands:** 20-period with 2 standard deviations
- **Support & Resistance Levels:** Dynamic calculation based on recent price action

#### 6.2.3 Recommendation Engine Requirements

- System shall calculate all technical indicators for each watchlist stock using historical data from Kite API
- System shall provide a composite recommendation score (Strong Buy, Buy, Hold, Sell, Strong Sell)
- System shall display individual indicator signals with visual indicators (bullish/bearish)
- User shall be able to customize indicator parameters and weights in the recommendation algorithm
- System shall provide a detailed explanation for each recommendation
- System shall highlight stocks with strong buy signals at the top of the watchlist
- System shall refresh recommendations automatically at configurable intervals (default: every 15 minutes during market hours)

---

### 6.3 FR3: Order Placement and Execution

#### 6.3.1 Description
Users can review recommendations and place buy orders directly through the Zerodha Kite Connect API after explicit confirmation.

#### 6.3.2 Detailed Requirements

- User shall review stock details, current price, and recommendation before placing order
- User shall specify order quantity and order type (Market, Limit)
- For Limit orders, user shall specify the limit price
- System shall display estimated total order value including all charges and taxes
- System shall validate available margin/funds before order placement
- User shall explicitly confirm the order through a confirmation dialog
- System shall place the order via Kite Connect API upon confirmation
- System shall display order status (Pending, Complete, Rejected, Cancelled)
- System shall capture order ID, timestamp, executed price, and all transaction charges
- System shall notify user of order execution status

---

### 6.4 FR4: Exit Strategy Management

#### 6.4.1 Description
Users can define profit targets and stop-loss levels for each holding. The system monitors these conditions and alerts the user when criteria are met.

#### 6.4.2 Detailed Requirements

- User shall be able to set exit strategy immediately after order execution or anytime after
- User shall define profit target as a percentage gain (e.g., 5%, 10%)
- User shall define stop-loss as a percentage loss (e.g., 2%, 3%)
- System shall calculate target price and stop-loss price based on buy price and percentages
- User shall be able to modify exit strategy parameters for active holdings
- System shall continuously monitor live prices against exit conditions during market hours
- System shall trigger alert notification when profit target is reached
- System shall trigger alert notification when stop-loss is breached
- Alert shall include stock name, current price, target/stop-loss price, and percentage gain/loss
- User shall be able to enable/disable alerts for specific holdings
- System shall support both browser notifications and in-app alert center

---

### 6.5 FR5: Sell Order Execution

#### 6.5.1 Description
Users can execute sell orders for their holdings directly from the application, triggered either by alerts or manual decision.

#### 6.5.2 Detailed Requirements

- User shall be able to initiate sell order from holdings view or from alert notification
- System shall pre-populate sell order with current holding quantity
- User shall be able to sell partial or full quantity of holdings
- User shall specify order type (Market or Limit) and limit price if applicable
- System shall display projected profit/loss based on buy price and current sell price
- System shall show estimated net proceeds after deducting all charges and taxes
- User shall confirm sell order through confirmation dialog
- System shall place sell order via Kite Connect API
- System shall update holdings and transaction records upon successful execution
- System shall notify user of sell order execution status

---

### 6.6 FR6: Transaction Tracking and P&L Analysis

#### 6.6.1 Description
The system maintains detailed records of all transactions executed through this application, with support for manual recording of external trades. Comprehensive profit/loss calculations are provided for each trade, whether executed through the app or manually recorded.

#### 6.6.2 Scope Clarification

**Important:** This application ONLY tracks transactions made through this app or manually recorded by the user. Trades executed directly through Zerodha Kite (outside this app) will NOT automatically appear unless manually recorded.

#### 6.6.3 Detailed Requirements

**Automatic Transaction Recording (App-Executed Trades):**
- System shall record every buy and sell transaction executed through the app with complete details
- Transaction data automatically captured:
  - Stock symbol and company name
  - Transaction type (Buy/Sell)
  - Date and time of transaction
  - Quantity
  - Price per share
  - Brokerage charges
  - Exchange transaction charges
  - GST
  - SEBI charges
  - Stamp duty
  - Total buy/sell value including all charges
  - Order ID from Kite

**Manual Transaction Recording:**
- System shall provide manual transaction recording functionality for trades executed outside the app
- Manual transaction entry shall include:
  - Transaction type (Buy/Sell)
  - Stock symbol (with search/autocomplete)
  - Date and time of transaction
  - Quantity
  - Price per share
  - Brokerage charges
  - Exchange transaction charges
  - GST
  - SEBI charges
  - Stamp duty
  - Optional: Order ID reference from Kite
- System shall calculate total transaction value automatically based on entered charges
- User shall be able to edit or delete manually recorded transactions
- System shall clearly mark transactions as 'App-Executed' or 'Manually Recorded'

**P&L Calculations:**
- System shall recalculate profit/loss for each closed position when manual transactions are recorded
- System shall match buy-sell pairs automatically using FIFO (First In First Out) method
- System shall display transaction history for each stock showing all buys and sells
- System shall provide stock-wise P&L summary showing total profit/loss per stock
- System shall calculate return percentage for each trade
- System shall highlight profitable trades in green and loss-making trades in red

---

### 6.7 FR7: Portfolio Dashboard

#### 6.7.1 Description
A comprehensive dashboard providing an overview of the user's overall trading performance and key metrics.

#### 6.7.2 Detailed Requirements

**Dashboard shall display the following key metrics:**
- Total Invested Amount (sum of all buy transactions)
- Current Portfolio Value (for active holdings)
- Realized P&L (from closed positions)
- Unrealized P&L (from open positions)
- Total P&L (Realized + Unrealized)
- Overall Return Percentage
- Number of Trades Executed
- Win Rate (profitable trades / total trades)
- Average Profit per Trade
- Largest Gain
- Largest Loss

**Additional Dashboard Features:**
- Dashboard shall include visual charts for P&L trends over time
- Dashboard shall show sector-wise allocation of current holdings
- Dashboard shall display top performing and worst performing stocks
- Dashboard shall be updated in real-time during market hours
- User shall be able to toggle between daily, weekly, monthly, and all-time views

---

### 6.8 FR8: Holdings Management

#### 6.8.1 Description
Display current holdings based exclusively on transactions executed through this application or manually recorded. Real-time valuations are automatically updated based on buy/sell activity tracked within the app.

#### 6.8.2 Scope Clarification

**Critical:** Holdings displayed are ONLY from trades made through this application or manually recorded. Trades executed directly through Zerodha Kite will NOT appear in holdings unless manually recorded.

A prominent info banner shall be displayed on the Holdings page: *"Holdings shown here include only trades made through this app or manually recorded. Direct Zerodha Kite trades are not tracked."*

#### 6.8.3 Detailed Requirements

**Holdings view shall display:**
- Stock symbol and company name
- Quantity held
- Average buy price (calculated from all buy transactions in the app)
- Current market price (live)
- Current value of holding
- Total invested amount
- Unrealized profit/loss (in rupees and percentage)
- Day's change (price and percentage)
- Exit strategy parameters (profit target and stop-loss levels)
- Transaction source indicator (App-Executed or Manually Recorded)

**Holdings Management:**
- System shall update holdings automatically when buy orders are executed through the app
- System shall update holdings when manual buy transactions are recorded
- System shall reduce/remove holdings when sell orders are executed through the app
- System shall reduce/remove holdings when manual sell transactions are recorded
- System shall handle partial sells by adjusting quantity while recalculating average buy price if needed
- System shall fetch live prices for all holdings during market hours
- User shall be able to sort holdings by various parameters (name, P&L, percentage change)
- User shall be able to drill down into individual holdings to view complete transaction history
- Holdings shall be refreshed every 1 minute during market hours

---

### 6.9 FR9: Transaction Reporting and Export

#### 6.9.1 Description
Users can generate and download comprehensive Excel reports of all transactions with customizable filters.

#### 6.9.2 Detailed Requirements

**Report generation shall support the following filters:**
- Date range (From date - To date)
- Transaction type (Buy, Sell, or All)
- Stock symbol (specific stock or all stocks)
- Category (if stock belongs to specific watchlist category)

**Excel report shall contain the following columns:**
- Date & Time
- Stock Symbol
- Company Name
- Transaction Type
- Quantity
- Price Per Share
- Gross Amount
- Brokerage
- Exchange Charges
- GST
- SEBI Charges
- Stamp Duty
- Total Charges
- Net Amount
- Order ID
- Transaction Source (App-Executed / Manually Recorded)
- P&L (for closed positions)

**Report Features:**
- Report shall include a summary sheet with aggregated statistics
- Excel file shall be properly formatted with headers, borders, and cell formatting
- File name shall include date range and timestamp of generation
- System shall provide download link immediately after report generation

---

## 7. Technical Requirements

### 7.1 Technology Stack

| Component | Technology |
|-----------|-----------|
| **Frontend Framework** | React.js or Vue.js with TypeScript |
| **PWA Framework** | Workbox or similar service worker library |
| **State Management** | Redux Toolkit or Zustand |
| **UI Components** | Material-UI or Ant Design (responsive components) |
| **Charts & Graphs** | Recharts or Chart.js for trading visualizations |
| **Backend API** | Node.js with Express.js OR Python with FastAPI |
| **Database** | PostgreSQL or MongoDB for transaction storage |
| **Local Storage** | IndexedDB for offline data caching |
| **Authentication** | OAuth 2.0 for Zerodha Kite authentication |
| **Notifications** | Web Push API for browser notifications |
| **WebSockets** | Socket.io or native WebSocket for real-time price updates |
| **Report Generation** | ExcelJS or SheetJS for Excel file generation |
| **Technical Indicators** | Tulip Indicators or TA-Lib for technical analysis |

### 7.2 Zerodha Kite Connect API Integration

#### 7.2.1 Authentication Flow

1. User initiates login by clicking Connect to Zerodha
2. Application redirects to Kite login page with API key
3. User authenticates with Zerodha credentials
4. Kite redirects back with request token
5. Backend exchanges request token for access token
6. Access token is securely stored and used for subsequent API calls

#### 7.2.2 Required API Endpoints

- **GET /quote:** Fetch live stock prices and basic details
- **GET /instruments:** Retrieve list of tradable instruments
- **GET /historical/{instrument_token}/{interval}:** Fetch historical data for technical analysis
- **POST /orders/regular:** Place buy/sell orders
- **GET /orders:** Retrieve order status and history
- **GET /positions:** Fetch current positions
- **GET /margins:** Check available funds and margins
- **GET /trades:** Retrieve executed trade details
- **WebSocket connection:** Subscribe to live price feeds for watchlist stocks

#### 7.2.3 Rate Limiting Considerations

- Kite Connect API has rate limits that must be respected
- Implement request queuing and throttling mechanism
- Cache frequently accessed data where appropriate
- Use WebSocket for real-time data instead of polling REST API

---

## 8. UI/UX Requirements

### 8.1 Responsive Design

- Application must be fully responsive and work seamlessly on mobile devices (320px+) and desktop browsers
- Mobile-first design approach with touch-optimized interfaces
- Adaptive layouts that reflow content based on screen size
- Support for both portrait and landscape orientations

### 8.2 Navigation Structure

**Primary navigation tabs:**
- Dashboard (Home)
- Watchlist
- Holdings
- Transactions
- Reports

**Additional Navigation:**
- Floating action button (FAB) for quick manual transaction recording, accessible from all screens
- Bottom navigation bar for mobile, sidebar for desktop
- Notification center accessible from all screens

### 8.3 Color Coding and Visual Indicators

- Green for profits, positive changes, and bullish signals
- Red for losses, negative changes, and bearish signals
- Blue/Purple for neutral or informational elements
- Icons and badges for quick status recognition
- Progress bars and charts for visual data representation

### 8.4 PWA Features

- Installable on home screen (Add to Home Screen prompt)
- Offline capability - cached data accessible when offline
- Fast loading with skeleton screens and progressive enhancement
- App-like experience with no browser chrome when launched from home screen
- Background sync for price updates when app is in background
- Push notifications for alerts even when app is closed

### 8.5 Performance Requirements

- Initial load time: < 3 seconds on 4G connection
- Time to Interactive (TTI): < 5 seconds
- Price update latency: < 1 second during market hours
- Smooth 60fps animations and transitions
- Optimized bundle size with code splitting and lazy loading

---

## 9. Security and Compliance

### 9.1 Data Security

- All API communications must use HTTPS/TLS encryption
- Access tokens must be securely stored and never exposed to client-side code
- Implement token refresh mechanism to maintain session security
- User data must be encrypted at rest in the database
- Implement CSRF protection for all state-changing operations

### 9.2 Authentication and Authorization

- Leverage Zerodha OAuth 2.0 for secure authentication
- Session timeout after 30 minutes of inactivity
- Require re-authentication for sensitive operations
- Implement proper logout mechanism that invalidates tokens

### 9.3 Trading Security

- All order placements require explicit user confirmation
- Display clear order summary before execution
- Implement order validation checks (quantity limits, price reasonableness)
- Log all trading activities with audit trail
- Prevent double-submission of orders through UI state management

### 9.4 Compliance

- Application must comply with Zerodha API Terms of Service
- Display appropriate disclaimers about trading risks
- Maintain user consent for data collection and processing
- Implement privacy policy and terms of service

---

## 10. Non-Functional Requirements

### 10.1 Reliability

- System uptime: 99.5% during market hours
- Graceful error handling with user-friendly error messages
- Automatic retry mechanism for failed API calls
- Data persistence across app restarts

### 10.2 Scalability

- Support for monitoring up to 50 stocks in watchlist
- Handle up to 1000 transactions without performance degradation
- Efficient data structures for fast lookups and calculations

### 10.3 Maintainability

- Clean, modular code architecture with separation of concerns
- Comprehensive inline documentation and code comments
- Standardized coding conventions and style guide
- Unit tests for critical business logic components
- Version control with Git and meaningful commit messages

### 10.4 Browser Compatibility

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions, iOS and macOS)
- Edge (last 2 versions)

---

## 11. Development Approach

### 11.1 Using OpenAI Codex Agent or Claude Code

This project is designed to be developed using AI-powered development tools like OpenAI Codex Agent or Claude Code. The following approach is recommended:

**1. Project Setup Phase:**
- Provide this PRD to the AI agent
- Request initial project structure with chosen tech stack
- Set up development environment and dependencies

**2. Feature Development Phase:**
- Develop features iteratively, starting with FR1-FR9 in sequence
- Request specific components and functionality from AI agent
- Test each feature thoroughly before proceeding to the next

**3. Integration Phase:**
- Integrate Zerodha Kite Connect API with AI agent assistance
- Implement technical indicator calculations
- Set up real-time data connections

**4. Testing and Refinement:**
- Conduct end-to-end testing of trading workflows
- Optimize performance with AI agent recommendations
- Address bugs and edge cases

### 11.2 Development Milestones

- **Milestone 1:** Basic PWA setup, authentication, and watchlist management
- **Milestone 2:** Technical analysis engine and recommendation system
- **Milestone 3:** Order placement and execution functionality
- **Milestone 4:** Exit strategy, alerts, and sell functionality
- **Milestone 5:** Transaction tracking and holdings management
- **Milestone 6:** Dashboard, reporting, and polish

---

## 12. Success Metrics

- User completes full buy-sell cycle successfully through the application
- Recommendation accuracy leads to positive trading outcomes
- Exit alerts trigger within 1 second of target price reached
- All transactions accurately tracked with correct P&L calculations
- Application loads within 3 seconds on 4G connection
- Zero security breaches or data leaks
- User can seamlessly switch between mobile and desktop without data loss
- Excel reports generated accurately with all requested filters working

---

## 13. Future Enhancements (Out of Scope for V1)

- Automated trading (auto-execute buy/sell without manual confirmation)
- Advanced charting capabilities with drawing tools
- Backtesting functionality for trading strategies
- Integration with other brokers beyond Zerodha
- Social trading features (share strategies with other users)
- Machine learning-based predictive models
- Tax loss harvesting recommendations
- Voice commands and AI assistant

---

## 14. Assumptions and Constraints

### 14.1 Assumptions

- User has an active Zerodha Kite trading account
- User will obtain Kite Connect API credentials from Zerodha
- User has sufficient funds in their Zerodha account to place trades
- User has stable internet connection for real-time trading
- User understands basic stock trading concepts and technical indicators
- User understands that only trades made through this app or manually recorded will be tracked

### 14.2 Constraints

- Application depends on Zerodha Kite Connect API availability and uptime
- API rate limits imposed by Zerodha must be respected
- Trading is limited to market hours defined by NSE/BSE
- Historical data availability is subject to Kite API limitations
- Application is for personal use only and not intended as a commercial service

---

## 15. Document Approval

| Role | Name | Date |
|------|------|------|
| **Product Owner** | | |
| **Technical Lead** | | |

---

## 16. Appendix

### 16.1 Glossary

- **PWA (Progressive Web Application):** Web application that uses modern web capabilities to deliver an app-like experience
- **Kite Connect:** Zerodha's trading APIs that enable third-party applications to execute trades
- **Technical Indicator:** Mathematical calculation based on historical price and volume data
- **Stop Loss:** Predetermined price level at which a position will be automatically sold to limit losses
- **P&L (Profit & Loss):** Financial gain or loss from trading activities
- **WebSocket:** Communication protocol providing full-duplex communication channels for real-time data

### 16.2 References

- Zerodha Kite Connect API Documentation: https://kite.trade/docs/connect/v3/
- Progressive Web Apps (MDN): https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
- Technical Analysis Library: https://github.com/TulipCharts/tulipindicators
- Web Push Notifications: https://web.dev/push-notifications/

---

**End of Document**

---

*Document Version: 1.0*  
*Last Updated: November 18, 2025*  
*Status: Ready for Development ✅*
