# Territory Claiming and Challenge Rules

## Overview

The Territory Wars system introduces strategic competition where players can claim, defend, and challenge control over real-world pool venues. This document outlines the complete ruleset governing territory ownership, challenges, and conflict resolution.

## Core Concepts

### Territory States

1. **Unclaimed Territory**
   - No current owner
   - Can be claimed by any authenticated player
   - No defense score required

2. **Claimed Territory**
   - Owned by a player or clan
   - Has defense score and level
   - Can be challenged by other players
   - Subject to decay over time

3. **Contested Territory**
   - Currently being challenged
   - Has a contest deadline (24 hours)
   - Cannot be claimed or challenged again until resolved
   - Winner takes ownership

4. **Defended Territory**
   - Recently successfully defended (temporary status)
   - Enhanced defense bonus for short period

## Territory Claiming

### Eligibility

- Any authenticated player can claim an unclaimed territory
- Players can own multiple territories (no hard limit)
- Clans can collectively own territories through their members

### Claim Process

1. **Initiate Claim**
   - Player clicks "Claim" on unclaimed territory
   - System validates territory is unclaimed
   - System checks player authentication

2. **Ownership Transfer**
   - Territory ownership immediately transfers to claimant
   - Venue's controlling clan updates to claimant's clan (if applicable)
   - Territory status changes to "CLAIMED"
   - `lastOwnershipChange` timestamp updates

3. **Initial Setup**
   - Territory starts at level 1
   - Defense score starts at 0
   - Resources initialize as empty
   - Strategic value calculated based on venue properties

### Claim Restrictions

- Cannot claim already claimed territories
- Cannot claim contested territories
- Must have valid authentication
- Rate limited: 5 claims per hour per player

## Territory Challenges

### Challenge Eligibility

- Only claimed territories can be challenged
- Cannot challenge your own territory
- Cannot challenge territories you already contest
- Players can have multiple active challenges

### Challenge Process

1. **Initiate Challenge**
   - Challenger selects "Challenge" on target territory
   - System validates challenge eligibility
   - Contest deadline set to 24 hours from initiation

2. **Contest Period**
   - Territory status changes to "CONTESTED"
   - `contestedBy` field set to challenger ID
   - `contestDeadline` set to 24 hours ahead
   - Both players receive notifications

3. **Contest Resolution**

   **Option A: Tournament/Match Resolution**
   - System can trigger a tournament or match
   - Winner of tournament/match takes territory
   - Loser pays DojoCoin stake (if applicable)

   **Option B: Time-Based Resolution**
   - If no tournament/match occurs within 24 hours
   - Original owner retains territory
   - Contest automatically expires
   - Challenger can try again later

4. **Victory Conditions**
   - **Challenger Wins**: Takes ownership, all resources, and venue control
   - **Defender Wins**: Retains ownership, gains defense bonus
   - Territory level may increase on successful defense

### Challenge Restrictions

- Maximum 3 active challenges per player
- Cannot challenge same territory twice in 24 hours
- Cannot challenge territories with active contests
- Rate limited: 10 challenges per hour per player

## Territory Defense System

### Defense Score

- Ranges from 0 to 20
- Higher scores make territory harder to challenge
- Defense score affects contest difficulty and duration

### Defense Mechanics

1. **Base Defense**
   - Starts at 0 for newly claimed territories
   - Increases through territory management actions
   - Decreases through decay over time

2. **Defense Upgrades**
   - Players can spend resources to upgrade defense
   - Maximum upgrade: +5 defense per action
   - Cooldown: 1 hour between upgrades

3. **Defense Decay**
   - **30 days inactive**: -1 defense per month
   - **60 days inactive**: -2 defense per month
   - **90+ days inactive**: Territory becomes unclaimed

### Defense Bonuses

- **Recent Defense Bonus**: +2 defense for 24 hours after successful defense
- **Clan Defense Bonus**: +1 defense per clan member actively playing
- **Venue Quality Bonus**: Based on venue rating and features

## Territory Resources

### Resource Types

- **Gold**: Primary currency for upgrades and actions
- **Wood**: Construction and defense materials
- **Iron**: Advanced upgrade components
- **Strategic Points**: Special resource for high-value territories

### Resource Generation

- Base generation rate per territory level
- Bonus rates based on venue activity
- Daily/weekly caps to prevent exploitation

### Resource Management

- Players can allocate resources to defense
- Resources transfer to winner in contests
- Resources decay if territory becomes unclaimed

## Territory Levels

### Level Progression

- Starts at level 1
- Increases through successful defenses and upgrades
- Maximum level: 10

### Level Benefits

| Level | Defense Bonus | Resource Rate | Strategic Value |
| ----- | ------------- | ------------- | --------------- |
| 1     | 0             | 1x            | Base            |
| 2-3   | +1            | 1.2x          | +10%            |
| 4-5   | +2            | 1.5x          | +25%            |
| 6-7   | +3            | 1.8x          | +50%            |
| 8-10  | +4            | 2x            | +100%           |

