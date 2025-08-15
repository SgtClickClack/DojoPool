import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from src.services.venue.EnhancedVenueManagementService import EnhancedVenueManagementService
from src.types.venue import VenueInfo, VenueAnalytics, VenueStatus, TournamentSchedule
from src.types.user import User

class TestEnhancedVenueManagementService:
    @pytest.fixture
    def service(self):
        return EnhancedVenueManagementService()
    
    @pytest.fixture
    def mock_venue(self):
        return VenueInfo(
            id="venue-1",
            name="Test Dojo",
            address="123 Pool Street",
            coordinates={"lat": -27.4698, "lng": 153.0251},
            ownerId="owner-1",
            status="active",
            capacity=50,
            tableCount=8,
            createdAt="2025-01-30T10:00:00Z"
        )
    
    @pytest.fixture
    def mock_venue_analytics(self):
        return VenueAnalytics(
            venueId="venue-1",
            period="daily",
            visitors=150,
            revenue=2500.0,
            matches=45,
            tournaments=2,
            averageRating=4.5,
            timestamp="2025-01-30T10:00:00Z"
        )
    
    @pytest.fixture
    def mock_venue_status(self):
        return VenueStatus(
            venueId="venue-1",
            isOpen=True,
            currentVisitors=25,
            availableTables=3,
            systemHealth="healthy",
            lastUpdated="2025-01-30T10:00:00Z"
        )

    def test_init(self, service):
        """Test service initialization"""
        assert service.socket is None
        assert service.venues == {}
        assert service.analytics == {}
        assert service.status == {}
        assert service.tournaments == {}
        assert service.alerts == {}

    @patch('src.services.venue.EnhancedVenueManagementService.socketio')
    def test_connect_socket(self, mock_socketio, service):
        """Test socket connection"""
        mock_socket = Mock()
        mock_socketio.return_value = mock_socket
        
        service.connect_socket()
        
        assert service.socket == mock_socket
        mock_socketio.assert_called_once()

    def test_register_venue(self, service, mock_venue):
        """Test registering venue"""
        venue = service.register_venue(
            name=mock_venue.name,
            address=mock_venue.address,
            coordinates=mock_venue.coordinates,
            owner_id=mock_venue.ownerId,
            capacity=mock_venue.capacity,
            table_count=mock_venue.tableCount
        )
        
        assert venue.id is not None
        assert venue.name == mock_venue.name
        assert venue.address == mock_venue.address
        assert venue.ownerId == mock_venue.ownerId
        assert venue.status == "active"
        assert venue.id in service.venues

    def test_get_venue(self, service, mock_venue):
        """Test getting venue by ID"""
        service.venues[mock_venue.id] = mock_venue
        
        result = service.get_venue(mock_venue.id)
        assert result == mock_venue

    def test_get_venue_not_found(self, service):
        """Test getting non-existent venue"""
        result = service.get_venue("non-existent")
        assert result is None

    def test_update_venue(self, service, mock_venue):
        """Test updating venue"""
        service.venues[mock_venue.id] = mock_venue
        
        updated_venue = service.update_venue(
            venue_id=mock_venue.id,
            name="Updated Dojo",
            address="456 New Street",
            capacity=75
        )
        
        assert updated_venue.name == "Updated Dojo"
        assert updated_venue.address == "456 New Street"
        assert updated_venue.capacity == 75

    def test_delete_venue(self, service, mock_venue):
        """Test deleting venue"""
        service.venues[mock_venue.id] = mock_venue
        
        result = service.delete_venue(mock_venue.id, mock_venue.ownerId)
        
        assert result is True
        assert mock_venue.id not in service.venues

    def test_delete_venue_not_owner(self, service, mock_venue):
        """Test deleting venue by non-owner"""
        service.venues[mock_venue.id] = mock_venue
        
        result = service.delete_venue(mock_venue.id, "non-owner")
        
        assert result is False
        assert mock_venue.id in service.venues

    def test_get_venue_status(self, service, mock_venue_status):
        """Test getting venue status"""
        service.status[mock_venue_status.venueId] = mock_venue_status
        
        result = service.get_venue_status(mock_venue_status.venueId)
        assert result == mock_venue_status

    def test_update_venue_status(self, service, mock_venue_status):
        """Test updating venue status"""
        service.status[mock_venue_status.venueId] = mock_venue_status
        
        updated_status = service.update_venue_status(
            venue_id=mock_venue_status.venueId,
            is_open=False,
            current_visitors=0,
            available_tables=8,
            system_health="maintenance"
        )
        
        assert updated_status.isOpen is False
        assert updated_status.currentVisitors == 0
        assert updated_status.availableTables == 8
        assert updated_status.systemHealth == "maintenance"

    def test_get_venue_analytics(self, service, mock_venue_analytics):
        """Test getting venue analytics"""
        service.analytics[mock_venue_analytics.venueId] = [mock_venue_analytics]
        
        analytics = service.get_venue_analytics(
            venue_id=mock_venue_analytics.venueId,
            period="daily",
            limit=10
        )
        
        assert len(analytics) == 1
        assert analytics[0] == mock_venue_analytics

    def test_add_venue_analytics(self, service, mock_venue):
        """Test adding venue analytics"""
        service.venues[mock_venue.id] = mock_venue
        
        analytics = service.add_venue_analytics(
            venue_id=mock_venue.id,
            visitors=150,
            revenue=2500.0,
            matches=45,
            tournaments=2,
            average_rating=4.5
        )
        
        assert analytics.venueId == mock_venue.id
        assert analytics.visitors == 150
        assert analytics.revenue == 2500.0
        assert analytics.matches == 45
        assert analytics.tournaments == 2
        assert analytics.averageRating == 4.5

    def test_schedule_tournament(self, service, mock_venue):
        """Test scheduling tournament"""
        service.venues[mock_venue.id] = mock_venue
        
        tournament = service.schedule_tournament(
            venue_id=mock_venue.id,
            name="Weekly Championship",
            start_time="2025-02-01T18:00:00Z",
            end_time="2025-02-01T22:00:00Z",
            max_participants=32,
            entry_fee=50.0
        )
        
        assert tournament.id is not None
        assert tournament.venueId == mock_venue.id
        assert tournament.name == "Weekly Championship"
        assert tournament.maxParticipants == 32
        assert tournament.entryFee == 50.0
        assert tournament.id in service.tournaments

    def test_get_venue_tournaments(self, service, mock_venue):
        """Test getting venue tournaments"""
        service.venues[mock_venue.id] = mock_venue
        service.tournaments["tournament-1"] = TournamentSchedule(
            id="tournament-1",
            venueId=mock_venue.id,
            name="Tournament 1",
            startTime="2025-02-01T18:00:00Z",
            endTime="2025-02-01T22:00:00Z",
            maxParticipants=32,
            entryFee=50.0,
            status="scheduled"
        )
        
        tournaments = service.get_venue_tournaments(mock_venue.id)
        assert len(tournaments) == 1
        assert tournaments[0].id == "tournament-1"

    def test_update_tournament(self, service, mock_venue):
        """Test updating tournament"""
        service.venues[mock_venue.id] = mock_venue
        tournament = TournamentSchedule(
            id="tournament-1",
            venueId=mock_venue.id,
            name="Tournament 1",
            startTime="2025-02-01T18:00:00Z",
            endTime="2025-02-01T22:00:00Z",
            maxParticipants=32,
            entryFee=50.0,
            status="scheduled"
        )
        service.tournaments[tournament.id] = tournament
        
        updated_tournament = service.update_tournament(
            tournament_id=tournament.id,
            name="Updated Tournament",
            max_participants=64,
            entry_fee=75.0
        )
        
        assert updated_tournament.name == "Updated Tournament"
        assert updated_tournament.maxParticipants == 64
        assert updated_tournament.entryFee == 75.0

    def test_cancel_tournament(self, service, mock_venue):
        """Test canceling tournament"""
        service.venues[mock_venue.id] = mock_venue
        tournament = TournamentSchedule(
            id="tournament-1",
            venueId=mock_venue.id,
            name="Tournament 1",
            startTime="2025-02-01T18:00:00Z",
            endTime="2025-02-01T22:00:00Z",
            maxParticipants=32,
            entryFee=50.0,
            status="scheduled"
        )
        service.tournaments[tournament.id] = tournament
        
        result = service.cancel_tournament(tournament.id)
        
        assert result is True
        assert service.tournaments[tournament.id].status == "cancelled"

    def test_get_revenue_optimization(self, service, mock_venue):
        """Test getting revenue optimization recommendations"""
        service.venues[mock_venue.id] = mock_venue
        
        recommendations = service.get_revenue_optimization(mock_venue.id)
        
        assert recommendations is not None
        assert "pricing_recommendations" in recommendations
        assert "capacity_optimization" in recommendations
        assert "promotional_suggestions" in recommendations

    def test_get_performance_metrics(self, service, mock_venue):
        """Test getting performance metrics"""
        service.venues[mock_venue.id] = mock_venue
        
        metrics = service.get_performance_metrics(mock_venue.id)
        
        assert metrics is not None
        assert "utilization_rate" in metrics
        assert "revenue_per_table" in metrics
        assert "customer_satisfaction" in metrics
        assert "operational_efficiency" in metrics

    def test_create_alert(self, service, mock_venue):
        """Test creating alert"""
        service.venues[mock_venue.id] = mock_venue
        
        alert = service.create_alert(
            venue_id=mock_venue.id,
            type="maintenance",
            severity="medium",
            message="Table 3 needs repair",
            created_by="manager-1"
        )
        
        assert alert.id is not None
        assert alert.venueId == mock_venue.id
        assert alert.type == "maintenance"
        assert alert.severity == "medium"
        assert alert.message == "Table 3 needs repair"
        assert alert.id in service.alerts

    def test_get_venue_alerts(self, service, mock_venue):
        """Test getting venue alerts"""
        service.venues[mock_venue.id] = mock_venue
        service.alerts["alert-1"] = {
            "id": "alert-1",
            "venueId": mock_venue.id,
            "type": "maintenance",
            "severity": "medium",
            "message": "Table 3 needs repair",
            "status": "open"
        }
        
        alerts = service.get_venue_alerts(mock_venue.id)
        assert len(alerts) == 1
        assert alerts[0]["id"] == "alert-1"

    def test_resolve_alert(self, service, mock_venue):
        """Test resolving alert"""
        service.venues[mock_venue.id] = mock_venue
        service.alerts["alert-1"] = {
            "id": "alert-1",
            "venueId": mock_venue.id,
            "type": "maintenance",
            "severity": "medium",
            "message": "Table 3 needs repair",
            "status": "open"
        }
        
        result = service.resolve_alert("alert-1", "resolved by technician")
        
        assert result is True
        assert service.alerts["alert-1"]["status"] == "resolved"

    def test_get_venue_health_check(self, service, mock_venue):
        """Test getting venue health check"""
        service.venues[mock_venue.id] = mock_venue
        
        health = service.get_venue_health_check(mock_venue.id)
        
        assert health is not None
        assert "overall_health" in health
        assert "system_status" in health
        assert "issues" in health
        assert "recommendations" in health

    def test_get_owner_venues(self, service, mock_venue):
        """Test getting venues owned by user"""
        service.venues[mock_venue.id] = mock_venue
        
        venues = service.get_owner_venues(mock_venue.ownerId)
        assert len(venues) == 1
        assert venues[0].id == mock_venue.id

    def test_search_venues(self, service, mock_venue):
        """Test searching venues"""
        service.venues[mock_venue.id] = mock_venue
        
        results = service.search_venues("test")
        assert len(results) == 1
        assert results[0].id == mock_venue.id

    def test_get_venue_statistics(self, service, mock_venue):
        """Test getting venue statistics"""
        service.venues[mock_venue.id] = mock_venue
        
        stats = service.get_venue_statistics(mock_venue.id)
        
        assert stats is not None
        assert "total_visitors" in stats
        assert "total_revenue" in stats
        assert "total_matches" in stats
        assert "total_tournaments" in stats

    @patch('src.services.venue.EnhancedVenueManagementService.socketio')
    def test_broadcast_venue_update(self, mock_socketio, service, mock_venue):
        """Test broadcasting venue updates"""
        mock_socket = Mock()
        mock_socketio.return_value = mock_socket
        service.connect_socket()
        
        service.broadcast_venue_update(mock_venue)
        
        mock_socket.emit.assert_called_with(
            'venue_update',
            mock_venue.dict()
        )

    @patch('src.services.venue.EnhancedVenueManagementService.socketio')
    def test_broadcast_venue_status(self, mock_socketio, service, mock_venue_status):
        """Test broadcasting venue status"""
        mock_socket = Mock()
        mock_socketio.return_value = mock_socket
        service.connect_socket()
        
        service.broadcast_venue_status(mock_venue_status)
        
        mock_socket.emit.assert_called_with(
            'venue_status_update',
            mock_venue_status.dict()
        )

    @patch('src.services.venue.EnhancedVenueManagementService.socketio')
    def test_broadcast_venue_alert(self, mock_socketio, service, mock_venue):
        """Test broadcasting venue alert"""
        mock_socket = Mock()
        mock_socketio.return_value = mock_socket
        service.connect_socket()
        
        alert = service.create_alert(
            venue_id=mock_venue.id,
            type="maintenance",
            severity="medium",
            message="Table 3 needs repair",
            created_by="manager-1"
        )
        
        service.broadcast_venue_alert(alert)
        
        mock_socket.emit.assert_called_with(
            'venue_alert',
            alert.dict()
        )

    def test_get_venue_capacity_optimization(self, service, mock_venue):
        """Test getting venue capacity optimization"""
        service.venues[mock_venue.id] = mock_venue
        
        optimization = service.get_venue_capacity_optimization(mock_venue.id)
        
        assert optimization is not None
        assert "current_utilization" in optimization
        assert "optimal_capacity" in optimization
        assert "recommendations" in optimization

    def test_get_venue_competitor_analysis(self, service, mock_venue):
        """Test getting venue competitor analysis"""
        service.venues[mock_venue.id] = mock_venue
        
        analysis = service.get_venue_competitor_analysis(mock_venue.id)
        
        assert analysis is not None
        assert "competitors" in analysis
        assert "market_position" in analysis
        assert "competitive_advantages" in analysis

    def test_get_venue_maintenance_schedule(self, service, mock_venue):
        """Test getting venue maintenance schedule"""
        service.venues[mock_venue.id] = mock_venue
        
        schedule = service.get_venue_maintenance_schedule(mock_venue.id)
        
        assert schedule is not None
        assert "upcoming_maintenance" in schedule
        assert "maintenance_history" in schedule
        assert "recommended_schedule" in schedule 