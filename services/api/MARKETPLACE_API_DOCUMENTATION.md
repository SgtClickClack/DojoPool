# Clan Marketplace & Social Trading API Documentation

## Overview

The Clan Marketplace and Social Trading system enables players to trade assets and DojoCoins within clans and between individual players. This system includes secure P2P trading, clan wallet management, and marketplace functionality.

## Architecture

### Components

- **TradingService**: Handles P2P trade proposals, validation, and execution
- **MarketplaceService**: Manages marketplace listings, clan wallets, and transactions
- **TradingController**: REST API endpoints for trading operations
- **MarketplaceController**: REST API endpoints for marketplace and wallet operations

### Security Features

- Asset ownership validation
- DojoCoin balance verification
- Atomic transactions with rollback on failure
- Role-based permissions for clan wallet operations
- Fraud prevention through trade expiration and validation

## API Endpoints

### Trading Endpoints

#### POST `/api/v1/trading/propose`

Create a new trade proposal between two players.

**Request Body:**

```json
{
  "proposerId": "string",
  "recipientId": "string",
  "proposerItems": [
    {
      "assetId": "string",
      "type": "AVATAR_ASSET" | "DOJO_COINS"
    }
  ],
  "proposerCoins": "number",
  "recipientItems": [
    {
      "assetId": "string",
      "type": "AVATAR_ASSET" | "DOJO_COINS"
    }
  ],
  "recipientCoins": "number",
  "message": "string (optional)",
  "expiresInHours": "number (optional, default: 24)"
}
```

**Response:**

```json
{
  "id": "string",
  "proposerId": "string",
  "recipientId": "string",
  "status": "PENDING",
  "proposerItems": "string (JSON)",
  "proposerCoins": "number",
  "recipientItems": "string (JSON)",
  "recipientCoins": "number",
  "message": "string",
  "expiresAt": "string (ISO date)",
  "createdAt": "string (ISO date)"
}
```

**Error Codes:**

- `400`: Invalid proposal data, insufficient funds, or asset ownership issues
- `404`: User not found
- `500`: Internal server error

#### POST `/api/v1/trading/respond`

Accept or reject a trade proposal.

**Request Body:**

```json
{
  "tradeId": "string",
  "userId": "string",
  "accept": "boolean"
}
```

**Response:**

```json
{
  "id": "string",
  "status": "ACCEPTED" | "REJECTED",
  "respondedAt": "string (ISO date)"
}
```

**Error Codes:**

- `400`: Trade not pending or expired
- `403`: User not authorized to respond
- `404`: Trade not found

#### GET `/api/v1/trading/pending/:userId`

Get pending trades for a user (as proposer or recipient).

**Response:**

```json
[
  {
    "id": "string",
    "proposerId": "string",
    "recipientId": "string",
    "status": "PENDING",
    "proposerItems": "string (JSON)",
    "proposerCoins": "number",
    "recipientItems": "string (JSON)",
    "recipientCoins": "number",
    "message": "string",
    "expiresAt": "string (ISO date)",
    "createdAt": "string (ISO date)",
    "proposer": {
      "id": "string",
      "username": "string",
      "avatarUrl": "string"
    },
    "recipient": {
      "id": "string",
      "username": "string",
      "avatarUrl": "string"
    }
  }
]
```

#### GET `/api/v1/trading/history/:userId`

Get trade history for a user.

**Response:**

```json
[
  {
    "id": "string",
    "proposerId": "string",
    "recipientId": "string",
    "status": "ACCEPTED" | "REJECTED" | "CANCELLED" | "EXPIRED",
    "proposerItems": "string (JSON)",
    "proposerCoins": "number",
    "recipientItems": "string (JSON)",
    "recipientCoins": "number",
    "message": "string",
    "respondedAt": "string (ISO date)",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)",
    "proposer": {
      "id": "string",
      "username": "string",
      "avatarUrl": "string"
    },
    "recipient": {
      "id": "string",
      "username": "string",
      "avatarUrl": "string"
    }
  }
]
```

