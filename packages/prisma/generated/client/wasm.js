
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.AccountScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  provider: 'provider',
  providerAccountId: 'providerAccountId',
  refresh_token: 'refresh_token',
  access_token: 'access_token',
  expires_at: 'expires_at',
  token_type: 'token_type',
  scope: 'scope',
  id_token: 'id_token',
  session_state: 'session_state'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  sessionToken: 'sessionToken',
  userId: 'userId',
  expires: 'expires'
};

exports.Prisma.VerificationTokenScalarFieldEnum = {
  identifier: 'identifier',
  token: 'token',
  expires: 'expires'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  username: 'username',
  passwordHash: 'passwordHash',
  role: 'role',
  isBanned: 'isBanned',
  avatarUrl: 'avatarUrl',
  dojoCoinBalance: 'dojoCoinBalance',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  emailVerified: 'emailVerified',
  image: 'image'
};

exports.Prisma.ProfileScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  displayName: 'displayName',
  bio: 'bio',
  avatarUrl: 'avatarUrl',
  location: 'location',
  skillRating: 'skillRating',
  clanTitle: 'clanTitle',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserSettingsScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  emailNotifications: 'emailNotifications',
  pushNotifications: 'pushNotifications',
  darkMode: 'darkMode',
  language: 'language',
  timezone: 'timezone',
  privacySettings: 'privacySettings',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VenueScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  lat: 'lat',
  lng: 'lng',
  address: 'address',
  ownerId: 'ownerId',
  controllingClanId: 'controllingClanId',
  incomeModifier: 'incomeModifier',
  defenseLevel: 'defenseLevel',
  status: 'status',
  photos: 'photos',
  rating: 'rating',
  features: 'features',
  tables: 'tables',
  reviews: 'reviews',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TableScalarFieldEnum = {
  id: 'id',
  venueId: 'venueId',
  name: 'name',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CheckInScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  venueId: 'venueId',
  via: 'via',
  createdAt: 'createdAt'
};

exports.Prisma.ClanScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  tag: 'tag',
  leaderId: 'leaderId',
  maxMembers: 'maxMembers',
  dojoCoinBalance: 'dojoCoinBalance',
  seasonalPoints: 'seasonalPoints',
  bannerUrl: 'bannerUrl',
  color: 'color',
  level: 'level',
  experience: 'experience',
  reputation: 'reputation',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ClanMemberScalarFieldEnum = {
  id: 'id',
  clanId: 'clanId',
  userId: 'userId',
  role: 'role',
  joinedAt: 'joinedAt'
};

