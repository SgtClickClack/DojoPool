# DojoPool Live Operations Runbooks

## Production Handoff Documentation

This document provides comprehensive operational procedures for managing the DojoPool platform in production. It covers service management, database operations, monitoring, incident response, and maintenance procedures.

## Table of Contents

### [1. Platform Overview](./platform-overview.md)

- Architecture overview
- Service dependencies
- Data flow diagrams
- Key performance indicators

### [2. Service Management](./services/)

- [API Service Operations](./services/api-service.md)
- [Web Service Operations](./services/web-service.md)
- [Database Operations](./services/database-operations.md)
- [Cache Management](./services/cache-management.md)
- [Background Job Processing](./services/job-processing.md)

### [3. Database Management](./database/)

- [PostgreSQL Operations](./database/postgresql-operations.md)
- [Backup and Recovery](./database/backup-recovery.md)
- [Performance Tuning](./database/performance-tuning.md)
- [Schema Migrations](./database/schema-migrations.md)

### [4. Monitoring & Alerting](./monitoring/)

- [Monitoring Setup](./monitoring/setup.md)
- [Alert Configuration](./monitoring/alerts.md)
- [Dashboard Overview](./monitoring/dashboards.md)
- [Log Management](./monitoring/logs.md)

### [5. Incident Response](./incidents/)

- [API High Error Rate](./incidents/api-high-error-rate.md)
- [Database Down](./incidents/database-down.md)
- [WebSocket Connection Issues](./incidents/websocket-connection-issues.md)
- [High Memory Usage](./incidents/high-memory-usage.md)
- [SSL Certificate Issues](./incidents/ssl-certificate-issues.md)

### [6. Deployment Procedures](./deployment/)

- [CI/CD Pipeline](./deployment/ci-cd-pipeline.md)
- [Blue-Green Deployments](./deployment/blue-green-deployment.md)
- [Rollback Procedures](./deployment/rollback-procedures.md)
- [Feature Flags](./deployment/feature-flags.md)

### [7. Security Operations](./security/)

- [Access Management](./security/access-management.md)
- [Security Monitoring](./security/security-monitoring.md)
- [Incident Response](./security/incident-response.md)
- [Compliance Procedures](./security/compliance.md)

### [8. Performance & Scaling](./performance/)

- [Auto-scaling Configuration](./performance/auto-scaling.md)
- [Performance Benchmarking](./performance/benchmarking.md)
- [Capacity Planning](./performance/capacity-planning.md)
- [CDN Management](./performance/cdn-management.md)

## Quick Reference

### Emergency Contacts

- **Production Issues**: #dojopool-production Slack channel
- **Security Incidents**: security@dojopool.com
- **Infrastructure Issues**: infrastructure@dojopool.com
- **On-call Engineer**: Check PagerDuty rotation

### Critical Commands

#### Service Status Check

```bash
# Check all services
kubectl get pods -n production

# Check API service health
curl -f https://api.dojopool.com/health

# Check database connectivity
kubectl exec -n production dojopool-postgresql-0 -- pg_isready -U dojo_user -d dojopool
```

#### Log Access

```bash
# API service logs
kubectl logs -n production deployment/dojopool-api --tail=100 --follow

# Database logs
kubectl logs -n production dojopool-postgresql-0 --tail=100

# Web service logs
kubectl logs -n production deployment/dojopool-web --tail=100
```

#### Service Restart

```bash
# Restart API service
kubectl rollout restart deployment/dojopool-api -n production

# Restart all services
kubectl rollout restart deployment -n production
```

### Key Metrics to Monitor

#### Service Health

- API response time (P95 < 2s)
- Error rate (< 5%)
- WebSocket connections (< 10,000)
- Database connections (< 80% of pool)

#### Performance

- CPU usage (< 70%)
- Memory usage (< 80%)
- Disk usage (< 80%)
- Network I/O

#### Business Metrics

- Daily active users
- Match completion rate
- Player retention
- Revenue metrics

## Daily Operations Checklist

### Morning Check (9 AM UTC)

- [ ] Review overnight alerts and incidents
- [ ] Check service health and performance metrics
- [ ] Verify backup completion
- [ ] Review security logs for anomalies
- [ ] Check disk space and resource usage

### Midday Check (12 PM UTC)

- [ ] Monitor user activity and system load
- [ ] Review error rates and performance
- [ ] Check for any pending deployments
- [ ] Verify third-party service status

### Evening Check (6 PM UTC)

- [ ] Review daily metrics and KPIs
- [ ] Check for any security updates
- [ ] Verify data consistency
- [ ] Prepare for overnight maintenance if needed

## Maintenance Windows

### Scheduled Maintenance

- **Weekly**: Sunday 2 AM - 4 AM UTC (Database maintenance)
- **Monthly**: First Monday 1 AM - 3 AM UTC (Security updates)
- **Quarterly**: System upgrades and major changes

### Emergency Maintenance

- Communicate 24 hours in advance
- Provide rollback plan
- Monitor impact throughout
- Post-mortem analysis required

## Communication Protocols

### Internal Communication

- Use Slack for day-to-day communication
- Use PagerDuty for critical alerts
- Use Jira for incident tracking
- Document all changes in Confluence

### External Communication

- Use status.dojopool.com for service status
- Use Twitter for major updates
- Use email for scheduled maintenance
- Provide clear timelines and impact assessments

## Escalation Procedures

### Severity Levels

1. **SEV-1 (Critical)**: Complete service outage, immediate escalation
2. **SEV-2 (High)**: Major feature degradation, <4 hour resolution
3. **SEV-3 (Medium)**: Minor issues, <24 hour resolution
4. **SEV-4 (Low)**: Non-critical issues, <1 week resolution

