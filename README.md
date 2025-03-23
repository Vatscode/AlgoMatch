# AlgoMatch 📈

AlgoMatch is a simple trading algorithm platform that enables users to place orders, view order book depth, and check user balances.
It supports basic trading operations like limit orders for bids and asks and simulates order book matching based on price-time priority.

## Features

- Place limit orders (bids and asks): Users can place buy (bid) and sell (ask) orders with a specified price and quantity.
- View order book depth: The system allows users to view the current depth of the order book, showing the total quantity of orders at each price level.

- Check user balances for a specific stock and USD: Users can check their balances for the traded stock (e.g., Google) and their USD balance.

- Simulate order matching: Orders are matched automatically based on price and quantity.

- Bid orders (buy) are matched with ask orders (sell) at the best available price (lowest for asks, highest for bids).

- Orders are matched using a price-time priority algorithm:

- Orders at better prices are matched first (e.g., lower ask price or higher bid price).

- Orders at the same price level are matched based on the first-in, first-out (FIFO) rule (older orders are matched first).

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Vatscode/AlgoMatch.git
   cd AlgoMatch

2. Install the required dependencies:
   ```bash
   npm install

  3. Running the Project
     ```bash
     npm start

   - This will start the Express server and the trading system will be live! 🚀

# Passes all tests 😊

![CAFD19BF-91F8-466D-ABF7-16F89156FA55](https://github.com/user-attachments/assets/041794a2-a0e0-49b3-916d-823bf76f3200)


   