exports.Prisma.TerritoryScalarFieldEnum = {
  id: 'id',
  venueId: 'venueId',
  name: 'name',
  ownerId: 'ownerId',
  clanId: 'clanId',
  level: 'level',
  defenseScore: 'defenseScore',
  resources: 'resources',
  strategicValue: 'strategicValue',
  resourceRate: 'resourceRate',
  lastTickAt: 'lastTickAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TerritoryEventScalarFieldEnum = {
  id: 'id',
  territoryId: 'territoryId',
  type: 'type',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.TournamentScalarFieldEnum = {
  id: 'id',
  venueId: 'venueId',
  name: 'name',
  status: 'status',
  startTime: 'startTime',
  endTime: 'endTime',
  isSponsored: 'isSponsored',
  sponsoredBy: 'sponsoredBy',
  startDate: 'startDate',
  endDate: 'endDate',
  sponsorBannerUrl: 'sponsorBannerUrl',
  maxPlayers: 'maxPlayers',
  entryFee: 'entryFee',
  rewards: 'rewards',
  prizePool: 'prizePool',
  format: 'format',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TournamentParticipantScalarFieldEnum = {
  id: 'id',
  tournamentId: 'tournamentId',
  userId: 'userId',
  seed: 'seed',
  finalRank: 'finalRank',
  createdAt: 'createdAt'
};

exports.Prisma.MatchScalarFieldEnum = {
  id: 'id',
  tournamentId: 'tournamentId',
  venueId: 'venueId',
  tableId: 'tableId',
  playerAId: 'playerAId',
  playerBId: 'playerBId',
  winnerId: 'winnerId',
  loserId: 'loserId',
  status: 'status',
  scoreA: 'scoreA',
  scoreB: 'scoreB',
  round: 'round',
  wager: 'wager',
  aiAnalysisJson: 'aiAnalysisJson',
  startedAt: 'startedAt',
  endedAt: 'endedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MatchEventScalarFieldEnum = {
  id: 'id',
  matchId: 'matchId',
  type: 'type',
  payload: 'payload',
  ts: 'ts'
};

exports.Prisma.ChallengeScalarFieldEnum = {
  id: 'id',
  challengerId: 'challengerId',
  defenderId: 'defenderId',
  venueId: 'venueId',
  status: 'status',
  stakeCoins: 'stakeCoins',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WalletScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  chain: 'chain',
  address: 'address',
  createdAt: 'createdAt'
};

exports.Prisma.TransactionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  amount: 'amount',
  currency: 'currency',
  type: 'type',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.NFTScalarFieldEnum = {
  id: 'id',
  contract: 'contract',
  tokenId: 'tokenId',
  chain: 'chain',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.UserNFTScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  nftId: 'nftId',
  createdAt: 'createdAt'
};

exports.Prisma.AchievementScalarFieldEnum = {
  id: 'id',
  key: 'key',
  name: 'name',
  desc: 'desc',
  description: 'description',
  category: 'category',
  points: 'points',
  createdAt: 'createdAt'
};

exports.Prisma.UserAchievementScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  achievementId: 'achievementId',
  earnedAt: 'earnedAt'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  message: 'message',
  payload: 'payload',
  read: 'read',
  isRead: 'isRead',
  recipientId: 'recipientId',
  title: 'title',
  priority: 'priority',
  createdAt: 'createdAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  actorId: 'actorId',
  action: 'action',
  target: 'target',
  metadata: 'metadata',
  ts: 'ts'
};

exports.Prisma.FriendshipScalarFieldEnum = {
  id: 'id',
  requesterId: 'requesterId',
  addresseeId: 'addresseeId',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DirectMessageScalarFieldEnum = {
  id: 'id',
  senderId: 'senderId',
  receiverId: 'receiverId',
  content: 'content',
  read: 'read',
  timestamp: 'timestamp',
  createdAt: 'createdAt'
};

exports.Prisma.ActivityEventScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  message: 'message',
  data: 'data',
  venueId: 'venueId',
  matchId: 'matchId',
  tournamentId: 'tournamentId',
  clanId: 'clanId',
  metadata: 'metadata',
  isPublic: 'isPublic',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VenueQuestScalarFieldEnum = {
  id: 'id',
  venueId: 'venueId',
  title: 'title',
  description: 'description',
  reward: 'reward',
  rewardDojoCoins: 'rewardDojoCoins',
  active: 'active',
  isActive: 'isActive',
  requirements: 'requirements',
  type: 'type',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.GameSessionScalarFieldEnum = {
  id: 'id',
  playerId: 'playerId',
  gameId: 'gameId',
  venueId: 'venueId',
  status: 'status',
  gameType: 'gameType',
  rules: 'rules',
  startTime: 'startTime',
  endTime: 'endTime',
  duration: 'duration',
  playerIds: 'playerIds',
  currentPlayerId: 'currentPlayerId',
  ballStates: 'ballStates',
  fouls: 'fouls',
  score: 'score',
  events: 'events',
  totalShots: 'totalShots',
  totalFouls: 'totalFouls',
  totalFrames: 'totalFrames',
  lastUpdated: 'lastUpdated',
  winnerId: 'winnerId',
  data: 'data',
  frameCount: 'frameCount',
  shotCount: 'shotCount',
  foulCount: 'foulCount',
  shots: 'shots',
  statistics: 'statistics',
  aiCommentary: 'aiCommentary',
  matchId: 'matchId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MarketplaceItemScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  price: 'price',
  category: 'category',
  imageUrl: 'imageUrl',
  available: 'available',
  communityItemId: 'communityItemId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CommunityCosmeticItemScalarFieldEnum = {
  id: 'id',
  creatorId: 'creatorId',
  title: 'title',
  description: 'description',
  category: 'category',
  designFileUrl: 'designFileUrl',
  previewImageUrl: 'previewImageUrl',
  status: 'status',
  rejectionReason: 'rejectionReason',
  approvedItemId: 'approvedItemId',
  reviewerId: 'reviewerId',
  reviewedAt: 'reviewedAt',
  metadata: 'metadata',
  tags: 'tags',
  likes: 'likes',
  views: 'views',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CosmeticItemLikeScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  cosmeticItemId: 'cosmeticItemId',
  createdAt: 'createdAt'
};

exports.Prisma.SeasonScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  startDate: 'startDate',
  endDate: 'endDate',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ShadowRunScalarFieldEnum = {
  id: 'id',
  playerId: 'playerId',
  type: 'type',
  status: 'status',
  cost: 'cost',
  reward: 'reward',
  completedAt: 'completedAt',
  initiatingClanId: 'initiatingClanId',
  targetVenueId: 'targetVenueId',
  outcome: 'outcome',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DojoCheckInScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  venueId: 'venueId',
  createdAt: 'createdAt'
};

exports.Prisma.VenueSpecialScalarFieldEnum = {
  id: 'id',
  venueId: 'venueId',
  title: 'title',
  description: 'description',
  type: 'type',
  isActive: 'isActive',
  validUntil: 'validUntil',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserInventoryItemScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  marketplaceItemId: 'marketplaceItemId',
  createdAt: 'createdAt'
};

exports.Prisma.FeedbackScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  message: 'message',
  category: 'category',
  status: 'status',
  priority: 'priority',
  adminNotes: 'adminNotes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  resolvedAt: 'resolvedAt',
  resolvedBy: 'resolvedBy'
};

exports.Prisma.ContentScalarFieldEnum = {
  id: 'id',
  contentId: 'contentId',
  userId: 'userId',
  title: 'title',
  description: 'description',
  contentType: 'contentType',
  fileUrl: 'fileUrl',
  thumbnailUrl: 'thumbnailUrl',
  status: 'status',
  visibility: 'visibility',
  metadata: 'metadata',
  tags: 'tags',
  likes: 'likes',
  shares: 'shares',
  views: 'views',
  moderatedBy: 'moderatedBy',
  moderatedAt: 'moderatedAt',
  moderationNotes: 'moderationNotes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ContentLikeScalarFieldEnum = {
  id: 'id',
  contentId: 'contentId',
  userId: 'userId',
  likes: 'likes',
  createdAt: 'createdAt'
};

exports.Prisma.ContentShareScalarFieldEnum = {
  id: 'id',
  contentId: 'contentId',
  userId: 'userId',
  sharedWithId: 'sharedWithId',
  createdAt: 'createdAt'
};

exports.Prisma.RefreshTokenScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  tokenHash: 'tokenHash',
  deviceId: 'deviceId',
  deviceInfo: 'deviceInfo',
  expiresAt: 'expiresAt',
  isRevoked: 'isRevoked',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.UserRole = exports.$Enums.UserRole = {
  USER: 'USER',
  VENUE_ADMIN: 'VENUE_ADMIN',
  ADMIN: 'ADMIN'
};

exports.TableStatus = exports.$Enums.TableStatus = {
  AVAILABLE: 'AVAILABLE',
  OCCUPIED: 'OCCUPIED',
  MAINTENANCE: 'MAINTENANCE'
};

exports.CheckInMethod = exports.$Enums.CheckInMethod = {
  QR: 'QR',
  GEO: 'GEO',
  ADMIN: 'ADMIN'
};

exports.ClanRole = exports.$Enums.ClanRole = {
  MEMBER: 'MEMBER',
  OFFICER: 'OFFICER',
  COLEADER: 'COLEADER',
  LEADER: 'LEADER'
};

exports.TerritoryEventType = exports.$Enums.TerritoryEventType = {
  CLAIM: 'CLAIM',
  DEFEND: 'DEFEND',
  LOSE: 'LOSE',
  UPGRADE: 'UPGRADE'
};

exports.TournamentStatus = exports.$Enums.TournamentStatus = {
  UPCOMING: 'UPCOMING',
  REGISTRATION: 'REGISTRATION',
  ACTIVE: 'ACTIVE',
  LIVE: 'LIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

exports.MatchStatus = exports.$Enums.MatchStatus = {
  SCHEDULED: 'SCHEDULED',
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  LIVE: 'LIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  PAUSED: 'PAUSED'
};

exports.MatchEventType = exports.$Enums.MatchEventType = {
  SHOT: 'SHOT',
  FOUL: 'FOUL',
  RACK_START: 'RACK_START',
  RACK_END: 'RACK_END',
  COMMENTARY: 'COMMENTARY',
  SYSTEM: 'SYSTEM'
};

exports.ChallengeStatus = exports.$Enums.ChallengeStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  EXPIRED: 'EXPIRED'
};

exports.TxType = exports.$Enums.TxType = {
  CREDIT: 'CREDIT',
  DEBIT: 'DEBIT',
  PRIZE: 'PRIZE',
  FEE: 'FEE',
  PURCHASE: 'PURCHASE'
};

exports.FriendshipStatus = exports.$Enums.FriendshipStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  BLOCKED: 'BLOCKED'
};

exports.CosmeticCategory = exports.$Enums.CosmeticCategory = {
  CUE_SKIN: 'CUE_SKIN',
  BALL_SET: 'BALL_SET',
  TABLE_THEME: 'TABLE_THEME',
  TABLE_CLOTH: 'TABLE_CLOTH',
  AVATAR_FRAME: 'AVATAR_FRAME',
  PARTICLE_EFFECT: 'PARTICLE_EFFECT',
  SOUND_PACK: 'SOUND_PACK',
  OTHER: 'OTHER'
};

exports.SubmissionStatus = exports.$Enums.SubmissionStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REQUIRES_CHANGES: 'REQUIRES_CHANGES'
};