#### DELETE `/api/v1/trading/:tradeId/cancel/:userId`

Cancel a trade proposal (only by proposer).

**Response:**

```json
{
  "id": "string",
  "status": "CANCELLED"
}
```

**Error Codes:**

- `403`: User not authorized to cancel
- `400`: Trade cannot be cancelled

### Clan Marketplace Endpoints

#### POST `/api/v1/marketplace/clan/listing`

Create a new clan marketplace listing.

**Request Body:**

```json
{
  "sellerId": "string",
  "clanId": "string",
  "assetId": "string",
  "assetType": "AVATAR_ASSET" | "MARKETPLACE_ITEM",
  "price": "number"
}
```

**Response:**

```json
{
  "id": "string",
  "sellerId": "string",
  "clanId": "string",
  "listingType": "CLAN_MARKETPLACE",
  "assetId": "string",
  "assetType": "string",
  "price": "number",
  "isActive": "boolean",
  "createdAt": "string (ISO date)"
}
```

**Error Codes:**

- `403`: User not clan member or asset not owned
- `400`: Invalid asset or insufficient permissions

#### GET `/api/v1/marketplace/clan/:clanId/listings`

Get all active clan marketplace listings.

**Response:**

```json
[
  {
    "id": "string",
    "sellerId": "string",
    "clanId": "string",
    "assetId": "string",
    "assetType": "string",
    "price": "number",
    "isActive": "boolean",
    "createdAt": "string (ISO date)",
    "seller": {
      "id": "string",
      "username": "string",
      "avatarUrl": "string"
    },
    "clan": {
      "id": "string",
      "name": "string",
      "tag": "string"
    }
  }
]
```

#### POST `/api/v1/marketplace/clan/buy`

Purchase an item from clan marketplace using clan wallet.

**Request Body:**

```json
{
  "buyerId": "string",
  "listingId": "string",
  "clanId": "string"
}
```

**Response:**

```json
{
  "success": "boolean",
  "newBalance": "number",
  "assetTransferred": "boolean"
}
```

**Error Codes:**

- `403`: Buyer not clan member
- `400`: Insufficient clan wallet funds
- `404`: Listing not found or inactive

### Clan Wallet Endpoints

#### POST `/api/v1/marketplace/clan/wallet/deposit`

Deposit DojoCoins to clan wallet.

**Request Body:**

```json
{
  "userId": "string",
  "clanId": "string",
  "amount": "number"
}
```

**Response:**

```json
{
  "success": "boolean",
  "newUserBalance": "number",
  "newClanBalance": "number"
}
```

**Error Codes:**

- `403`: User not clan member
- `400`: Insufficient user funds

#### POST `/api/v1/marketplace/clan/wallet/withdraw`

Withdraw DojoCoins from clan wallet.

**Request Body:**

```json
{
  "userId": "string",
  "clanId": "string",
  "amount": "number"
}
```

**Response:**

```json
{
  "success": "boolean",
  "newClanBalance": "number"
}
```

**Error Codes:**

- `403`: User not clan member or insufficient permissions
- `400`: Insufficient clan wallet funds

#### GET `/api/v1/marketplace/clan/:clanId/wallet`

Get clan wallet information and transaction history.

**Response:**

```json
{
  "clanId": "string",
  "balance": "number",
  "totalDeposits": "number",
  "totalWithdrawals": "number",
  "clan": {
    "id": "string",
    "name": "string",
    "tag": "string",
    "leader": {
      "id": "string",
      "username": "string"
    }
  },
  "transactions": [
    {
      "id": "string",
      "clanId": "string",
      "userId": "string",
      "type": "DEPOSIT" | "WITHDRAWAL" | "MARKETPLACE_PURCHASE" | "CLAN_PURCHASE" | "TRANSFER",
      "amount": "number",
      "description": "string",
      "balanceAfter": "number",
      "createdAt": "string (ISO date)",
      "user": {
        "id": "string",
        "username": "string",
        "avatarUrl": "string"
      }
    }
  ]
}
```

## Database Models

### Trade Model

