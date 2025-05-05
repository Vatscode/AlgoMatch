"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TICKER = exports.app = void 0;
const express_1 = __importStar(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const app = (0, express_1.default)();
exports.app = app;
const router = (0, express_1.Router)();
app.use(body_parser_1.default.json());
app.use(router);
const TICKER = "GOOGLE";
exports.TICKER = TICKER;
const users = [{
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
const bids = [];
const asks = [];
// Place a limit order
const placeOrder = (req, res) => {
    const { side, price, quantity, userId } = req.body;
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
    }
    else {
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
const getDepth = (_req, res) => {
    const depth = {};
    for (const bid of bids) {
        const priceStr = bid.price.toString();
        if (!depth[priceStr]) {
            depth[priceStr] = {
                quantity: bid.quantity,
                type: "bid"
            };
        }
        else {
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
        }
        else {
            depth[priceStr].quantity += ask.quantity;
        }
    }
    res.json({ depth });
};
const getBalance = (req, res) => {
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
const getQuote = (_req, res) => {
    // TODO: Assignment
    res.status(501).json({ message: "Not implemented" });
};
router.post("/order", placeOrder);
router.get("/depth", getDepth);
router.get("/balance/:userId", getBalance);
router.get("/quote", getQuote);
function flipBalance(userId1, userId2, quantity, price) {
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
            }
            else {
                const fillQty = asks[i].quantity;
                remainingQuantity -= fillQty;
                flipBalance(asks[i].userId, userId, fillQty, asks[i].price);
                asks.splice(i, 1); // Remove the filled order
            }
        }
    }
    else {
        for (let i = bids.length - 1; i >= 0; i--) {
            if (bids[i].price < price) {
                continue;
            }
            if (bids[i].quantity > remainingQuantity) {
                bids[i].quantity -= remainingQuantity;
                flipBalance(userId, bids[i].userId, remainingQuantity, price);
                return 0;
            }
            else {
                const fillQty = bids[i].quantity;
                remainingQuantity -= fillQty;
                flipBalance(userId, bids[i].userId, fillQty, price);
                bids.splice(i, 1); // Remove the filled order
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
//# sourceMappingURL=index.js.map