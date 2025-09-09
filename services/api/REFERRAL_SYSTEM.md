# Referral System Documentation

## Overview

The DojoPool Referral System enables viral user acquisition through a reward-based referral program. Users can share unique referral codes to invite friends, earning DojoCoins for successful referrals. The system is designed to be secure, scalable, and integrated with the existing economy.

## Key Features

- **Unique Referral Codes**: Each user gets a unique 8-character alphanumeric code
- **Dual Rewards**: Both inviter and invitee receive DojoCoins
- **Real-time Validation**: Instant feedback on referral code validity
- **Comprehensive Tracking**: Full referral history and statistics
- **Secure Processing**: Atomic transactions with fraud prevention

## Base URL

```
/api/v1/referral
```

## Authentication

All endpoints except validation require JWT authentication:

```
Authorization: Bearer <jwt_token>
```

## Data Models

### Referral Code Response

```typescript
interface ReferralCodeResponse {
  referralCode: string; // 8-character unique code
  createdAt: Date; // When code was created
}
```

### Referral Stats

```typescript
interface ReferralStats {
  totalReferrals: number; // Total referral codes created
  completedReferrals: number; // Successful signups
  pendingRewards: number; // Unclaimed rewards
  claimedRewards: number; // Successfully claimed rewards
  totalEarned: number; // Total DojoCoins earned
}
```

### Referral Details

```typescript
interface ReferralDetails {
  id: string;
  referralCode: string;
  inviteeId?: string;
  inviteeUsername?: string;
  status: ReferralStatus;
  rewardStatus: RewardStatus;
  rewardAmount: number; // DojoCoins for inviter
  inviteeReward: number; // DojoCoins for invitee
  invitedAt?: Date;
  rewardClaimedAt?: Date;
  createdAt: Date;
}

enum ReferralStatus {
  PENDING = 'PENDING', // Code created but not used
  COMPLETED = 'COMPLETED', // Successfully used for signup
  EXPIRED = 'EXPIRED', // Code expired
  CANCELLED = 'CANCELLED', // Code deactivated
}

enum RewardStatus {
  PENDING = 'PENDING', // Reward not yet processed
  CLAIMED = 'CLAIMED', // Reward successfully claimed
  EXPIRED = 'EXPIRED', // Reward claim period expired
}
```

## Endpoints

### 1. Get Referral Code

Get or create a unique referral code for the authenticated user.

**Endpoint:** `GET /api/v1/referral/code`

**Response:**