```typescript
model Trade {
  id             String      @id @default(uuid())
  proposerId     String
  proposer       User        @relation("TradeProposer", fields: [proposerId], references: [id])
  recipientId    String
  recipient      User        @relation("TradeRecipient", fields: [recipientId], references: [id])
  status         TradeStatus @default(PENDING)
  proposerItems  Json        @default("[]")
  proposerCoins  Int         @default(0)
  recipientItems Json        @default("[]")
  recipientCoins Int         @default(0)
  message        String?
  expiresAt      DateTime?
  respondedAt    DateTime?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
}
```

### Listing Model

```typescript
model Listing {
  id               String      @id @default(uuid())
  sellerId         String
  seller           User        @relation(fields: [sellerId], references: [id], onDelete: Cascade)
  clanId           String?
  clan             Clan?       @relation(fields: [clanId], references: [id])
  listingType      ListingType @default(MARKETPLACE)
  assetId          String
  assetType        String
  price            Int
  isActive         Boolean     @default(true)
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
}
```

### ClanWallet Model

```typescript
model ClanWallet {
  id           String   @id @default(uuid())
  clanId       String   @unique
  clan         Clan     @relation(fields: [clanId], references: [id], onDelete: Cascade)
  balance      Int      @default(0)
  totalDeposits Int     @default(0)
  totalWithdrawals Int  @default(0)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### ClanTransaction Model

```typescript
model ClanTransaction {
  id          String              @id @default(uuid())
  clanId      String
  clan        Clan                @relation(fields: [clanId], references: [id], onDelete: Cascade)
  userId      String
  user        User                @relation(fields: [userId], references: [id])
  type        ClanTransactionType
  amount      Int
  description String?
  metadata    Json                @default("{}")
  balanceAfter Int
  createdAt   DateTime            @default(now())
}
```

## Security Considerations

### Asset Validation

- All trades validate that the proposer owns the assets they're offering
- DojoCoin balances are verified before trade creation and execution
- Atomic transactions ensure no partial state changes

### Permission Controls

- Clan marketplace listings require clan membership
- Clan wallet withdrawals require officer or higher permissions
- Trade responses can only be made by the intended recipient

### Fraud Prevention

- Trade proposals expire automatically (default 24 hours)
- Trade status prevents double-spending and manipulation
- All transactions are logged with full audit trails

### Rate Limiting

- Consider implementing rate limits on trade proposal creation
- Wallet operations should be rate-limited to prevent abuse

## Error Handling

### Common Error Patterns

```typescript
// Insufficient funds
throw new BadRequestException('Insufficient DojoCoins');

// Asset not owned
throw new BadRequestException('User does not own this asset');

// Unauthorized access
throw new ForbiddenException('User is not a member of this clan');

// Resource not found
throw new NotFoundException('Trade not found');
```

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

## Testing

### Unit Tests

- TradingService business logic validation
- MarketplaceService transaction handling
- Permission and security checks
- Error handling scenarios

### Integration Tests

- API endpoint validation
- Database transaction integrity
- Cross-service communication
- Authentication and authorization

### E2E Tests

- Complete user workflows
- UI interaction validation
- Error state handling
- Performance under load

## Performance Considerations

### Database Optimization

- Indexes on frequently queried fields (clanId, userId, status)
- Connection pooling for database operations
- Query result caching for marketplace listings

### Caching Strategy

- Redis caching for marketplace listings (5-minute TTL)
- Clan wallet balances cached with invalidation on changes
- Trade status cached to reduce database queries

### Scalability

- Horizontal scaling support through stateless services
- Database read replicas for marketplace queries
- CDN for static asset delivery

## Monitoring and Logging

### Key Metrics

- Trade proposal success/failure rates
- Marketplace transaction volume
- Clan wallet activity
- API response times and error rates

### Audit Logging

- All transactions logged with full context
- User actions tracked for security analysis
- Failed operations logged with error details

This documentation provides comprehensive coverage of the Clan Marketplace and Social Trading API. All endpoints include proper error handling, security validation, and performance optimizations.