exports.FeedbackCategory = exports.$Enums.FeedbackCategory = {
  BUG: 'BUG',
  FEATURE_REQUEST: 'FEATURE_REQUEST',
  GENERAL_FEEDBACK: 'GENERAL_FEEDBACK',
  VENUE_ISSUE: 'VENUE_ISSUE',
  TECHNICAL_SUPPORT: 'TECHNICAL_SUPPORT',
  UI_UX_IMPROVEMENT: 'UI_UX_IMPROVEMENT',
  PERFORMANCE_ISSUE: 'PERFORMANCE_ISSUE'
};

exports.FeedbackStatus = exports.$Enums.FeedbackStatus = {
  PENDING: 'PENDING',
  IN_REVIEW: 'IN_REVIEW',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  REJECTED: 'REJECTED'
};

exports.FeedbackPriority = exports.$Enums.FeedbackPriority = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

exports.ContentType = exports.$Enums.ContentType = {
  MATCH_REPLAY: 'MATCH_REPLAY',
  CUSTOM_ITEM: 'CUSTOM_ITEM',
  HIGH_SCORE: 'HIGH_SCORE',
  ACHIEVEMENT: 'ACHIEVEMENT',
  TOURNAMENT_HIGHLIGHT: 'TOURNAMENT_HIGHLIGHT',
  VENUE_REVIEW: 'VENUE_REVIEW',
  GENERAL: 'GENERAL',
  EVENT: 'EVENT',
  NEWS_ARTICLE: 'NEWS_ARTICLE',
  SYSTEM_MESSAGE: 'SYSTEM_MESSAGE'
};

