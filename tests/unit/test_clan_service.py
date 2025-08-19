import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from src.services.clan.ClanSystemService import ClanSystemService
from src.types.clan import Clan, ClanMember, ClanWar, ClanInvite
from src.types.user import User

class TestClanSystemService:
    @pytest.fixture
    def service(self):
        return ClanSystemService()
    
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
    def mock_clan(self):
        return Clan(
            id="clan-1",
            name="Test Clan",
            description="A test clan for pool players",
            leaderId="user-1",
            memberCount=5,
            territoryCount=3,
            totalScore=1500,
            createdAt="2025-01-30T10:00:00Z"
        )
    
    @pytest.fixture
    def mock_clan_member(self):
        return ClanMember(
            userId="user-2",
            clanId="clan-1",
            role="member",
            joinedAt="2025-01-30T10:00:00Z",
            contribution=500
        )
    
    @pytest.fixture
    def mock_clan_war(self):
        return ClanWar(
            id="war-1",
            clan1Id="clan-1",
            clan2Id="clan-2",
            status="active",
            startTime="2025-01-30T10:00:00Z",
            endTime="2025-01-31T10:00:00Z",
            clan1Score=0,
            clan2Score=0
        )

    def test_init(self, service):
        """Test service initialization"""
        assert service.socket is None
        assert service.clans == {}
        assert service.clan_members == {}
        assert service.clan_wars == {}
        assert service.clan_invites == {}
        assert service.territory_claims == {}

    @patch('src.services.clan.ClanSystemService.socketio')
    def test_connect_socket(self, mock_socketio, service):
        """Test socket connection"""
        mock_socket = Mock()
        mock_socketio.return_value = mock_socket
        
        service.connect_socket()
        
        assert service.socket == mock_socket
        mock_socketio.assert_called_once()

    def test_create_clan(self, service, mock_user):
        """Test creating clan"""
        clan = service.create_clan(
            name="Test Clan",
            description="A test clan for pool players",
            leader_id=mock_user.id
        )
        
        assert clan.id is not None
        assert clan.name == "Test Clan"
        assert clan.description == "A test clan for pool players"
        assert clan.leaderId == mock_user.id
        assert clan.memberCount == 1
        assert clan.id in service.clans

    def test_get_clan(self, service, mock_clan):
        """Test getting clan by ID"""
        service.clans[mock_clan.id] = mock_clan
        
        result = service.get_clan(mock_clan.id)
        assert result == mock_clan

    def test_get_clan_not_found(self, service):
        """Test getting non-existent clan"""
        result = service.get_clan("non-existent")
        assert result is None

    def test_update_clan(self, service, mock_clan):
        """Test updating clan"""
        service.clans[mock_clan.id] = mock_clan
        
        updated_clan = service.update_clan(
            clan_id=mock_clan.id,
            name="Updated Clan",
            description="Updated description"
        )
        
        assert updated_clan.name == "Updated Clan"
        assert updated_clan.description == "Updated description"

    def test_delete_clan(self, service, mock_clan):
        """Test deleting clan"""
        service.clans[mock_clan.id] = mock_clan
        
        result = service.delete_clan(mock_clan.id, mock_clan.leaderId)
        
        assert result is True
        assert mock_clan.id not in service.clans

    def test_delete_clan_not_leader(self, service, mock_clan):
        """Test deleting clan by non-leader"""
        service.clans[mock_clan.id] = mock_clan
        
        result = service.delete_clan(mock_clan.id, "user-2")
        
        assert result is False
        assert mock_clan.id in service.clans

    def test_add_clan_member(self, service, mock_clan, mock_clan_member):
        """Test adding clan member"""
        service.clans[mock_clan.id] = mock_clan
        
        member = service.add_clan_member(
            clan_id=mock_clan.id,
            user_id=mock_clan_member.userId,
            role="member"
        )
        
        assert member.userId == mock_clan_member.userId
        assert member.clanId == mock_clan.id
        assert member.role == "member"
        assert member.userId in service.clan_members.get(mock_clan.id, {})

    def test_remove_clan_member(self, service, mock_clan, mock_clan_member):
        """Test removing clan member"""
        service.clans[mock_clan.id] = mock_clan
        service.clan_members[mock_clan.id] = {mock_clan_member.userId: mock_clan_member}
        
        result = service.remove_clan_member(
            clan_id=mock_clan.id,
            user_id=mock_clan_member.userId,
            removed_by=mock_clan.leaderId
        )
        
        assert result is True
        assert mock_clan_member.userId not in service.clan_members.get(mock_clan.id, {})

    def test_update_member_role(self, service, mock_clan, mock_clan_member):
        """Test updating member role"""
        service.clans[mock_clan.id] = mock_clan
        service.clan_members[mock_clan.id] = {mock_clan_member.userId: mock_clan_member}
        
        updated_member = service.update_member_role(
            clan_id=mock_clan.id,
            user_id=mock_clan_member.userId,
            new_role="officer",
            updated_by=mock_clan.leaderId
        )
        
        assert updated_member.role == "officer"

    def test_get_clan_members(self, service, mock_clan):
        """Test getting clan members"""
        service.clans[mock_clan.id] = mock_clan
        service.clan_members[mock_clan.id] = {
            "user-1": ClanMember(userId="user-1", clanId=mock_clan.id, role="leader"),
            "user-2": ClanMember(userId="user-2", clanId=mock_clan.id, role="member"),
            "user-3": ClanMember(userId="user-3", clanId=mock_clan.id, role="member")
        }
        
        members = service.get_clan_members(mock_clan.id)
        assert len(members) == 3

    def test_get_user_clan(self, service, mock_clan, mock_clan_member):
        """Test getting user's clan"""
        service.clans[mock_clan.id] = mock_clan
        service.clan_members[mock_clan.id] = {mock_clan_member.userId: mock_clan_member}
        
        clan = service.get_user_clan(mock_clan_member.userId)
        assert clan == mock_clan

    def test_send_clan_invite(self, service, mock_clan):
        """Test sending clan invite"""
        service.clans[mock_clan.id] = mock_clan
        
        invite = service.send_clan_invite(
            clan_id=mock_clan.id,
            from_user_id=mock_clan.leaderId,
            to_user_id="user-2"
        )
        
        assert invite.id is not None
        assert invite.clanId == mock_clan.id
        assert invite.fromUserId == mock_clan.leaderId
        assert invite.toUserId == "user-2"
        assert invite.status == "pending"
        assert invite.id in service.clan_invites

    def test_accept_clan_invite(self, service, mock_clan):
        """Test accepting clan invite"""
        service.clans[mock_clan.id] = mock_clan
        invite = ClanInvite(
            id="invite-1",
            clanId=mock_clan.id,
            fromUserId=mock_clan.leaderId,
            toUserId="user-2",
            status="pending",
            timestamp="2025-01-30T10:00:00Z"
        )
        service.clan_invites[invite.id] = invite
        
        result = service.accept_clan_invite(invite.id)
        
        assert result is True
        assert service.clan_invites[invite.id].status == "accepted"
        assert "user-2" in service.clan_members.get(mock_clan.id, {})

    def test_decline_clan_invite(self, service):
        """Test declining clan invite"""
        invite = ClanInvite(
            id="invite-1",
            clanId="clan-1",
            fromUserId="user-1",
            toUserId="user-2",
            status="pending",
            timestamp="2025-01-30T10:00:00Z"
        )
        service.clan_invites[invite.id] = invite
        
        result = service.decline_clan_invite(invite.id)
        
        assert result is True
        assert service.clan_invites[invite.id].status == "declined"

    def test_get_user_invites(self, service):
        """Test getting user invites"""
        invite = ClanInvite(
            id="invite-1",
            clanId="clan-1",
            fromUserId="user-1",
            toUserId="user-2",
            status="pending",
            timestamp="2025-01-30T10:00:00Z"
        )
        service.clan_invites[invite.id] = invite
        
        invites = service.get_user_invites("user-2")
        assert len(invites) == 1
        assert invites[0].id == invite.id

    def test_start_clan_war(self, service, mock_clan):
        """Test starting clan war"""
        service.clans[mock_clan.id] = mock_clan
        service.clans["clan-2"] = Clan(
            id="clan-2",
            name="Enemy Clan",
            description="Enemy clan",
            leaderId="user-3",
            memberCount=3,
            territoryCount=1,
            totalScore=800,
            createdAt="2025-01-30T10:00:00Z"
        )
        
        war = service.start_clan_war(
            clan1_id=mock_clan.id,
            clan2_id="clan-2",
            duration_hours=24
        )
        
        assert war.id is not None
        assert war.clan1Id == mock_clan.id
        assert war.clan2Id == "clan-2"
        assert war.status == "active"
        assert war.id in service.clan_wars

    def test_get_clan_war(self, service, mock_clan_war):
        """Test getting clan war"""
        service.clan_wars[mock_clan_war.id] = mock_clan_war
        
        result = service.get_clan_war(mock_clan_war.id)
        assert result == mock_clan_war

    def test_update_clan_war_score(self, service, mock_clan_war):
        """Test updating clan war score"""
        service.clan_wars[mock_clan_war.id] = mock_clan_war
        
        updated_war = service.update_clan_war_score(
            war_id=mock_clan_war.id,
            clan_id=mock_clan_war.clan1Id,
            points=100
        )
        
        assert updated_war.clan1Score == 100

    def test_end_clan_war(self, service, mock_clan_war):
        """Test ending clan war"""
        service.clan_wars[mock_clan_war.id] = mock_clan_war
        
        result = service.end_clan_war(mock_clan_war.id)
        
        assert result is True
        assert service.clan_wars[mock_clan_war.id].status == "completed"

    def test_get_active_clan_wars(self, service, mock_clan_war):
        """Test getting active clan wars"""
        service.clan_wars[mock_clan_war.id] = mock_clan_war
        
        wars = service.get_active_clan_wars()
        assert len(wars) == 1
        assert wars[0].id == mock_clan_war.id

    def test_get_clan_war_history(self, service, mock_clan_war):
        """Test getting clan war history"""
        service.clan_wars[mock_clan_war.id] = mock_clan_war
        
        history = service.get_clan_war_history(mock_clan_war.clan1Id)
        assert len(history) == 1
        assert history[0].id == mock_clan_war.id

    def test_claim_territory_for_clan(self, service, mock_clan):
        """Test claiming territory for clan"""
        service.clans[mock_clan.id] = mock_clan
        
        claim = service.claim_territory_for_clan(
            clan_id=mock_clan.id,
            territory_id="territory-1",
            claimed_by="user-1"
        )
        
        assert claim.clanId == mock_clan.id
        assert claim.territoryId == "territory-1"
        assert claim.claimedBy == "user-1"
        assert claim.id in service.territory_claims

    def test_get_clan_territories(self, service, mock_clan):
        """Test getting clan territories"""
        service.clans[mock_clan.id] = mock_clan
        service.territory_claims["claim-1"] = {
            "clanId": mock_clan.id,
            "territoryId": "territory-1",
            "claimedBy": "user-1"
        }
        service.territory_claims["claim-2"] = {
            "clanId": mock_clan.id,
            "territoryId": "territory-2",
            "claimedBy": "user-2"
        }
        
        territories = service.get_clan_territories(mock_clan.id)
        assert len(territories) == 2

    def test_get_clan_leaderboard(self, service):
        """Test getting clan leaderboard"""
        service.clans["clan-1"] = Clan(
            id="clan-1",
            name="Clan 1",
            description="Clan 1",
            leaderId="user-1",
            memberCount=5,
            territoryCount=3,
            totalScore=1500,
            createdAt="2025-01-30T10:00:00Z"
        )
        service.clans["clan-2"] = Clan(
            id="clan-2",
            name="Clan 2",
            description="Clan 2",
            leaderId="user-2",
            memberCount=3,
            territoryCount=1,
            totalScore=800,
            createdAt="2025-01-30T10:00:00Z"
        )
        
        leaderboard = service.get_clan_leaderboard()
        assert len(leaderboard) == 2
        assert leaderboard[0]["id"] == "clan-1"  # Higher score
        assert leaderboard[1]["id"] == "clan-2"

    def test_search_clans(self, service, mock_clan):
        """Test searching clans"""
        service.clans[mock_clan.id] = mock_clan
        
        results = service.search_clans("test")
        assert len(results) == 1
        assert results[0].id == mock_clan.id

    def test_get_clan_statistics(self, service, mock_clan):
        """Test getting clan statistics"""
        service.clans[mock_clan.id] = mock_clan
        
        stats = service.get_clan_statistics(mock_clan.id)
        assert stats is not None
        assert "member_count" in stats
        assert "territory_count" in stats
        assert "total_score" in stats
        assert "war_wins" in stats

    @patch('src.services.clan.ClanSystemService.socketio')
    def test_broadcast_clan_update(self, mock_socketio, service, mock_clan):
        """Test broadcasting clan updates"""
        mock_socket = Mock()
        mock_socketio.return_value = mock_socket
        service.connect_socket()
        
        service.broadcast_clan_update(mock_clan)
        
        mock_socket.emit.assert_called_with(
            'clan_update',
            mock_clan.dict()
        )

    @patch('src.services.clan.ClanSystemService.socketio')
    def test_broadcast_clan_war_update(self, mock_socketio, service, mock_clan_war):
        """Test broadcasting clan war updates"""
        mock_socket = Mock()
        mock_socketio.return_value = mock_socket
        service.connect_socket()
        
        service.broadcast_clan_war_update(mock_clan_war)
        
        mock_socket.emit.assert_called_with(
            'clan_war_update',
            mock_clan_war.dict()
        )

    @patch('src.services.clan.ClanSystemService.socketio')
    def test_broadcast_clan_invite(self, mock_socketio, service):
        """Test broadcasting clan invite"""
        mock_socket = Mock()
        mock_socketio.return_value = mock_socket
        service.connect_socket()
        
        invite = ClanInvite(
            id="invite-1",
            clanId="clan-1",
            fromUserId="user-1",
            toUserId="user-2",
            status="pending",
            timestamp="2025-01-30T10:00:00Z"
        )
        
        service.broadcast_clan_invite(invite)
        
        mock_socket.emit.assert_called_with(
            'clan_invite',
            invite.dict()
        )

    def test_get_clan_activity_feed(self, service, mock_clan):
        """Test getting clan activity feed"""
        service.clans[mock_clan.id] = mock_clan
        
        feed = service.get_clan_activity_feed(mock_clan.id, limit=10)
        assert isinstance(feed, list)

    def test_add_clan_contribution(self, service, mock_clan, mock_clan_member):
        """Test adding clan contribution"""
        service.clans[mock_clan.id] = mock_clan
        service.clan_members[mock_clan.id] = {mock_clan_member.userId: mock_clan_member}
        
        updated_member = service.add_clan_contribution(
            clan_id=mock_clan.id,
            user_id=mock_clan_member.userId,
            contribution=100
        )
        
        assert updated_member.contribution == 600  # 500 + 100 