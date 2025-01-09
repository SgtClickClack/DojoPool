"""WebSocket constants module.

This module provides constants and enums used across WebSocket operations.
"""
from enum import Enum, auto

class EventTypes(str, Enum):
    """WebSocket event types."""
    
    # Connection events
    CONNECT = 'connect'
    DISCONNECT = 'disconnect'
    
    # Game events
    JOIN_GAME = 'join_game'
    LEAVE_GAME = 'leave_game'
    UPDATE_SCORE = 'update_score'
    END_GAME = 'end_game'
    
    # Tournament events
    JOIN_TOURNAMENT = 'join_tournament'
    LEAVE_TOURNAMENT = 'leave_tournament'
    START_TOURNAMENT = 'start_tournament'
    END_TOURNAMENT = 'end_tournament'
    
    # Chat events
    CHAT_MESSAGE = 'chat_message'
    SYSTEM_MESSAGE = 'system_message'
    
    # Error events
    ERROR = 'error'
    WARNING = 'warning'
    INFO = 'info'

class RoomTypes(str, Enum):
    """WebSocket room types."""
    
    GAME = 'game'
    TOURNAMENT = 'tournament'
    CHAT = 'chat'

class ErrorCodes(int, Enum):
    """WebSocket error codes."""
    
    # 1000-1999: Connection errors
    NORMAL_CLOSURE = 1000
    GOING_AWAY = 1001
    PROTOCOL_ERROR = 1002
    UNSUPPORTED_DATA = 1003
    INVALID_FRAME_PAYLOAD = 1007
    POLICY_VIOLATION = 1008
    MESSAGE_TOO_BIG = 1009
    MANDATORY_EXTENSION = 1010
    INTERNAL_ERROR = 1011
    
    # 2000-2999: Authentication errors
    AUTHENTICATION_REQUIRED = 2000
    INVALID_TOKEN = 2001
    TOKEN_EXPIRED = 2002
    INSUFFICIENT_PERMISSIONS = 2003
    ACCOUNT_LOCKED = 2004
    
    # 3000-3999: Validation errors
    VALIDATION_ERROR = 3000
    INVALID_EVENT = 3001
    INVALID_PARAMETERS = 3002
    MISSING_PARAMETERS = 3003
    
    # 4000-4999: Rate limiting errors
    RATE_LIMIT_EXCEEDED = 4000
    TOO_MANY_REQUESTS = 4001
    TOO_MANY_CONNECTIONS = 4002
    
    # 5000-5999: Room errors
    ROOM_FULL = 5000
    ROOM_NOT_FOUND = 5001
    ALREADY_IN_ROOM = 5002
    NOT_IN_ROOM = 5003
    INVALID_ROOM_TYPE = 5004
    
    # 6000-6999: Game errors
    GAME_NOT_FOUND = 6000
    GAME_ALREADY_STARTED = 6001
    GAME_ALREADY_ENDED = 6002
    INVALID_GAME_STATE = 6003
    INVALID_MOVE = 6004
    NOT_YOUR_TURN = 6005
    
    # 7000-7999: Tournament errors
    TOURNAMENT_NOT_FOUND = 7000
    TOURNAMENT_ALREADY_STARTED = 7001
    TOURNAMENT_ALREADY_ENDED = 7002
    INVALID_TOURNAMENT_STATE = 7003
    NOT_REGISTERED = 7004
    ALREADY_REGISTERED = 7005
    
    # 8000-8999: Server errors
    SERVER_ERROR = 8000
    SERVICE_UNAVAILABLE = 8001
    DATABASE_ERROR = 8002
    EXTERNAL_SERVICE_ERROR = 8003

class MessageTypes(str, Enum):
    """WebSocket message types."""
    
    # Standard message types
    TEXT = 'text'
    BINARY = 'binary'
    PING = 'ping'
    PONG = 'pong'
    
    # Custom message types
    EVENT = 'event'
    REQUEST = 'request'
    RESPONSE = 'response'
    ERROR = 'error'
    NOTIFICATION = 'notification'

class ConnectionStates(str, Enum):
    """WebSocket connection states."""
    
    CONNECTING = 'connecting'
    CONNECTED = 'connected'
    DISCONNECTING = 'disconnecting'
    DISCONNECTED = 'disconnected'
    RECONNECTING = 'reconnecting'
    FAILED = 'failed'

class Permissions(str, Enum):
    """WebSocket permissions."""
    
    # Game permissions
    CREATE_GAME = 'create_game'
    JOIN_GAME = 'join_game'
    UPDATE_SCORE = 'update_score'
    END_GAME = 'end_game'
    
    # Tournament permissions
    CREATE_TOURNAMENT = 'create_tournament'
    JOIN_TOURNAMENT = 'join_tournament'
    START_TOURNAMENT = 'start_tournament'
    END_TOURNAMENT = 'end_tournament'
    
    # Chat permissions
    SEND_MESSAGE = 'send_message'
    DELETE_MESSAGE = 'delete_message'
    MODERATE_CHAT = 'moderate_chat'
    
    # Admin permissions
    MANAGE_USERS = 'manage_users'
    MANAGE_ROOMS = 'manage_rooms'
    VIEW_METRICS = 'view_metrics'
    MANAGE_SYSTEM = 'manage_system'

class MetricTypes(str, Enum):
    """WebSocket metric types."""
    
    # Connection metrics
    ACTIVE_CONNECTIONS = 'active_connections'
    CONNECTION_RATE = 'connection_rate'
    DISCONNECTION_RATE = 'disconnection_rate'
    RECONNECTION_RATE = 'reconnection_rate'
    
    # Message metrics
    MESSAGE_RATE = 'message_rate'
    MESSAGE_SIZE = 'message_size'
    ERROR_RATE = 'error_rate'
    LATENCY = 'latency'
    
    # Room metrics
    ACTIVE_ROOMS = 'active_rooms'
    ROOM_MEMBERS = 'room_members'
    ROOM_MESSAGES = 'room_messages'
    
    # Game metrics
    ACTIVE_GAMES = 'active_games'
    GAME_DURATION = 'game_duration'
    MOVES_PER_GAME = 'moves_per_game'
    
    # Tournament metrics
    ACTIVE_TOURNAMENTS = 'active_tournaments'
    TOURNAMENT_PARTICIPANTS = 'tournament_participants'
    TOURNAMENT_DURATION = 'tournament_duration'
    
    # System metrics
    CPU_USAGE = 'cpu_usage'
    MEMORY_USAGE = 'memory_usage'
    NETWORK_IO = 'network_io'
    EVENT_LOOP_LAG = 'event_loop_lag'

class RoomState(Enum):
    """Room states."""
    ACTIVE = 'active'
    INACTIVE = 'inactive'
    CLOSED = 'closed'

class NotificationPriority(Enum):
    """Notification priority levels."""
    HIGH = 'high'      # Immediate delivery (game results, tournament updates)
    NORMAL = 'normal'  # Batched delivery (chat messages, friend requests)
    LOW = 'low'        # Background delivery (system updates, news) 