exports.ContentStatus = exports.$Enums.ContentStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ARCHIVED: 'ARCHIVED'
};

exports.ContentVisibility = exports.$Enums.ContentVisibility = {
  PUBLIC: 'PUBLIC',
  FRIENDS_ONLY: 'FRIENDS_ONLY',
  PRIVATE: 'PRIVATE'
};

exports.Prisma.ModelName = {
  Account: 'Account',
  Session: 'Session',
  VerificationToken: 'VerificationToken',
  User: 'User',
  Profile: 'Profile',
  UserSettings: 'UserSettings',
  Venue: 'Venue',
  Table: 'Table',
  CheckIn: 'CheckIn',
  Clan: 'Clan',
  ClanMember: 'ClanMember',
  Territory: 'Territory',
  TerritoryEvent: 'TerritoryEvent',
  Tournament: 'Tournament',
  TournamentParticipant: 'TournamentParticipant',
  Match: 'Match',
  MatchEvent: 'MatchEvent',
  Challenge: 'Challenge',
  Wallet: 'Wallet',
  Transaction: 'Transaction',
  NFT: 'NFT',
  UserNFT: 'UserNFT',
  Achievement: 'Achievement',
  UserAchievement: 'UserAchievement',
  Notification: 'Notification',
  AuditLog: 'AuditLog',
  Friendship: 'Friendship',
  DirectMessage: 'DirectMessage',
  ActivityEvent: 'ActivityEvent',
  VenueQuest: 'VenueQuest',
  GameSession: 'GameSession',
  MarketplaceItem: 'MarketplaceItem',
  CommunityCosmeticItem: 'CommunityCosmeticItem',
  CosmeticItemLike: 'CosmeticItemLike',
  Season: 'Season',
  ShadowRun: 'ShadowRun',
  DojoCheckIn: 'DojoCheckIn',
  VenueSpecial: 'VenueSpecial',
  UserInventoryItem: 'UserInventoryItem',
  Feedback: 'Feedback',
  Content: 'Content',
  ContentLike: 'ContentLike',
  ContentShare: 'ContentShare',
  RefreshToken: 'RefreshToken'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
