# DojoPool Schema Evolution Analysis Guide

## Overview

The Schema Evolution Analysis system is part of DojoPool's Post-Hardening Sprint, designed to continuously optimize database performance based on real production telemetry data. This system leverages existing monitoring infrastructure to provide data-driven schema optimization recommendations.

## Architecture

### Core Components

1. **SchemaEvolutionService** (`src/database/schema-evolution.service.ts`)
   - Analyzes slow query patterns from logs
   - Correlates with telemetry data
   - Generates optimization recommendations
   - Tracks implementation status

2. **Enhanced Monitoring System**
   - DatabasePerformanceService: Real-time metrics collection
   - SlowQueryLoggerService: Query performance tracking
   - TelemetryService: User behavior analytics

3. **API Endpoints** (via MonitoringController)
   - `GET /monitoring/schema-evolution` - Generate evolution report
   - `GET /monitoring/schema-optimizations` - List all optimizations
   - `POST /monitoring/schema-optimization/:id/implement` - Mark as implemented
   - `GET /monitoring/schema-evolution/export` - Export report as JSON

## How It Works

### Data Sources

The system analyzes data from multiple sources:

1. **Slow Query Logs**: Captures queries exceeding 1-second threshold
2. **Database Metrics**: Connection counts, table sizes, index usage
3. **Telemetry Events**: User behavior patterns, feature usage
4. **System Performance**: Response times, error rates, uptime

### Analysis Process

1. **Pattern Recognition**: Identifies frequently slow queries and tables
2. **Correlation Analysis**: Links slow queries to user behavior patterns
3. **Impact Assessment**: Estimates performance improvements
4. **Recommendation Generation**: Creates prioritized optimization suggestions

### Optimization Types

The system recommends four types of optimizations:

#### 1. Index Optimizations

- Identifies high-cardinality columns without indexes
- Finds unused indexes for removal
- Suggests composite indexes for common query patterns

#### 2. Table Partitioning

- Recommends partitioning for tables >500MB
- Suggests hash partitioning for even distribution
- Considers time-based partitioning for historical data

#### 3. Data Archiving

- Identifies rarely accessed old data
- Suggests archival strategies to reduce table size
- Recommends archival candidates based on access patterns

#### 4. Compression

- Suggests compression for read-heavy tables
- Optimizes storage efficiency
- Reduces I/O overhead

## Usage

### CLI Tool

Run the analysis using the CLI script:

```bash
# Basic analysis (30 days)
node scripts/schema-evolution-analysis.js

# Analyze specific time period
node scripts/schema-evolution-analysis.js --days 7

# Export detailed report
node scripts/schema-evolution-analysis.js --export schema-report.json --verbose

# Show help
node scripts/schema-evolution-analysis.js --help
```

### API Usage

#### Generate Evolution Report

```bash
curl -X GET "http://localhost:3000/monitoring/schema-evolution?days=30"
```

Response includes:

- Summary statistics
- Prioritized optimization recommendations
- Performance impact estimates
- Implementation next steps

#### Get All Optimizations

```bash
curl -X GET "http://localhost:3000/monitoring/schema-optimizations"
```

#### Mark Optimization as Implemented

```bash
curl -X POST "http://localhost:3000/monitoring/schema-optimization/{optimization_id}/implement"
```

#### Export Report

```bash
curl -X GET "http://localhost:3000/monitoring/schema-evolution/export?days=30"
```

## Example Output

```
🔍 DojoPool Schema Evolution Analysis
=====================================

📊 Analysis Summary:
   Total Optimizations: 8
   High Priority: 3
   Estimated Performance Gain: 245%

🔧 Recommended Optimizations:
1. 🔴 INDEX: Add composite index for user creation queries
   Table: User
   Impact: 65% performance gain
   Risk: LOW

2. 🔴 PARTITION: Partition match history table by date ranges
   Table: Match
   Impact: 70% performance gain
   Risk: MEDIUM

3. 🟡 ARCHIVE: Archive content older than 90 days
   Table: Content
   Impact: 25% performance gain
   Risk: LOW
```

## Integration with Existing Systems

### Monitoring Stack

- Integrates with existing Prometheus/Grafana setup
- Extends current slow query monitoring
- Enhances telemetry event processing

### CI/CD Pipeline

- Can be integrated into deployment pipelines
- Automated schema analysis before releases
- Performance regression detection

### Alerting

- Can trigger alerts for critical optimizations
- Performance degradation notifications
- Automated optimization recommendations

## Best Practices

### Regular Analysis

- Run analysis weekly during development
- Monthly analysis in production
- After major feature releases

### Implementation Strategy

1. Review high-priority optimizations first
2. Test in staging environment
3. Monitor performance impact
4. Gradually implement medium/low priority items

### Risk Assessment

- LOW risk: Index additions, archival
- MEDIUM risk: Table partitioning, compression
- HIGH risk: Schema refactoring (rarely recommended)

## Performance Impact Tracking

The system tracks:

- Before/after performance metrics
- Implementation success rates
- ROI of optimizations
- Trend analysis over time

## Future Enhancements

Potential improvements:

- Machine learning for predictive optimization
- Automated implementation of safe optimizations
- Integration with database migration tools
- Cross-region performance analysis
- Cost-benefit analysis for optimizations

## Troubleshooting

### Common Issues

1. **No Data Available**
   - Ensure telemetry events are being recorded
   - Check slow query logging configuration
   - Verify database connectivity

2. **High Number of Recommendations**
   - Review database design patterns
   - Consider architectural improvements
   - Evaluate query optimization strategies

3. **Performance Impact During Analysis**
   - Run during off-peak hours
   - Optimize analysis queries
   - Cache frequently accessed metrics

## Support

For issues or questions:

- Check existing monitoring dashboards
- Review slow query logs manually
- Consult database performance documentation
- Review telemetry event schemas
