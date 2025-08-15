import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from src.services.social.SocialFeaturesService import SocialFeaturesService
from src.types.social import FriendRequest, Message, ActivityPost, UserProfile
from src.types.user import User

class TestSocialFeaturesService:
    @pytest.fixture
    def service(self):
        return SocialFeaturesService()
    
    @pytest.fixture
    def mock_user(self):
        return User(
            id="user-1",
            username="testuser",
            email="test@example.com",
            avatar="avatar-1",
            clan="test-clan"
        )
    
    @pytest.fixture
    def mock_friend_request(self):
        return FriendRequest(
            id="request-1",
            fromUserId="user-1",
            toUserId="user-2",
            status="pending",
            timestamp="2025-01-30T10:00:00Z"
        )
    
    @pytest.fixture
    def mock_message(self):
        return Message(
            id="msg-1",
            fromUserId="user-1",
            toUserId="user-2",
            content="Hello!",
            timestamp="2025-01-30T10:00:00Z",
            isRead=False
        )
    
    @pytest.fixture
    def mock_activity_post(self):
        return ActivityPost(
            id="post-1",
            userId="user-1",
            type="match_win",
            content="Won an amazing pool match!",
            timestamp="2025-01-30T10:00:00Z",
            likes=5,
            comments=2,
            metadata={"matchId": "match-1", "score": "7-3"}
        )

    def test_init(self, service):
        """Test service initialization"""
        assert service.socket is None
        assert service.friends == {}
        assert service.friend_requests == {}
        assert service.messages == {}
        assert service.activity_feed == {}
        assert service.user_profiles == {}

    @patch('src.services.social.SocialFeaturesService.socketio')
    def test_connect_socket(self, mock_socketio, service):
        """Test socket connection"""
        mock_socket = Mock()
        mock_socketio.return_value = mock_socket
        
        service.connect_socket()
        
        assert service.socket == mock_socket
        mock_socketio.assert_called_once()

    def test_send_friend_request(self, service, mock_user):
        """Test sending friend request"""
        request = service.send_friend_request(
            from_user_id=mock_user.id,
            to_user_id="user-2"
        )
        
        assert request.id is not None
        assert request.fromUserId == mock_user.id
        assert request.toUserId == "user-2"
        assert request.status == "pending"
        assert request.id in service.friend_requests

    def test_accept_friend_request(self, service, mock_friend_request):
        """Test accepting friend request"""
        service.friend_requests[mock_friend_request.id] = mock_friend_request
        
        result = service.accept_friend_request(mock_friend_request.id)
        
        assert result is True
        assert service.friend_requests[mock_friend_request.id].status == "accepted"
        assert mock_friend_request.fromUserId in service.friends.get(mock_friend_request.toUserId, [])
        assert mock_friend_request.toUserId in service.friends.get(mock_friend_request.fromUserId, [])

    def test_decline_friend_request(self, service, mock_friend_request):
        """Test declining friend request"""
        service.friend_requests[mock_friend_request.id] = mock_friend_request
        
        result = service.decline_friend_request(mock_friend_request.id)
        
        assert result is True
        assert service.friend_requests[mock_friend_request.id].status == "declined"

    def test_remove_friend(self, service, mock_user):
        """Test removing friend"""
        # First make them friends
        service.friends[mock_user.id] = ["user-2"]
        service.friends["user-2"] = [mock_user.id]
        
        result = service.remove_friend(mock_user.id, "user-2")
        
        assert result is True
        assert "user-2" not in service.friends.get(mock_user.id, [])
        assert mock_user.id not in service.friends.get("user-2", [])

    def test_get_friends(self, service, mock_user):
        """Test getting user friends"""
        service.friends[mock_user.id] = ["user-2", "user-3"]
        
        friends = service.get_friends(mock_user.id)
        assert len(friends) == 2
        assert "user-2" in friends
        assert "user-3" in friends

    def test_get_friend_requests(self, service, mock_user):
        """Test getting friend requests"""
        service.friend_requests["request-1"] = FriendRequest(
            id="request-1",
            fromUserId="user-2",
            toUserId=mock_user.id,
            status="pending",
            timestamp="2025-01-30T10:00:00Z"
        )
        
        requests = service.get_friend_requests(mock_user.id)
        assert len(requests) == 1
        assert requests[0].fromUserId == "user-2"

    def test_send_message(self, service, mock_user):
        """Test sending message"""
        message = service.send_message(
            from_user_id=mock_user.id,
            to_user_id="user-2",
            content="Hello!"
        )
        
        assert message.id is not None
        assert message.fromUserId == mock_user.id
        assert message.toUserId == "user-2"
        assert message.content == "Hello!"
        assert message.isRead is False
        assert message.id in service.messages

    def test_mark_message_as_read(self, service, mock_message):
        """Test marking message as read"""
        service.messages[mock_message.id] = mock_message
        
        result = service.mark_message_as_read(mock_message.id)
        
        assert result is True
        assert service.messages[mock_message.id].isRead is True

    def test_get_conversation(self, service, mock_user):
        """Test getting conversation between users"""
        # Send messages between users
        service.send_message(
            from_user_id=mock_user.id,
            to_user_id="user-2",
            content="Hello!"
        )
        service.send_message(
            from_user_id="user-2",
            to_user_id=mock_user.id,
            content="Hi there!"
        )
        
        conversation = service.get_conversation(mock_user.id, "user-2")
        assert len(conversation) == 2

    def test_get_user_messages(self, service, mock_user):
        """Test getting all messages for a user"""
        service.send_message(
            from_user_id=mock_user.id,
            to_user_id="user-2",
            content="Hello!"
        )
        service.send_message(
            from_user_id="user-3",
            to_user_id=mock_user.id,
            content="Hi!"
        )
        
        messages = service.get_user_messages(mock_user.id)
        assert len(messages) == 2

    def test_create_activity_post(self, service, mock_user):
        """Test creating activity post"""
        post = service.create_activity_post(
            user_id=mock_user.id,
            post_type="match_win",
            content="Won an amazing pool match!",
            metadata={"matchId": "match-1", "score": "7-3"}
        )
        
        assert post.id is not None
        assert post.userId == mock_user.id
        assert post.type == "match_win"
        assert post.content == "Won an amazing pool match!"
        assert post.likes == 0
        assert post.comments == 0
        assert post.id in service.activity_feed

    def test_like_activity_post(self, service, mock_activity_post):
        """Test liking activity post"""
        service.activity_feed[mock_activity_post.id] = mock_activity_post
        
        result = service.like_activity_post(mock_activity_post.id, "user-2")
        
        assert result is True
        assert service.activity_feed[mock_activity_post.id].likes == 6

    def test_unlike_activity_post(self, service, mock_activity_post):
        """Test unliking activity post"""
        service.activity_feed[mock_activity_post.id] = mock_activity_post
        service.activity_feed[mock_activity_post.id].likes = 6
        
        result = service.unlike_activity_post(mock_activity_post.id, "user-2")
        
        assert result is True
        assert service.activity_feed[mock_activity_post.id].likes == 5

    def test_comment_on_activity_post(self, service, mock_activity_post):
        """Test commenting on activity post"""
        service.activity_feed[mock_activity_post.id] = mock_activity_post
        
        comment = service.comment_on_activity_post(
            post_id=mock_activity_post.id,
            user_id="user-2",
            content="Great shot!"
        )
        
        assert comment.id is not None
        assert comment.userId == "user-2"
        assert comment.content == "Great shot!"
        assert service.activity_feed[mock_activity_post.id].comments == 3

    def test_get_activity_feed(self, service, mock_user):
        """Test getting activity feed"""
        service.create_activity_post(
            user_id=mock_user.id,
            post_type="match_win",
            content="Won a match!",
            metadata={"matchId": "match-1"}
        )
        service.create_activity_post(
            user_id="user-2",
            post_type="tournament_win",
            content="Won a tournament!",
            metadata={"tournamentId": "tournament-1"}
        )
        
        feed = service.get_activity_feed(mock_user.id, limit=10)
        assert len(feed) > 0

    def test_get_user_activity(self, service, mock_user):
        """Test getting user activity"""
        service.create_activity_post(
            user_id=mock_user.id,
            post_type="match_win",
            content="Won a match!",
            metadata={"matchId": "match-1"}
        )
        service.create_activity_post(
            user_id=mock_user.id,
            post_type="achievement",
            content="Unlocked new achievement!",
            metadata={"achievementId": "achievement-1"}
        )
        
        activity = service.get_user_activity(mock_user.id, limit=10)
        assert len(activity) == 2

    def test_search_users(self, service, mock_user):
        """Test searching users"""
        service.user_profiles[mock_user.id] = UserProfile(
            userId=mock_user.id,
            username=mock_user.username,
            avatar=mock_user.avatar,
            clan=mock_user.clan,
            status="online"
        )
        service.user_profiles["user-2"] = UserProfile(
            userId="user-2",
            username="player2",
            avatar="avatar-2",
            clan="other-clan",
            status="offline"
        )
        
        results = service.search_users("test")
        assert len(results) == 1
        assert results[0].userId == mock_user.id

    def test_get_user_profile(self, service, mock_user):
        """Test getting user profile"""
        profile = UserProfile(
            userId=mock_user.id,
            username=mock_user.username,
            avatar=mock_user.avatar,
            clan=mock_user.clan,
            status="online"
        )
        service.user_profiles[mock_user.id] = profile
        
        result = service.get_user_profile(mock_user.id)
        assert result == profile

    def test_update_user_profile(self, service, mock_user):
        """Test updating user profile"""
        service.user_profiles[mock_user.id] = UserProfile(
            userId=mock_user.id,
            username=mock_user.username,
            avatar=mock_user.avatar,
            clan=mock_user.clan,
            status="online"
        )
        
        updated_profile = service.update_user_profile(
            user_id=mock_user.id,
            status="away",
            bio="Pool enthusiast"
        )
        
        assert updated_profile.status == "away"
        assert updated_profile.bio == "Pool enthusiast"

    def test_get_online_friends(self, service, mock_user):
        """Test getting online friends"""
        service.friends[mock_user.id] = ["user-2", "user-3"]
        service.user_profiles["user-2"] = UserProfile(
            userId="user-2",
            username="player2",
            avatar="avatar-2",
            clan="other-clan",
            status="online"
        )
        service.user_profiles["user-3"] = UserProfile(
            userId="user-3",
            username="player3",
            avatar="avatar-3",
            clan="other-clan",
            status="offline"
        )
        
        online_friends = service.get_online_friends(mock_user.id)
        assert len(online_friends) == 1
        assert online_friends[0].userId == "user-2"

    def test_share_activity(self, service, mock_user, mock_activity_post):
        """Test sharing activity"""
        service.activity_feed[mock_activity_post.id] = mock_activity_post
        
        share = service.share_activity(
            post_id=mock_activity_post.id,
            user_id=mock_user.id,
            platform="twitter"
        )
        
        assert share.id is not None
        assert share.postId == mock_activity_post.id
        assert share.userId == mock_user.id
        assert share.platform == "twitter"

    def test_get_notifications(self, service, mock_user):
        """Test getting user notifications"""
        notifications = service.get_notifications(mock_user.id)
        assert isinstance(notifications, list)

    def test_mark_notification_as_read(self, service, mock_user):
        """Test marking notification as read"""
        result = service.mark_notification_as_read(mock_user.id, "notification-1")
        assert result is True

    def test_block_user(self, service, mock_user):
        """Test blocking user"""
        result = service.block_user(mock_user.id, "user-2")
        assert result is True

    def test_unblock_user(self, service, mock_user):
        """Test unblocking user"""
        result = service.unblock_user(mock_user.id, "user-2")
        assert result is True

    def test_get_blocked_users(self, service, mock_user):
        """Test getting blocked users"""
        blocked = service.get_blocked_users(mock_user.id)
        assert isinstance(blocked, list)

    @patch('src.services.social.SocialFeaturesService.socketio')
    def test_broadcast_friend_request(self, mock_socketio, service, mock_friend_request):
        """Test broadcasting friend request"""
        mock_socket = Mock()
        mock_socketio.return_value = mock_socket
        service.connect_socket()
        
        service.broadcast_friend_request(mock_friend_request)
        
        mock_socket.emit.assert_called_with(
            'friend_request',
            mock_friend_request.dict()
        )

    @patch('src.services.social.SocialFeaturesService.socketio')
    def test_broadcast_message(self, mock_socketio, service, mock_message):
        """Test broadcasting message"""
        mock_socket = Mock()
        mock_socketio.return_value = mock_socket
        service.connect_socket()
        
        service.broadcast_message(mock_message)
        
        mock_socket.emit.assert_called_with(
            'new_message',
            mock_message.dict()
        )

    @patch('src.services.social.SocialFeaturesService.socketio')
    def test_broadcast_activity_post(self, mock_socketio, service, mock_activity_post):
        """Test broadcasting activity post"""
        mock_socket = Mock()
        mock_socketio.return_value = mock_socket
        service.connect_socket()
        
        service.broadcast_activity_post(mock_activity_post)
        
        mock_socket.emit.assert_called_with(
            'new_activity',
            mock_activity_post.dict()
        )

    def test_get_social_statistics(self, service, mock_user):
        """Test getting social statistics"""
        stats = service.get_social_statistics(mock_user.id)
        assert stats is not None
        assert "total_friends" in stats
        assert "total_messages" in stats
        assert "total_posts" in stats
        assert "total_likes" in stats 