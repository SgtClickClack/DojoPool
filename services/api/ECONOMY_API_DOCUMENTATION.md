# DojoCoin Economy API Documentation

## Overview

The DojoCoin Economy API provides a comprehensive system for managing in-game currency transactions, purchases, and transfers within the DojoPool platform. It supports atomic transactions, secure balance management, and integration with external payment providers.

## Base URL

```
/api/v1/economy
```

## Authentication

All endpoints require JWT authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Data Models

### DojoCoin Balance

```typescript
interface DojoCoinBalance {
  userId: string;
  balance: number; // Current DojoCoin balance
  lastUpdated: Date; // Last balance update timestamp
}
```

### Transaction

```typescript
interface Transaction {
  id: string;
  userId: string;
  amount: number; // Positive for credits, negative for debits
  currency: string; // Always "DOJO"
  type: TxType; // Transaction type
  metadata: Record<string, any>; // Additional transaction data
  createdAt: Date;
}

enum TxType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
  PURCHASE = 'PURCHASE',
  PRIZE = 'PRIZE',
  FEE = 'FEE',
}
```

### Purchase Request

```typescript
interface PurchaseRequest {
  amount: number; // Amount of DojoCoins to purchase
  paymentMethod: string; // Payment method (e.g., 'stripe', 'paypal')
  paymentToken?: string; // Optional payment token
}
```

### Purchase Response

```typescript
interface PurchaseResponse {
  transactionId: string;
  amount: number;
  newBalance: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}
```

## Endpoints

### 1. Get Balance

Get the current DojoCoin balance for the authenticated user.

**Endpoint:** `GET /api/v1/economy/balance`

**Response:**

```json
{
  "userId": "user-123",
  "balance": 1500,
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing authentication
- `404 Not Found` - User not found

### 2. Purchase DojoCoins

Process a DojoCoin purchase transaction.

**Endpoint:** `POST /api/v1/economy/purchase`

**Request Body:**

```json
{
  "amount": 100,
  "paymentMethod": "stripe",
  "paymentToken": "tok_1234567890"
}
```

**Response:**

```json
{
  "transactionId": "txn-123",
  "amount": 100,
  "newBalance": 1600,
  "status": "COMPLETED"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid amount or missing payment method
- `401 Unauthorized` - Invalid authentication
- `404 Not Found` - User not found
- `500 Internal Server Error` - Payment processing failed

### 3. Get Transaction History

Retrieve the transaction history for the authenticated user.

**Endpoint:** `GET /api/v1/economy/transactions`

**Query Parameters:**

- `limit` (optional): Number of transactions to return (default: 50, max: 100)
- `offset` (optional): Number of transactions to skip (default: 0)

**Response:**

```json
[
  {
    "id": "txn-123",
    "userId": "user-123",
    "amount": 100,
    "currency": "DOJO",
    "type": "PURCHASE",
    "metadata": {
      "paymentMethod": "stripe",
      "reason": "In-app purchase"
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

**Error Responses:**

- `401 Unauthorized` - Invalid authentication

### 4. Transfer DojoCoins

Transfer DojoCoins to another user.

**Endpoint:** `POST /api/v1/economy/transfer/:toUserId`

**Path Parameters:**

- `toUserId`: ID of the recipient user

**Request Body:**

```json
{
  "amount": 50,
  "reason": "Gift from friend"
}
```

**Response:**

```json
{
  "fromTransaction": {
    "id": "txn-debit-123",
    "userId": "user-123",
    "amount": -50,
    "currency": "DOJO",
    "type": "DEBIT",
    "metadata": {
      "reason": "Gift from friend",
      "transferTo": "user-456"
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "toTransaction": {
    "id": "txn-credit-456",
    "userId": "user-456",
    "amount": 50,
    "currency": "DOJO",
    "type": "CREDIT",
    "metadata": {
      "reason": "Gift from friend",
      "transferFrom": "user-123"
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid amount, missing reason, or attempting to transfer to self
- `401 Unauthorized` - Invalid authentication
- `404 Not Found` - Sender or recipient not found
- `402 Payment Required` - Insufficient balance

## Business Logic

### Transaction Types

- **CREDIT**: Adding DojoCoins to user account (purchases, rewards, transfers received)
- **DEBIT**: Removing DojoCoins from user account (purchases made, transfers sent)
- **PURCHASE**: External payment for DojoCoins
- **PRIZE**: Tournament winnings or special rewards
- **FEE**: Platform fees or penalties

### Atomic Transactions

All balance modifications are performed using database transactions to ensure:

- Balance consistency
- Transaction integrity
- Rollback on failures

### Balance Validation

- Debits require sufficient balance
- Credits can increase balance without limits
- Zero or negative amounts are rejected

### Security Considerations

- All endpoints require authentication
- Transactions are logged with full metadata
- Balance checks prevent overdrafts
- Payment tokens are validated before processing

## Integration Examples

### Frontend Integration

```typescript
// Get user balance
const balance = await economyService.getBalance();

// Purchase DojoCoins
const purchaseResult = await economyService.purchaseDojoCoins({
  amount: 100,
  paymentMethod: 'stripe',
  paymentToken: paymentToken,
});

// Get transaction history
const transactions = await economyService.getTransactionHistory(20, 0);

// Transfer coins
const transferResult = await economyService.transferCoins(
  'recipient-user-id',
  50,
  'Birthday gift'
);
```

### Payment Provider Integration

The API is designed to integrate with external payment providers:

```typescript
// Example Stripe integration
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function processStripePayment(amount: number, token: string) {
  const charge = await stripe.charges.create({
    amount: amount * 100, // Convert to cents
    currency: 'usd',
    source: token,
    description: 'DojoCoin Purchase',
  });

  // Process the purchase in our system
  const result = await economyService.processPurchase({
    userId: userId,
    amount: amount,
    paymentMethod: 'stripe',
    paymentToken: token,
  });

  return result;
}
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "statusCode": 400,
  "message": "Purchase amount must be positive",
  "error": "Bad Request"
}
```

## Rate Limiting

Consider implementing rate limiting for:

- Balance checks (100 requests/minute)
- Purchases (10 requests/minute)
- Transfers (20 requests/minute)

## Monitoring

Key metrics to monitor:

- Transaction volume and success rates
- Balance consistency checks
- Payment processing latency
- Failed transaction rates
- User balance distribution

## Future Enhancements

- **Webhooks**: Payment provider webhook handling
- **Refunds**: DojoCoin refund processing
- **Subscriptions**: Recurring DojoCoin purchases
- **Multi-currency**: Support for different currencies
- **Bulk operations**: Batch transaction processing
- **Analytics**: Transaction analytics and reporting
