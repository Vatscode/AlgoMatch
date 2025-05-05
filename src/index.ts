import express, { Request, Response, Router, RequestHandler } from "express";
import bodyParser from "body-parser";

const app = express();
const router = Router();

app.use(bodyParser.json());
app.use(router);

interface Balances {
  [key: string]: number;
}

interface User {
  id: string;
  balances: Balances;
}

interface Order {
  userId: string;
  price: number;
  quantity: number;
}

interface OrderRequest {
  side: "bid" | "ask";
  price: number;
  quantity: number;
  userId: string;
  type?: string;
}

interface DepthEntry {
  type: "bid" | "ask";
  quantity: number;
}

interface Depth {
  [price: string]: DepthEntry;
}

const TICKER = "GOOGLE";

const users: User[] = [{
  id: "1",
  balances: {
    "GOOGLE": 10,
    "USD": 50000
  }
}, {
  id: "2",
  balances: {
    "GOOGLE": 10,
    "USD": 50000
  }
}];

const bids: Order[] = [];
const asks: Order[] = [];

// Place a limit order
const placeOrder: RequestHandler = (req, res) => {
  const { side, price, quantity, userId } = req.body as OrderRequest;

  if (!side || !price || !quantity || !userId) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const remainingQty = fillOrders(side, price, quantity, userId);

  if (remainingQty === 0) {
    res.json({ filledQuantity: quantity });
    return;
  }

  if (side === "bid") {
    bids.push({
      userId,
      price,
      quantity: remainingQty
    });
    bids.sort((a, b) => b.price - a.price); // Sort bids in descending order (highest first)
  } else {
    asks.push({
      userId,
      price,
      quantity: remainingQty
    });
    asks.sort((a, b) => a.price - b.price); // Sort asks in ascending order (lowest first)
  }

  res.json({
    filledQuantity: quantity - remainingQty,
  });
};

const getDepth: RequestHandler = (_req, res) => {
  const depth: Depth = {};

  for (const bid of bids) {
    const priceStr = bid.price.toString();
    if (!depth[priceStr]) {
      depth[priceStr] = {
        quantity: bid.quantity,
        type: "bid"
      };
    } else {
      depth[priceStr].quantity += bid.quantity;
    }
  }

  for (const ask of asks) {
    const priceStr = ask.price.toString();
    if (!depth[priceStr]) {
      depth[priceStr] = {
        quantity: ask.quantity,
        type: "ask"
      };
    } else {
      depth[priceStr].quantity += ask.quantity;
    }
  }

  res.json({ depth });
};

const getBalance: RequestHandler = (req, res) => {
  const userId = req.params.userId;
  const user = users.find(x => x.id === userId);
  if (!user) {
    res.status(404).json({
      message: "User not found",
      USD: 0,
      [TICKER]: 0
    });
    return;
  }
  res.json({ balances: user.balances });
};

const getQuote: RequestHandler = (_req, res) => {
  // TODO: Assignment
  res.status(501).json({ message: "Not implemented" });
};

router.post("/order", placeOrder);
router.get("/depth", getDepth);
router.get("/balance/:userId", getBalance);
router.get("/quote", getQuote);

function flipBalance(userId1: string, userId2: string, quantity: number, price: number): void {
  const user1 = users.find(x => x.id === userId1);
  const user2 = users.find(x => x.id === userId2);
  
  if (!user1 || !user2) {
    return;
  }

  // Check if users have sufficient balances
  if (user1.balances[TICKER] < quantity || user2.balances["USD"] < quantity * price) {
    return;
  }

  user1.balances[TICKER] -= quantity;
  user2.balances[TICKER] += quantity;
  user1.balances["USD"] += (quantity * price);
  user2.balances["USD"] -= (quantity * price);
}

function fillOrders(side: "bid" | "ask", price: number, quantity: number, userId: string): number {
  let remainingQuantity = quantity;

  if (side === "bid") {
    for (let i = 0; i < asks.length && remainingQuantity > 0; i++) {
      if (asks[i].price > price) {
        continue;
      }
      if (asks[i].quantity > remainingQuantity) {
        asks[i].quantity -= remainingQuantity;
        flipBalance(asks[i].userId, userId, remainingQuantity, asks[i].price);
        remainingQuantity = 0;
        break;
      } else {
        const fillQty = asks[i].quantity;
        remainingQuantity -= fillQty;
        flipBalance(asks[i].userId, userId, fillQty, asks[i].price);
        asks.splice(i, 1);
        i--;
      }
    }
  } else {
    for (let i = 0; i < bids.length && remainingQuantity > 0; i++) {
      if (bids[i].price < price) {
        continue;
      }
      if (bids[i].quantity > remainingQuantity) {
        bids[i].quantity -= remainingQuantity;
        flipBalance(userId, bids[i].userId, remainingQuantity, bids[i].price);
        remainingQuantity = 0;
        break;
      } else {
        const fillQty = bids[i].quantity;
        remainingQuantity -= fillQty;
        flipBalance(userId, bids[i].userId, fillQty, bids[i].price);
        bids.splice(i, 1);
        i--;
      }
    }
  }

  return remainingQuantity;
}

// Start the server if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export { app, TICKER }; 