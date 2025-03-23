// Import required dependencies
const express = require("express");
const bodyParser = require("body-parser");

// Initialize Express app and middleware
const app = express();
app.use(bodyParser.json());

// Define the trading symbol/ticker
const TICKER = "GOOGLE";

// Mock database of users with their balances
// Each user has a balance in both USD and the ticker (GOOGLE)
const users = [
  {
    id: "1",
    balances: {
      [TICKER]: 10,  // 10 shares of GOOGLE
      USD: 50000,    // $50,000 USD
    },
  },
  {
    id: "2",
    balances: {
      [TICKER]: 10,
      USD: 50000,
    },
  },
];

// Order books to store pending orders
const bids = [];  // Array to store buy orders
const asks = [];  // Array to store sell orders

// POST endpoint to place new orders
app.post("/order", (req, res) => {
  const { side, price, quantity, userId } = req.body;
  // Validate that all required fields are present
  if (!side || !price || !quantity || !userId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Try to fill the order immediately against existing orders
  const remainingQty = fillOrders(side, price, quantity, userId);

  // If order was completely filled, return the filled quantity
  if (remainingQty === 0) {
    return res.json({ filledQuantity: quantity });
  }

  // If order was partially filled or not filled at all, add remaining quantity to order book
  if (side === "bid") {
    bids.push({ userId, price, quantity: remainingQty });
    bids.sort((a, b) => b.price - a.price); // Sort bids in descending order of price (highest first)
  } else {
    asks.push({ userId, price, quantity: remainingQty });
    asks.sort((a, b) => a.price - b.price); // Sort asks in ascending order of price (lowest first)
  }

  // Return how much of the order was filled
  res.json({ filledQuantity: quantity - remainingQty });
});

// GET endpoint to retrieve the order book depth
app.get("/depth", (req, res) => {
  const depth = {};

  // Aggregate bid quantities at each price level
  for (const bid of bids) {
    depth[bid.price] = depth[bid.price] || { quantity: 0, type: "bid" };
    depth[bid.price].quantity += bid.quantity;
  }

  // Aggregate ask quantities at each price level
  for (const ask of asks) {
    depth[ask.price] = depth[ask.price] || { quantity: 0, type: "ask" };
    depth[ask.price].quantity += ask.quantity;
  }

  res.json({ depth });
});

// GET endpoint to retrieve a user's balance
app.get("/balance/:userId", (req, res) => {
  const user = users.find((x) => x.id === req.params.userId);
  if (!user) {
    return res.status(404).json({ message: "User not found", USD: 0, [TICKER]: 0 });
  }
  res.json({ balances: user.balances });
});

// Helper function to transfer assets between users after a trade
function flipBalance(userId1, userId2, quantity, price) {
  let user1 = users.find((x) => x.id === userId1);
  let user2 = users.find((x) => x.id === userId2);
  if (!user1 || !user2) return;

  // Check if users have sufficient balances
  if (user1.balances[TICKER] < quantity || user2.balances["USD"] < quantity * price) {
    return;
  }

  // Transfer the assets:
  // - TICKER (shares) goes from user1 to user2
  // - USD goes from user2 to user1
  user1.balances[TICKER] -= quantity;
  user2.balances[TICKER] += quantity;
  user1.balances["USD"] += quantity * price;
  user2.balances["USD"] -= quantity * price;
}

// Main order matching function
function fillOrders(side, price, quantity, userId) {
  let remainingQuantity = quantity;  // Track how much of the order is still unfilled

  if (side === "bid") {  // Handle incoming buy orders
    for (let i = 0; i < asks.length && remainingQuantity > 0; i++) {
      // Skip any ask orders with prices higher than what the buyer is willing to pay
      if (asks[i].price > price) continue;

      // Case 1: Current ask order has more quantity than we need
      if (asks[i].quantity > remainingQuantity) {
        asks[i].quantity -= remainingQuantity;  // Reduce the ask order's quantity
        // Transfer assets between users at the ask price (seller's price)
        flipBalance(asks[i].userId, userId, remainingQuantity, asks[i].price);
        remainingQuantity = 0;  // Order is fully filled
        break;  // Exit loop since we're done
      } 
      // Case 2: Current ask order will be completely consumed
      else {
        const fillQty = asks[i].quantity;  // Store quantity before removing order
        remainingQuantity -= fillQty;  // Reduce remaining quantity to fill
        // Transfer assets between users at the ask price
        flipBalance(asks[i].userId, userId, fillQty, asks[i].price);
        asks.splice(i, 1);  // Remove the fully filled ask order
        i--;  // Move index back one since we removed an element
      }
    }
  } else {  // Handle incoming sell orders
    for (let i = 0; i < bids.length && remainingQuantity > 0; i++) {
      // Skip any bid orders with prices lower than what the seller wants
      if (bids[i].price < price) continue;

      // Case 1: Current bid order has more quantity than we're selling
      if (bids[i].quantity > remainingQuantity) {
        bids[i].quantity -= remainingQuantity;  // Reduce the bid order's quantity
        // Transfer assets between users at the bid price (buyer's price)
        flipBalance(userId, bids[i].userId, remainingQuantity, bids[i].price);
        remainingQuantity = 0;  // Order is fully filled
        break;  // Exit loop since we're done
      } 
      // Case 2: Current bid order will be completely consumed
      else {
        const fillQty = bids[i].quantity;  // Store quantity before removing order
        remainingQuantity -= fillQty;  // Reduce remaining quantity to fill
        // Transfer assets between users at the bid price
        flipBalance(userId, bids[i].userId, fillQty, bids[i].price);
        bids.splice(i, 1);  // Remove the fully filled bid order
        i--;  // Move index back one since we removed an element
      }
    }
  }
  return remainingQuantity;  // Return unfilled quantity (0 if fully filled)
}

// Export app and TICKER for Jest tests
module.exports = { app, TICKER };

//end of program