```json
{
  "referralCode": "ABC123XY",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid authentication

### 2. Get Referral Status

Get comprehensive referral statistics and history.

**Endpoint:** `GET /api/v1/referral/status`

**Response:**

```json
{
  "stats": {
    "totalReferrals": 5,
    "completedReferrals": 3,
    "pendingRewards": 1,
    "claimedRewards": 2,
    "totalEarned": 200
  },
  "details": [
    {
      "id": "ref-123",
      "referralCode": "ABC123XY",
      "inviteeId": "user-456",
      "inviteeUsername": "john_doe",
      "status": "COMPLETED",
      "rewardStatus": "CLAIMED",
      "rewardAmount": 100,
      "inviteeReward": 50,
      "invitedAt": "2024-01-16T14:20:00.000Z",
      "rewardClaimedAt": "2024-01-16T14:20:05.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid authentication

### 3. Validate Referral Code

Validate a referral code without authentication (for registration flow).

**Endpoint:** `POST /api/v1/referral/validate`

**Request Body:**

```json
{
  "referralCode": "ABC123XY"
}
```

**Response:**

```json
{
  "valid": true,
  "referralCode": "ABC123XY"
}
```

**Error Responses:**

- `400 Bad Request` - Missing referral code

### 4. Process Referral Signup

Process a referral during user registration.

**Endpoint:** `POST /api/v1/referral/process-signup`

**Request Body:**

```json
{
  "referralCode": "ABC123XY"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Referral processed successfully"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid or missing referral code, code already used
- `401 Unauthorized` - Invalid authentication
- `409 Conflict` - Attempting to use own referral code

## Business Logic

### Referral Code Generation

- **Format**: 8-character alphanumeric string (A-Z, 0-9)
- **Uniqueness**: Guaranteed unique across all users
- **Creation**: Automatic on first access to referral endpoints

### Reward Structure

- **Inviter Reward**: 100 DojoCoins per successful referral
- **Invitee Reward**: 50 DojoCoins for using referral code
- **Timing**: Rewards credited immediately upon successful signup
- **Atomic**: Both rewards processed in single transaction

### Validation Rules

- **Single Use**: Each referral code can only be used once
- **Self-Referral**: Users cannot use their own referral codes
- **Expiration**: Codes do not expire by default
- **Case Sensitive**: Codes are case-sensitive

### Security Measures

- **Authentication**: Protected endpoints require valid JWT
- **Rate Limiting**: Consider implementing limits on validation requests
- **Audit Trail**: All referral actions are logged
- **Fraud Prevention**: Single-use codes prevent abuse

## User Journey

### 1. Getting Started

```typescript
// User accesses referral dashboard
const response = await referralService.getReferralCode();
// Returns: { referralCode: "ABC123XY", createdAt: "2024-01-15T10:30:00.000Z" }
```

### 2. Sharing Referral Code

```typescript
// Generate shareable URL
const shareUrl = `${window.location.origin}/auth/register?ref=${referralCode}`;

// Native sharing (if supported)
if (navigator.share) {
  await navigator.share({
    title: 'Join DojoPool!',
    text: `Use my referral code ${referralCode} to earn bonus DojoCoins!`,
    url: shareUrl,
  });
}
```

### 3. Registration with Referral

```typescript
// On registration page with referral parameter
const urlParams = new URLSearchParams(window.location.search);
const refCode = urlParams.get('ref');

if (refCode) {
  // Validate code
  const isValid = await referralService.validateReferralCode(refCode);

  if (isValid) {
    // Pre-fill referral code field
    setReferralCode(refCode);
  }
}

// During registration
const newUser = await register(username, email, password);

// Process referral
if (referralCode && isValid) {
  try {
    await referralService.processReferralSignup(referralCode);
  } catch (error) {
    // Log error but don't block registration
    console.error('Referral processing failed:', error);
  }
}
```

### 4. Tracking Progress

```typescript
// Get comprehensive stats
const { stats, details } = await referralService.getReferralStats();

// Display dashboard
console.log(`Total earned: ${stats.totalEarned} DojoCoins`);
console.log(`Successful referrals: ${stats.completedReferrals}`);
```

## Frontend Integration

### Referral Dashboard Component

```typescript
const ReferralDashboard: React.FC = () => {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<ReferralDetails[]>([]);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const [statsResponse, detailsResponse] = await Promise.all([
        referralService.getReferralStats(),
        referralService.getReferralDetails()
      ]);
      setStats(statsResponse);
      setReferrals(detailsResponse);
    } catch (error) {
      console.error('Failed to load referral data:', error);
    }
  };

  return (
    <div>
      <h2>Referral Dashboard</h2>
      {stats && (
        <div className="stats-grid">
          <div>Total Referrals: {stats.totalReferrals}</div>
          <div>Completed: {stats.completedReferrals}</div>
          <div>Total Earned: {stats.totalEarned} DojoCoins</div>
        </div>
      )}
      {/* Referral history table */}
    </div>
  );
};
```

### Registration Form Integration

```typescript
const RegisterForm: React.FC = () => {
  const [referralCode, setReferralCode] = useState('');
  const [referralValid, setReferralValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setReferralCode(ref);
      validateCode(ref);
    }
  }, []);

  const validateCode = async (code: string) => {
    if (!code.trim()) {
      setReferralValid(null);
      return;
    }
    try {
      const isValid = await referralService.validateReferralCode(code);
      setReferralValid(isValid);
    } catch (error) {
      setReferralValid(false);
    }
  };

  const handleReferralCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value;
    setReferralCode(code);
    validateCode(code);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Other form fields */}
      <TextField
        label="Referral Code (Optional)"
        value={referralCode}
        onChange={handleReferralCodeChange}
        helperText={
          referralValid === true ? "✓ Valid code - you'll earn bonus DojoCoins!" :
          referralValid === false ? "✗ Invalid referral code" :
          "Enter a referral code to earn bonus DojoCoins"
        }
      />
      <Button type="submit">Register</Button>
    </form>
  );
};
```

## Database Schema

### Referral Model

```sql
model Referral {
  id              String           @id @default(uuid())
  referralCode    String           @unique
  inviterId       String
  inviter         User             @relation("ReferralInviter", fields: [inviterId], references: [id], onDelete: Cascade)
  inviteeId       String?
  invitee         User?            @relation("ReferralInvitee", fields: [inviteeId], references: [id])
  status          ReferralStatus   @default(PENDING)
  rewardStatus    RewardStatus     @default(PENDING)
  rewardAmount    Int              @default(100)
  inviteeReward   Int              @default(50)
  invitedAt       DateTime?
  rewardClaimedAt DateTime?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  @@unique([inviterId, inviteeId])
  @@index([referralCode])
  @@index([status])
  @@index([rewardStatus])
}
```

## Error Handling

### Standardized Error Responses

```json
{
  "statusCode": 400,
  "message": "Invalid referral code",
  "error": "Bad Request"
}
```

### Common Error Scenarios

- **Invalid Code**: Code doesn't exist or is malformed
- **Used Code**: Attempting to use an already redeemed code
- **Self-Referral**: User trying to use their own code
- **Authentication**: Missing or invalid JWT token

## Analytics & Monitoring

### Key Metrics

- **Conversion Rate**: Percentage of referrals that result in signups
- **Revenue per Referral**: Average revenue generated per successful referral
- **Code Usage**: Frequency and patterns of code sharing
- **Reward Distribution**: Breakdown of claimed vs pending rewards

### Monitoring Points

- **API Performance**: Response times for all endpoints
- **Error Rates**: Failed validation and processing attempts
- **Fraud Detection**: Unusual referral patterns
- **User Engagement**: Dashboard usage and sharing activity

## Future Enhancements

### Advanced Features

- **Tiered Rewards**: Different reward levels based on referral count
- **Time-limited Codes**: Expiring referral codes with countdown
- **Social Sharing**: Integrated sharing to social media platforms
- **Referral Chains**: Multi-level referral rewards
- **Custom Rewards**: Personalized reward amounts

### Technical Improvements

- **Caching**: Redis caching for frequently accessed referral data
- **Webhooks**: Real-time notifications for referral events
- **Bulk Operations**: Batch processing for high-volume scenarios
- **Analytics Dashboard**: Advanced reporting and insights

## Security Considerations

- **Rate Limiting**: Prevent abuse through request throttling
- **Input Validation**: Strict validation of referral codes and user inputs
- **Audit Logging**: Complete audit trail of all referral activities
- **Data Privacy**: Secure handling of user referral relationships
- **Fraud Prevention**: Detection of suspicious referral patterns

## Testing Strategy

### Unit Tests

- Service method testing with mocked dependencies
- Validation logic verification
- Error handling scenarios

### Integration Tests

- End-to-end API flow testing
- Database transaction verification
- Cross-service communication

### E2E Tests

- Complete user journey testing
- Frontend-backend integration
- Error scenario handling

## Deployment Checklist

- [ ] Database migration applied
- [ ] Environment variables configured
- [ ] Redis caching enabled (if applicable)
- [ ] Rate limiting configured
- [ ] Monitoring and alerting set up
- [ ] Documentation updated
- [ ] Frontend integration tested
- [ ] Load testing completed
