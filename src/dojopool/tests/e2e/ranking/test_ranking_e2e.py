import pytest
from playwright.sync_api import Page, expect
from datetime import datetime, timedelta

from dojopool.models.user import User
from dojopool.models.game import Game
from dojopool.models.tournament import Tournament
from dojopool.extensions import db


@pytest.fixture(autouse=True)
def setup_test_data(test_app):
    """Setup test data for e2e tests."""
    # Create test users
    users = []
    for i in range(1, 6):
        user = User(username=f"test_player_{i}", email=f"player{i}@test.com", is_active=True)
        users.append(user)
        db.session.add(user)

    # Create test games
    for i in range(20):
        winner = users[i % 4]
        loser = users[(i + 1) % 4]
        game = Game(
            winner_id=winner.id,
            loser_id=loser.id,
            completed_at=datetime.now() - timedelta(days=i),
            type="8_BALL",
        )
        db.session.add(game)

    # Create test tournament
    tournament = Tournament(
        name="Test Tournament",
        start_date=datetime.now() - timedelta(days=7),
        end_date=datetime.now() - timedelta(days=6),
        type="8_BALL",
    )
    db.session.add(tournament)

    db.session.commit()
    yield
    # Cleanup
    db.session.query(Game).delete()
    db.session.query(Tournament).delete()
    db.session.query(User).delete()
    db.session.commit()


def test_global_rankings_page_load(page: Page):
    """Test that global rankings page loads correctly."""
    # Navigate to rankings page
    page.goto("/rankings")

    # Check page title
    expect(page.locator("h4")).to_have_text("Global Rankings")

    # Check table headers
    headers = ["Rank", "Player", "Rating", "Tier", "Win Rate", "Games", "Activity", "Stats"]
    for header in headers:
        expect(page.get_by_text(header, exact=True)).to_be_visible()


def test_player_stats_modal(page: Page):
    """Test player statistics modal functionality."""
    # Navigate to rankings page
    page.goto("/rankings")

    # Click on first player row
    page.get_by_text("test_player_1").click()

    # Check modal content
    expect(page.get_by_text("Player Statistics")).to_be_visible()
    expect(page.get_by_text("Current Rating")).to_be_visible()
    expect(page.get_by_text("Global Rank")).to_be_visible()
    expect(page.get_by_text("Win Rate")).to_be_visible()
    expect(page.get_by_text("Total Games")).to_be_visible()

    # Check performance metrics
    metrics = ["Accuracy", "Consistency", "Speed", "Strategy"]
    for metric in metrics:
        expect(page.get_by_text(metric)).to_be_visible()

    # Close modal
    page.get_by_test_id("CloseIcon").click()
    expect(page.get_by_text("Player Statistics")).not_to_be_visible()


def test_rankings_pagination(page: Page):
    """Test rankings pagination functionality."""
    # Navigate to rankings page
    page.goto("/rankings")

    # Get initial first player
    first_player = page.get_by_role("cell").nth(1).text_content()

    # Go to next page
    page.get_by_role("button", name="Go to page 2").click()

    # Check that players are different
    new_first_player = page.get_by_role("cell").nth(1).text_content()
    assert first_player != new_first_player


def test_tier_icons_display(page: Page):
    """Test that tier icons display correctly."""
    # Navigate to rankings page
    page.goto("/rankings")

    # Check tier icons
    expect(page.get_by_test_id("EmojiEventsIcon")).to_be_visible()
    expect(page.get_by_test_id("StarIcon")).to_be_visible()


def test_activity_indicators(page: Page):
    """Test activity indicators functionality."""
    # Navigate to rankings page
    page.goto("/rankings")

    # Check activity indicators
    expect(page.get_by_test_id("TrendingUpIcon")).to_be_visible()
    expect(page.get_by_test_id("TrendingDownIcon")).to_be_visible()


def test_ranking_updates(page: Page, test_app):
    """Test that rankings update after new games."""
    # Navigate to rankings page
    page.goto("/rankings")

    # Get initial ratings
    initial_ratings = {}
    for i in range(1, 5):
        player = page.get_by_text(f"test_player_{i}")
        rating_cell = player.locator("..").locator("..").get_by_role("cell").nth(2)
        initial_ratings[f"test_player_{i}"] = float(rating_cell.text_content())

    # Add new games
    users = User.query.all()
    for i in range(5):
        game = Game(
            winner_id=users[0].id, loser_id=users[1].id, completed_at=datetime.now(), type="8_BALL"
        )
        db.session.add(game)
    db.session.commit()

    # Trigger ranking update
    page.get_by_role("button", name="Update Rankings").click()
    page.reload()

    # Check that ratings have changed
    for i in range(1, 5):
        player = page.get_by_text(f"test_player_{i}")
        rating_cell = player.locator("..").locator("..").get_by_role("cell").nth(2)
        new_rating = float(rating_cell.text_content())
        if i <= 2:  # Players involved in new games
            assert new_rating != initial_ratings[f"test_player_{i}"]


def test_performance_metrics_chart(page: Page):
    """Test performance metrics chart functionality."""
    # Navigate to rankings page
    page.goto("/rankings")

    # Open player stats modal
    page.get_by_text("test_player_1").click()

    # Check chart elements
    expect(page.get_by_text("Rating History")).to_be_visible()
    expect(page.locator("svg")).to_be_visible()
    expect(page.get_by_text("Performance Metrics")).to_be_visible()

    # Check metric values
    metrics = page.get_by_role("progressbar").all()
    assert len(metrics) == 4  # Four performance metrics


def test_achievement_display(page: Page):
    """Test achievement display functionality."""
    # Navigate to rankings page
    page.goto("/rankings")

    # Open player stats modal
    page.get_by_text("test_player_1").click()

    # Check achievements section
    expect(page.get_by_text("Recent Achievements")).to_be_visible()

    # Check achievement elements
    achievements = page.locator(".achievement-card").all()
    for achievement in achievements:
        expect(achievement.locator("img")).to_be_visible()
        expect(achievement.locator(".achievement-name")).to_be_visible()
        expect(achievement.locator(".achievement-date")).to_be_visible()


def test_error_handling(page: Page):
    """Test error handling in rankings page."""
    # Navigate to rankings page with network error
    page.route("**/api/rankings/**", lambda route: route.abort())
    page.goto("/rankings")

    # Check error message
    expect(page.get_by_text("Error loading rankings")).to_be_visible()

    # Test modal error handling
    page.unroute("**/api/rankings/**")
    page.reload()
    page.get_by_text("test_player_1").click()
    page.route("**/api/rankings/player/**", lambda route: route.abort())

    # Check error message in modal
    expect(page.get_by_text("Error loading player statistics")).to_be_visible()


def test_responsive_design(page: Page):
    """Test responsive design of rankings page."""
    # Test mobile view
    page.set_viewport_size({"width": 375, "height": 667})
    page.goto("/rankings")

    # Check that table is scrollable
    table = page.locator("table").first
    expect(table).to_be_visible()
    table_width = table.bounding_box()["width"]
    viewport_width = 375
    assert table_width <= viewport_width

    # Test tablet view
    page.set_viewport_size({"width": 768, "height": 1024})
    page.reload()

    # Check that more columns are visible
    for header in ["Rank", "Player", "Rating", "Tier"]:
        expect(page.get_by_text(header)).to_be_visible()

    # Test desktop view
    page.set_viewport_size({"width": 1920, "height": 1080})
    page.reload()

    # Check that all columns are visible
    for header in ["Rank", "Player", "Rating", "Tier", "Win Rate", "Games", "Activity", "Stats"]:
        expect(page.get_by_text(header)).to_be_visible()
