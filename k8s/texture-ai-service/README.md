# TextureAIService Kubernetes Deployment

This directory contains the Kubernetes configuration files for deploying the TextureAIService to a production cluster.

## Overview

The TextureAIService is a Node.js/TypeScript microservice that provides AI-powered texture generation capabilities for the DojoPool Avatar Creation System. It uses Latent Diffusion Models to generate high-quality textures based on text prompts.

## Architecture

- **Deployment**: 3 replicas with rolling updates
- **Service**: ClusterIP with load balancing and headless service for direct pod communication
- **Ingress**: NGINX with SSL termination and custom domain routing
- **Storage**: Persistent volume for AI models (50GB)
- **Security**: Non-root containers, RBAC, and secret management

## Prerequisites

1. **Kubernetes Cluster**: Version 1.24+
2. **NGINX Ingress Controller**: For external access
3. **Cert-Manager**: For SSL certificate management
4. **Storage Class**: `fast-ssd` for model storage
5. **Container Registry**: Access to `dojopool/texture-ai-service` image

## Deployment Steps

### 1. Build and Push Container Image

```bash
# Build the Docker image
cd ../../
docker build -f docker/texture-ai-service/Dockerfile -t dojopool/texture-ai-service:latest .

# Tag for your registry
docker tag dojopool/texture-ai-service:latest your-registry.com/dojopool/texture-ai-service:latest

# Push to registry
docker push your-registry.com/dojopool/texture-ai-service:latest
```

### 2. Create Namespace

```bash
kubectl create namespace dojopool
```

### 3. Update Configuration

Before deploying, update the following files with your environment-specific values:

#### `configmap.yaml`

- Adjust `max-resolution`, `batch-size`, and `gpu-enabled` based on your cluster capabilities

#### `configmap.yaml` (Secrets section)

- Replace `CHANGE_ME` placeholders with actual credentials:
  - `mongodb-uri`: MongoDB connection string
  - `redis-url`: Redis connection string
  - `openai-api-key`: OpenAI API key (if using real AI models)
  - `huggingface-token`: Hugging Face token for model access

#### `deployment.yaml`

- Update the `image` field with your registry URL
- Adjust resource limits based on your cluster capacity
- Modify node selectors and tolerations for your cluster setup

#### `service.yaml`

- Update the `host` field in the Ingress with your domain
- Modify TLS certificate configuration

### 4. Deploy to Kubernetes

Deploy in the following order:

```bash
# 1. Deploy ConfigMap, Secrets, and RBAC
kubectl apply -f configmap.yaml

# 2. Deploy the main application
kubectl apply -f deployment.yaml

# 3. Deploy services and ingress
kubectl apply -f service.yaml
```

### 5. Verify Deployment

```bash
# Check pod status
kubectl get pods -n dojopool -l app=texture-ai-service

# Check service status
kubectl get svc -n dojopool -l app=texture-ai-service

# Check ingress status
kubectl get ingress -n dojopool

# View logs
kubectl logs -n dojopool -l app=texture-ai-service -f
```

## Configuration Options

### Environment Variables

| Variable                 | Description                | Default |
| ------------------------ | -------------------------- | ------- |
| `MAX_TEXTURE_RESOLUTION` | Maximum texture resolution | `2048`  |
| `TEXTURE_BATCH_SIZE`     | Processing batch size      | `4`     |
| `TEXTURE_GPU_ENABLED`    | Enable GPU acceleration    | `false` |
| `TEXTURE_CACHE_ENABLED`  | Enable result caching      | `true`  |
| `LOG_LEVEL`              | Logging level              | `info`  |

### Resource Requirements

| Resource         | Request | Limit |
| ---------------- | ------- | ----- |
| CPU              | 250m    | 1000m |
| Memory           | 512Mi   | 2Gi   |
| Storage (Models) | 50Gi    | -     |
| Storage (Cache)  | -       | 10Gi  |

## Monitoring and Health Checks

### Health Endpoints

- **Liveness Probe**: `GET /health` - Service health check
- **Readiness Probe**: `GET /ready` - Service readiness check
- **Metrics**: `GET /metrics` - Prometheus metrics

### Monitoring Integration

The service is configured for Prometheus monitoring with the following annotations:

- `prometheus.io/scrape: "true"`
- `prometheus.io/port: "3001"`
- `prometheus.io/path: "/metrics"`

## Scaling

### Horizontal Pod Autoscaler (HPA)

```bash
kubectl autoscale deployment texture-ai-service -n dojopool --cpu-percent=70 --min=3 --max=10
```

### Manual Scaling

```bash
kubectl scale deployment texture-ai-service -n dojopool --replicas=5
```

## Troubleshooting

### Common Issues

1. **Pod Startup Failures**

   ```bash
   kubectl describe pod -n dojopool -l app=texture-ai-service
   kubectl logs -n dojopool -l app=texture-ai-service
   ```

2. **Model Loading Issues**
   - Check PVC mount: `kubectl describe pvc texture-ai-models-pvc -n dojopool`
   - Verify model files are present in the volume

3. **Service Connectivity**

   ```bash
   kubectl port-forward -n dojopool svc/texture-ai-service 8080:80
   curl http://localhost:8080/health
   ```

4. **Ingress Issues**
   ```bash
   kubectl describe ingress texture-ai-service-ingress -n dojopool
   kubectl get certificaterequests -n dojopool
   ```

### Performance Tuning

1. **Enable GPU Support** (if available):
   - Set `TEXTURE_GPU_ENABLED=true` in ConfigMap
   - Add GPU node selectors and tolerations
   - Update resource requests to include GPU

2. **Optimize Batch Processing**:
   - Increase `TEXTURE_BATCH_SIZE` for higher throughput
   - Monitor memory usage and adjust limits accordingly

3. **Cache Optimization**:
   - Increase cache storage size for better performance
   - Consider using Redis for distributed caching

## Security Considerations

- Service runs as non-root user (UID 1001)
- RBAC configured with minimal required permissions
- Secrets managed through Kubernetes Secret objects
- Network policies can be added for additional isolation
- SSL/TLS termination at ingress level

## Maintenance

### Updates

```bash
# Update image
kubectl set image deployment/texture-ai-service -n dojopool texture-ai-service=dojopool/texture-ai-service:v1.1.0

# Check rollout status
kubectl rollout status deployment/texture-ai-service -n dojopool

# Rollback if needed
kubectl rollout undo deployment/texture-ai-service -n dojopool
```

### Backup

- Model files: Backup the PVC containing AI models
- Configuration: Version control all YAML files
- Secrets: Securely backup secret values

## Support

For issues and questions:

- Check logs: `kubectl logs -n dojopool -l app=texture-ai-service`
- Monitor metrics: Access Prometheus dashboard
- Review service status: `kubectl get all -n dojopool -l app=texture-ai-service`
