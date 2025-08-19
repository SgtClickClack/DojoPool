"""
Seed script for initial achievements in DojoPool.

This script creates the foundational achievements that players can earn
through various gameplay activities.
"""

import json
import asyncio
from prisma import Prisma


async def seed_achievements():
    """Seed the database with initial achievements."""
    prisma = Prisma()
    await prisma.connect()

    try:
        # Define initial achievements
        achievements = [
            {
                'name': 'First Victory',
                'description': 'Win your first pool match',
                'icon': '🏆',
                'points': 10,
                'category': 'game',
                'criteria': json.dumps([
                    {'type': 'matches_won', 'value': 1, 'operator': '>='}
                ]),
                'rarity': 0.0,
                'isSecret': False
            },
            {
                'name': 'Win Streak',
                'description': 'Win 5 matches in a row',
                'icon': '🔥',
                'points': 25,
                'category': 'game',
                'criteria': json.dumps([
                    {'type': 'win_streak', 'value': 5, 'operator': '>='}
                ]),
                'rarity': 0.0,
                'isSecret': False
            },
            {
                'name': 'Unstoppable',
                'description': 'Win 10 matches in a row',
                'icon': '⚡',
                'points': 50,
                'category': 'game',
                'criteria': json.dumps([
                    {'type': 'win_streak', 'value': 10, 'operator': '>='}
                ]),
                'rarity': 0.0,
                'isSecret': False
            },
            {
                'name': 'Tournament Champion',
                'description': 'Win your first tournament',
                'icon': '👑',
                'points': 100,
                'category': 'tournament',
                'criteria': json.dumps([
                    {'type': 'tournaments_won', 'value': 1, 'operator': '>='}
                ]),
                'rarity': 0.0,
                'isSecret': False
            },
            {
                'name': 'Tournament Master',
                'description': 'Win 5 tournaments',
                'icon': '🏅',
                'points': 250,
                'category': 'tournament',
                'criteria': json.dumps([
                    {'type': 'tournaments_won', 'value': 5, 'operator': '>='}
                ]),
                'rarity': 0.0,
                'isSecret': False
            },
            {
                'name': 'Territory Controller',
                'description': 'Control your first venue',
                'icon': '🏢',
                'points': 75,
                'category': 'territory',
                'criteria': json.dumps([
                    {'type': 'territories_controlled', 'value': 1, 'operator': '>='}
                ]),
                'rarity': 0.0,
                'isSecret': False
            },
            {
                'name': 'Empire Builder',
                'description': 'Control 5 venues',
                'icon': '🏛️',
                'points': 200,
                'category': 'territory',
                'criteria': json.dumps([
                    {'type': 'territories_controlled', 'value': 5, 'operator': '>='}
                ]),
                'rarity': 0.0,
                'isSecret': False
            },
            {
                'name': 'Century Club',
                'description': 'Win 100 matches',
                'icon': '💯',
                'points': 150,
                'category': 'game',
                'criteria': json.dumps([
                    {'type': 'matches_won', 'value': 100, 'operator': '>='}
                ]),
                'rarity': 0.0,
                'isSecret': False
            },
            {
                'name': 'Perfect Game',
                'description': 'Win a match without your opponent scoring',
                'icon': '🎯',
                'points': 30,
                'category': 'game',
                'criteria': json.dumps([
                    {'type': 'perfect_game', 'value': 1, 'operator': '>='}
                ]),
                'rarity': 0.0,
                'isSecret': False
            },
            {
                'name': 'Social Butterfly',
                'description': 'Participate in 10 tournaments',
                'icon': '🦋',
                'points': 40,
                'category': 'social',
                'criteria': json.dumps([
                    {'type': 'tournaments_entered', 'value': 10, 'operator': '>='}
                ]),
                'rarity': 0.0,
                'isSecret': False
            }
        ]

        # Create achievements
        created_achievements = []
        for achievement_data in achievements:
            try:
                achievement = await prisma.achievement.create(data=achievement_data)
                created_achievements.append(achievement)
                print(f"✅ Created achievement: {achievement.name}")
            except Exception as e:
                print(f"❌ Failed to create achievement {achievement_data['name']}: {e}")

        print(f"\n🎉 Successfully created {len(created_achievements)} achievements!")

        # Display summary
        print("\n📊 Achievement Summary:")
        for achievement in created_achievements:
            print(f"  • {achievement.name} ({achievement.points} pts) - {achievement.description}")

    except Exception as e:
        print(f"❌ Error seeding achievements: {e}")
        raise
    finally:
        await prisma.disconnect()


if __name__ == "__main__":
    print("🌱 Starting achievement seeding...")
    asyncio.run(seed_achievements())
    print("✨ Achievement seeding completed!")
