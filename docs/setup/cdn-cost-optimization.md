# CDN Cost Optimization Setup Guide

## Overview

This guide provides step-by-step instructions for setting up and configuring the CDN cost optimization system in DojoPool. The system helps monitor, analyze, and optimize CDN costs through automated analysis and recommendations.

## Prerequisites

### System Requirements

- Python 3.8 or higher
- Node.js 16 or higher
- PostgreSQL 13 or higher
- Redis 6 or higher
- AWS CLI configured with appropriate permissions

### Dependencies

```bash
# Python dependencies
pip install boto3==1.26.0
pip install pandas==1.5.0
pip install numpy==1.23.0
pip install matplotlib==3.6.0
pip install prometheus-client==0.16.0

# Node.js dependencies
npm install @mui/material@5.11.0
npm install recharts@2.4.0
npm install react-query@3.39.0
npm install date-fns@2.29.0
```

## Installation

### 1. Backend Setup

1. **Clone the Repository**

```bash
git clone https://github.com/your-org/dojo-pool.git
cd dojo-pool
```

2. **Set Up Virtual Environment**

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install Dependencies**

```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### 2. Frontend Setup

1. **Install Dependencies**

```bash
cd frontend
npm install
```

2. **Build Frontend**

```bash
npm run build
```

## Configuration

### 1. Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dojopool
DB_USER=admin
DB_PASSWORD=secure_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region

# CDN Configuration
CDN_PROVIDER=cloudfront
CDN_DISTRIBUTION_ID=your_distribution_id

# Optimization Settings
COST_THRESHOLD=1000
BANDWIDTH_THRESHOLD=1000000
REQUEST_THRESHOLD=1000000
OPTIMIZATION_INTERVAL=3600
```

### 2. Database Setup

1. **Create Database**

```bash
createdb dojopool
```

2. **Run Migrations**

```bash
flask db upgrade
```

### 3. Redis Setup

1. **Start Redis Server**

```bash
redis-server
```

2. **Verify Connection**

```bash
redis-cli ping
```

## Initial Configuration

### 1. CDN Cost Service

1. **Initialize Service**

```python
from dojopool.services.cdn.cost import CDNCostService

# Initialize the service
cost_service = CDNCostService(
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region=os.getenv('AWS_REGION'),
    distribution_id=os.getenv('CDN_DISTRIBUTION_ID')
)

# Start cost monitoring
cost_service.start_monitoring()
```

2. **Configure Optimization Parameters**

```python
# Set optimization thresholds
cost_service.set_thresholds(
    cost_threshold=float(os.getenv('COST_THRESHOLD')),
    bandwidth_threshold=float(os.getenv('BANDWIDTH_THRESHOLD')),
    request_threshold=float(os.getenv('REQUEST_THRESHOLD'))
)

# Set optimization interval
cost_service.set_optimization_interval(
    interval=int(os.getenv('OPTIMIZATION_INTERVAL'))
)
```

### 2. Monitoring Setup

1. **Configure Prometheus**

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'cdn_cost'
    static_configs:
      - targets: ['localhost:8000']
```

2. **Set Up Grafana Dashboard**

- Import the dashboard configuration from `src/features/venues/config/grafana-dashboard.json`
- Configure data source to point to your Prometheus instance
- Set up alert notifications

3. **Configure Alert Rules**

- Import alert rules from `src/features/venues/config/prometheus-alerts.yml`
- Configure alert manager for notifications

## Usage

### 1. Cost Analysis

```python
# Get current cost report
report = cost_service.get_cost_report()

# Analyze usage patterns
patterns = cost_service.analyze_usage_patterns()

# Generate cost forecast
forecast = cost_service.generate_cost_forecast()
```

### 2. Optimization

```python
# Run manual optimization
optimization_result = cost_service.optimize_costs()

# Check optimization status
status = cost_service.get_optimization_status()

# Get optimization recommendations
recommendations = cost_service.get_recommendations()
```

### 3. Monitoring

```python
# Get current metrics
metrics = cost_service.get_metrics()

# Check alert conditions
alerts = cost_service.check_alert_conditions()

# Get performance data
performance = cost_service.get_performance_data()
```

## Troubleshooting

### Common Issues

1. **AWS Authentication Errors**
   - Verify AWS credentials
   - Check IAM permissions
   - Ensure region is correct

2. **Database Connection Issues**
   - Verify database credentials
   - Check database service status
   - Ensure migrations are up to date

3. **Redis Connection Issues**
   - Verify Redis server is running
   - Check connection parameters
   - Ensure Redis port is accessible

4. **Monitoring Issues**
   - Check Prometheus configuration
   - Verify Grafana data source
   - Ensure alert rules are properly configured

### Debugging

1. **Enable Debug Logging**

```python
import logging

logging.basicConfig(level=logging.DEBUG)
```

2. **Check Service Status**

```python
status = cost_service.get_status()
print(status)
```

3. **View Error Logs**

```bash
tail -f logs/cdn_cost.log
```

## Best Practices

1. **Regular Monitoring**
   - Set up daily cost reviews
   - Monitor usage patterns
   - Track optimization results

2. **Optimization Strategy**
   - Start with conservative thresholds
   - Gradually adjust based on results
   - Document optimization decisions

3. **Security**
   - Rotate AWS credentials regularly
   - Use IAM roles with least privilege
   - Encrypt sensitive data

4. **Performance**
   - Schedule optimizations during off-peak hours
   - Monitor system resource usage
   - Optimize database queries

## Next Steps

1. **Review Documentation**
   - [API Reference](../api/cdn/cost.md)
   - [Component Documentation](../components/cdn-cost-dashboard.md)
   - [Performance Testing](../testing/performance.md)

2. **Set Up Monitoring**
   - Configure alert notifications
   - Set up performance dashboards
   - Establish baseline metrics

3. **Implement Optimization**
   - Start with basic optimizations
   - Monitor results
   - Adjust strategies as needed

## Support

For additional help:

- Check the [FAQ](../faq/cdn-cost-optimization.md)
- Join our [Discord community](https://discord.gg/dojopool)
- Open an [issue](https://github.com/your-org/dojo-pool/issues)