### Escalation Timeline

- **Immediate**: Notify on-call engineer
- **5 minutes**: Notify engineering lead
- **15 minutes**: Notify engineering manager
- **30 minutes**: Notify CTO
- **1 hour**: Notify CEO and stakeholders

## Security Considerations

### Access Control

- Use least privilege principle
- Rotate access keys regularly
- Enable multi-factor authentication
- Audit all access logs

### Data Protection

- Encrypt data at rest and in transit
- Regular security scans and penetration testing
- Monitor for data exfiltration attempts
- Maintain compliance with GDPR and CCPA

## Training Requirements

### Required Training

- Kubernetes operations
- Database administration
- Security best practices
- Incident response procedures
- Performance monitoring and tuning

### Certification Requirements

- AWS Certified Solutions Architect
- Kubernetes Certified Administrator (CKA)
- Certified Information Systems Security Professional (CISSP)

## Support and Resources

### Documentation

- This runbook repository
- API documentation at `/docs`
- Architecture diagrams in `/architecture`
- Troubleshooting guides in `/troubleshooting`

### Tools and Resources

- Monitoring: Grafana, Prometheus, Kibana
- Deployment: GitHub Actions, Helm, Kubernetes
- Communication: Slack, PagerDuty, Jira
- Version Control: GitHub Enterprise

### Vendor Support

- AWS Support (Enterprise)
- GitHub Support (Enterprise)
- Kubernetes Community Support
- Database vendor support (PostgreSQL, Redis)

---

## Production Launch Verification Checklist

### Pre-Launch Verification

#### ✅ Infrastructure Readiness

- [x] Kubernetes cluster configured and accessible
- [x] Auto-scaling policies configured (3-20 pods API, 2-12 pods Web)
- [x] Database configured with proper security
- [x] Redis cache configured and secured
- [x] Load balancers and ingress configured
- [x] SSL certificates installed and valid
- [x] DNS records configured and propagated

#### ✅ Application Readiness

- [x] All services deployed successfully
- [x] Health checks passing for all services
- [x] Database migrations completed
- [x] Environment variables configured
- [x] Secrets management in place
- [x] Feature flags set appropriately

#### ✅ Monitoring & Alerting

- [x] Prometheus collecting metrics
- [x] Grafana dashboards configured
- [x] Alert rules active and tested
- [x] Log aggregation working
- [x] Error tracking configured
- [x] Performance monitoring active

#### ✅ Security Verification

- [x] Security audit completed
- [x] No critical vulnerabilities found
- [x] Access controls configured
- [x] Network security policies in place
- [x] Data encryption verified
- [x] Backup procedures tested

### Post-Launch Verification (First 24 Hours)

#### Service Health

- [ ] All services responding to health checks
- [ ] API endpoints functional
- [ ] Web application loading correctly
- [ ] Database connections stable
- [ ] WebSocket connections working
- [ ] CDN serving content properly

#### Performance Metrics

- [ ] API response times within acceptable range (< 2s P95)
- [ ] Error rates below threshold (< 5%)
- [ ] CPU usage within limits (< 70%)
- [ ] Memory usage within limits (< 80%)
- [ ] Auto-scaling responding to load

#### User Experience

- [ ] User registration working
- [ ] Authentication flow functional
- [ ] Basic gameplay features operational
- [ ] Mobile responsiveness verified
- [ ] Cross-browser compatibility confirmed

#### Monitoring Validation

- [ ] Metrics being collected and stored
- [ ] Alerts triggering appropriately
- [ ] Dashboard data updating correctly
- [ ] Log aggregation working
- [ ] Performance data available

### Emergency Rollback Procedures

#### Quick Rollback (0-5 minutes)

```bash
# Rollback to previous deployment
kubectl rollout undo deployment/dojopool-api -n production
kubectl rollout undo deployment/dojopool-web -n production

# Verify rollback
kubectl rollout status deployment/dojopool-api -n production
kubectl rollout status deployment/dojopool-web -n production
```

#### Full System Rollback (5-15 minutes)

```bash
# Scale down new deployment
kubectl scale deployment dojopool-api-new --replicas=0 -n production
kubectl scale deployment dojopool-web-new --replicas=0 -n production

# Scale up previous deployment
kubectl scale deployment dojopool-api --replicas=3 -n production
kubectl scale deployment dojopool-web --replicas=2 -n production
```

#### Database Rollback (15-30 minutes)

```bash
# Restore from backup
kubectl exec -n production dojopool-postgresql-0 -- pg_restore -U dojo_user -d dojopool /backups/pre-launch-backup.sql

# Verify data integrity
kubectl exec -n production deployment/dojopool-api -- node -e "
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  // Verify critical data integrity
"
```

## Final Notes

This runbook represents the complete operational knowledge for managing DojoPool in production. Regular updates and improvements should be made based on real-world experience and lessons learned from incidents.

**Last Updated**: January 11, 2025
**Version**: 1.0.0
**Authors**: DojoPool Engineering Team

## 📞 Emergency Contacts

### Primary Escalation

- **On-Call Engineer**: PagerDuty rotation
- **Engineering Lead**: [Name] - [Email] - [Phone]
- **DevOps Lead**: [Name] - [Email] - [Phone]
- **Security Officer**: [Name] - [Email] - [Phone]

### External Support

- **AWS Support**: Enterprise support case
- **GitHub Support**: Enterprise support
- **Kubernetes Community**: Slack #kubernetes-users
