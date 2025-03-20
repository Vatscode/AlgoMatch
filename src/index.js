import express from "express";
import bodyParser from "body-parser";

export const app = express();

app.use(bodyParser({}));

const TICKER = "GOOGLE";

const users = [{ //a basic schema for users
  id: "1",
  balances: {
    "GOOGLE": 10, //defining dummy users objects ans assigning pre defined values to them
    "USD": 50000
  }
}, {
  id: "2",
  balances: {
    "GOOGLE": 10,
    "USD": 50000
  }
}];

const bids = [];
const asks = [];

// Place a limit order
app.post("/order", (req, res) => {
  const side = req.body.side; //big or ask ( in real world you would take the cookie of the info and do some fancy things with it)
  const price = req.body.price;
  const quantity = req.body.quantity;
  const userId = req.body.userId;

  const remainingQty = fillOrders(side, price, quantity, userId);
  //If someone wants to pay more money for a stock than its listed for in the order book, then they wont fill the order book and just
  // lowest amount which matches their request versus if someone wants to buy it for less amount than its listed for in that case
  // the order would go and just in the orderbook.

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
    bids.sort((a, b) => a.price < b.price ? -1 : 1);
  } else {
    asks.push({
      userId,
      price,
      quantity: remainingQty
    });
    asks.sort((a, b) => a.price < b.price ? 1 : -1);
  }

  res.json({
    filledQuantity: quantity - remainingQty,
  });
});

app.get("/depth", (req, res) => {
  const depth = {};

  for (let i = 0; i < bids.length; i++) {
    if (!depth[bids[i].price]) {
      depth[bids[i].price] = {
        quantity: bids[i].quantity,
        type: "bid"
      };
    } else {
      depth[bids[i].price].quantity += bids[i].quantity;
    }
  }

  for (let i = 0; i < asks.length; i++) {
    if (!depth[asks[i].price]) {
      depth[asks[i].price] = {
        quantity: asks[i].quantity,
        type: "ask"
      };
    } else {
      depth[asks[i].price].quantity += asks[i].quantity;
    }
  }

  res.json({
    depth
  });
});

app.get("/balance/:userId", (req, res) => {
  const userId = req.params.userId;
  const user = users.find(x => x.id === userId);
  if (!user) {
    return res.json({
      USD: 0,
      [TICKER]: 0
    });
  }
  res.json({ balances: user.balances });
});

app.get("/quote", (req, res) => {
  // TODO: Assignment
});

function flipBalance(userId1, userId2, quantity, price) {
  let user1 = users.find(x => x.id === userId1);
  let user2 = users.find(x => x.id === userId2);
  if (!user1 || !user2) {
    return;
  }
  user1.balances[TICKER] -= quantity;
  user2.balances[TICKER] += quantity;
  user1.balances["USD"] += (quantity * price);
  user2.balances["USD"] -= (quantity * price);
}

function fillOrders(side, price, quantity, userId) {
  let remainingQuantity = quantity;
  if (side === "bid") {
    for (let i = asks.length - 1; i >= 0; i--) {
      if (asks[i].price > price) {
        continue;
      }
      if (asks[i].quantity > remainingQuantity) {
        asks[i].quantity -= remainingQuantity;
        flipBalance(asks[i].userId, userId, remainingQuantity, asks[i].price);
        return 0;
      } else {
        remainingQuantity -= asks[i].quantity;
        flipBalance(asks[i].userId, userId, asks[i].quantity, asks[i].price);
        asks.pop();
      }
    }
  } else {
    for (let i = bids.length - 1; i >= 0; i--) {
      if (bids[i].price < price) {
        continue;
      }
      if (bids[i].quantity > remainingQuantity) {
        bids[i].quantity -= remainingQuantity;
        flipBalance(userId, bids[i].userId, remainingQuantity, price);
        return 0;
      } else {
        remainingQuantity -= bids[i].quantity;
        flipBalance(userId, bids[i].userId, bids[i].quantity, price);
        bids.pop();
      }
    }
  }

  return remainingQuantity;
}