### Level Up Conditions

- Accumulate strategic points through activity
- Successfully defend territory multiple times
- Invest resources in territory development

## Clan Integration

### Clan Territory Ownership

- Territories can be owned by clans (not individual players)
- Clan ownership provides collective benefits
- Clan members share defense responsibilities

### Clan Benefits

- **Shared Defense**: Clan members contribute to defense score
- **Resource Pooling**: Resources shared across clan territories
- **Strategic Coordination**: Clan-wide territory management
- **Reputation Boost**: Clan gains reputation from territory control

### Clan Territory Transfer

- Individual owners can transfer territories to their clan
- Clan leaders can redistribute territories among members
- Transfer requires mutual consent (owner + clan leader)

## Decay and Maintenance

### Territory Decay Rules

1. **Activity Tracking**
   - `lastOwnershipChange` tracks last ownership transfer
   - `lastActivity` tracks last management action
   - System monitors both timestamps

2. **Decay Stages**

   **Warning Stage (30-59 days)**
   - Defense score decreases gradually
   - Owner receives decay warnings
   - Can be prevented by territory management

   **Critical Stage (60-89 days)**
   - Defense score decreases faster
   - Owner receives urgent notifications
   - Last chance to prevent decay

   **Terminal Stage (90+ days)**
   - Territory becomes unclaimed
   - All ownership rights lost
   - Resources redistributed

3. **Decay Prevention**
   - Perform management actions
   - Successfully defend challenges
   - Transfer ownership to active player

### Maintenance Actions

- **Resource Allocation**: Add resources to territory
- **Defense Upgrade**: Increase defense score
- **Ownership Transfer**: Transfer to active player
- **Activity Logging**: Any management action resets decay timer

## Contest Resolution System

### Tournament Integration

When a challenge occurs, the system can:

1. **Automatic Tournament Creation**
   - Creates tournament with challenger vs defender
   - Tournament format: Best of 3 matches
   - Winner takes territory and resources

2. **Match-Based Resolution**
   - Single match between challenger and defender
   - Higher stake DojoCoin amounts
   - Immediate resolution

3. **Time-Based Resolution**
   - If no tournament/match arranged
   - Original owner retains control
   - Challenger can retry after cooldown

### Contest Deadlines

- **Standard Contest**: 24 hours
- **Extended Contest**: 72 hours (for high-level territories)
- **Clan Contest**: 48 hours (clan vs clan challenges)

### Resolution Outcomes

**Challenger Victory:**

- Gains territory ownership
- Receives all territory resources
- Gains strategic points
- Defender loses defense bonus temporarily

**Defender Victory:**

- Retains territory ownership
- Gains defense bonus (+2 for 24 hours)
- Territory level may increase
- Challenger enters cooldown period

## Administrative Rules

### System Maintenance

- Admins can manually trigger decay processing
- Admins can resolve stuck contests
- Admins can adjust territory parameters
- Admins can transfer ownership for inactive players

### Anti-Abuse Measures

- Rate limiting on all territory actions
- Duplicate challenge prevention
- Inactive territory cleanup
- Suspicious activity monitoring

### Emergency Procedures

- **Contest Stalemate**: Admin can force resolution
- **Inactive Owner**: Admin can transfer ownership
- **System Error**: Admin can manually adjust territory state
- **Dispute Resolution**: Admin mediation for conflicts

## Integration with Game Systems

### Tournament System

- Territory contests can spawn tournaments
- Tournament winners gain territory control
- Losers pay entry fees to winner

### Match System

- Direct challenges between players
- Match results determine territory ownership
- DojoCoin stakes add competitive element

### Notification System

- Real-time updates on territory status
- Challenge notifications
- Decay warnings
- Contest deadline alerts

### Analytics System

- Territory ownership tracking
- Challenge success rates
- Player activity metrics
- Strategic value analysis

## Balance Considerations

### Risk vs Reward

- **High-Risk Territories**: High strategic value, high defense requirements
- **Low-Risk Territories**: Easier to claim, lower rewards
- **Balanced Competition**: Defense scaling prevents monopolies

### Player Progression

- New players start with accessible territories
- Experienced players tackle high-value targets
- Skill-based progression through successful challenges

### Economic Balance

- Resource generation prevents grinding
- Territory decay prevents hoarding
- Challenge stakes encourage competitive play

## Future Expansions

### Planned Features

- **Territory Alliances**: Multiple clans controlling one territory
- **Territory Events**: Random events affecting territory status
- **Seasonal Territories**: Limited-time special territories
- **Territory Trading**: Player-to-player territory marketplace

### Advanced Mechanics

- **Territory Upgrades**: Buildings and special abilities
- **Strategic Positioning**: Territory adjacency bonuses
- **Global Events**: World-affecting territory events
- **Achievement System**: Territory-related achievements and rewards

This ruleset provides a comprehensive framework for competitive territory gameplay while maintaining balance and encouraging strategic thinking.
