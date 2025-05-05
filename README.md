# AlgoMatch 📈

AlgoMatch is a TypeScript-based trading algorithm platform that enables users to place orders, view order book depth, and check user balances.
It supports basic trading operations like limit orders for bids and asks and simulates order book matching based on price-time priority.

## Features 🚀

- **Place limit orders (bids and asks)**: Users can place buy (bid) and sell (ask) orders with a specified price and quantity
- **View order book depth**: See the current depth of the order book, showing total quantity at each price level
- **Check user balances**: View balances for the traded stock (GOOGLE) and USD
- **Automatic order matching**: Orders are matched based on price-time priority algorithm

### Order Matching Logic

- Bid orders (buy) are matched with ask orders (sell) at the best available price
- Price-Time Priority:
  - Better prices are matched first (lower ask price or higher bid price)
  - At same price level, older orders are matched first (FIFO)
- Real-time balance updates after trades

## Tech Stack 💻

- **Language**: TypeScript
- **Runtime**: Node.js
- **Framework**: Express.js
- **Testing**: Jest with Supertest
- **Type Safety**: Full TypeScript implementation with interfaces and type checking

## Installation 🛠️

1. Clone the repository:
   ```bash
   git clone https://github.com/Vatscode/AlgoMatch.git
   cd AlgoMatch
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Development 👩‍💻

Run in development mode with auto-reloading:
```bash
npm run dev
```

Build the TypeScript code:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Testing 🧪

Run the test suite:
```bash
npm test
```

Watch mode for development:
```bash
npm run test:watch
```

## API Endpoints 🌐

- `POST /order`: Place a new limit order
- `GET /depth`: Get current order book depth
- `GET /balance/:userId`: Get user balance
- `GET /quote`: Get current quote (TODO)

All endpoints are fully typed with TypeScript interfaces for request/response handling.

## Test Coverage ✅

![CAFD19BF-91F8-466D-ABF7-16F89156FA55](https://github.com/user-attachments/assets/041794a2-a0e0-49b3-916d-823bf76f3200)

## License

ISC


   
