# DojoPool Technical Procedures for Incident Response

## 1. System Isolation Procedures

### A. Network Isolation

1. **Identify Affected Systems**

   ```bash
   # List active network connections
   netstat -antup

   # Check running processes
   ps aux | grep -i [suspicious_process]

   # Check system logs
   journalctl -xe
   ```

2. **Network Segmentation**

   ```bash
   # Block all incoming traffic
   iptables -P INPUT DROP

   # Block all outgoing traffic
   iptables -P OUTPUT DROP

   # Allow specific IPs if needed
   iptables -A INPUT -s [trusted_ip] -j ACCEPT
   iptables -A OUTPUT -d [trusted_ip] -j ACCEPT
   ```

3. **Service Isolation**

   ```bash
   # Stop affected services
   systemctl stop [service_name]

   # Disable service autostart
   systemctl disable [service_name]

   # Check service status
   systemctl status [service_name]
   ```

### B. Container Isolation

1. **Docker Containers**

   ```bash
   # List running containers
   docker ps

   # Stop suspicious container
   docker stop [container_id]

   # Network isolation
   docker network disconnect [network] [container_id]

   # Save container state
   docker commit [container_id] [image_name]_snapshot
   ```

2. **Kubernetes Pods**

   ```bash
   # List pods
   kubectl get pods -n [namespace]

   # Isolate pod
   kubectl isolate pod [pod_name] -n [namespace]

   # Network policy
   kubectl apply -f deny-all-network-policy.yaml
   ```

## 2. Evidence Collection Guidelines

### A. System Memory

1. **Memory Dump**

   ```bash
   # Using LiME
   insmod lime-[version].ko "path=/tmp/ram.lime format=lime"

   # Using volatility
   volatility -f /tmp/ram.lime imageinfo
   volatility -f /tmp/ram.lime --profile=[profile] pslist
   ```

2. **Process Memory**

   ```bash
   # Using gcore
   gcore -o /tmp/proc_dump [pid]

   # Using pmap
   pmap -x [pid] > /tmp/proc_map.txt
   ```

### B. Disk Evidence

1. **Disk Imaging**

   ```bash
   # Create disk image
   dd if=/dev/[device] of=/path/to/image.dd bs=4M status=progress

   # Create compressed image
   dd if=/dev/[device] | gzip -c > /path/to/image.dd.gz
   ```

2. **File System Analysis**

   ```bash
   # Check file modifications
   find / -mtime -1 -ls > /tmp/recent_files.txt

   # Check file permissions
   find / -perm -4000 -ls > /tmp/suid_files.txt
   ```

### C. Network Evidence

1. **Network Capture**

   ```bash
   # Start packet capture
   tcpdump -i any -w /tmp/capture.pcap

   # Analyze capture
   tshark -r /tmp/capture.pcap -q -z io,phs
   ```

2. **Connection Analysis**

   ```bash
   # Check connections
   netstat -antup > /tmp/connections.txt

   # Check routing
   route -n > /tmp/routing.txt
   ```

## 3. System Recovery Procedures

### A. Service Recovery

1. **Database Recovery**

   ```bash
   # Check database status
   systemctl status postgresql

   # Restore from backup
   pg_restore -d [database] /path/to/backup.dump

   # Verify integrity
   psql -d [database] -c "SELECT count(*) FROM [table];"
   ```

2. **Web Service Recovery**

   ```bash
   # Restore configuration
   cp /etc/nginx/nginx.conf.backup /etc/nginx/nginx.conf

   # Test configuration
   nginx -t

   # Restart service
   systemctl restart nginx
   ```

### B. Data Recovery

1. **File Recovery**

   ```bash
   # Check file system
   fsck /dev/[device]

   # Restore from backup
   rsync -av /backup/[date]/ /production/

   # Verify integrity
   sha256sum -c checksums.txt
   ```

2. **Permission Recovery**

   ```bash
   # Reset permissions
   chmod -R u=rwX,g=rX,o= /path/to/dir

   # Reset ownership
   chown -R [user]:[group] /path/to/dir
   ```

## 4. Security Update Protocols

### A. System Updates

1. **Package Updates**

   ```bash
   # Update package list
   apt update

   # Show security updates
   apt list --upgradable | grep -i security

   # Apply security updates
   apt upgrade -s # Simulate first
   apt upgrade
   ```

2. **Kernel Updates**

   ```bash
   # Check kernel version
   uname -a

   # Install kernel updates
   apt install linux-image-generic

   # Update bootloader
   update-grub
   ```

### B. Configuration Updates

1. **Security Hardening**

   ```bash
   # Update SSH config
   cp /etc/ssh/sshd_config.backup /etc/ssh/sshd_config
   chmod 600 /etc/ssh/sshd_config

   # Update firewall rules
   iptables-restore < /etc/iptables/rules.v4
   ```

2. **Service Hardening**

   ```bash
   # Update TLS configuration
   cp /etc/nginx/ssl.conf.backup /etc/nginx/ssl.conf
   nginx -t && systemctl reload nginx

   # Update PHP configuration
   cp /etc/php/7.4/fpm/php.ini.backup /etc/php/7.4/fpm/php.ini
   systemctl restart php7.4-fpm
   ```

## 5. Monitoring Setup

### A. Log Monitoring

1. **System Logs**

   ```bash
   # Configure rsyslog
   cat > /etc/rsyslog.d/security.conf << EOF
   auth,authpriv.* /var/log/auth.log
   *.alert /var/log/alerts.log
   EOF

   # Restart rsyslog
   systemctl restart rsyslog
   ```

2. **Application Logs**
   ```bash
   # Configure log rotation
   cat > /etc/logrotate.d/app << EOF
   /var/log/app/*.log {
       daily
       rotate 7
       compress
       delaycompress
       missingok
       notifempty
   }
   EOF
   ```

### B. Alert Configuration

1. **System Alerts**

   ```bash
   # Configure fail2ban
   cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

   # Update alert settings
   sed -i 's/bantime = 10m/bantime = 1h/' /etc/fail2ban/jail.local

   # Restart fail2ban
   systemctl restart fail2ban
   ```

2. **Service Alerts**

   ```bash
   # Configure monitoring service
   cat > /etc/prometheus/alerts.yml << EOF
   groups:
   - name: service_alerts
     rules:
     - alert: ServiceDown
       expr: up == 0
       for: 5m
   EOF

   # Reload configuration
   curl -X POST http://localhost:9090/-/reload
   ```

## 6. Documentation Procedures

### A. System Documentation

1. **Configuration Documentation**

   ```bash
   # Document system config
   uname -a > /docs/system_info.txt
   lsb_release -a >> /docs/system_info.txt

   # Document installed packages
   dpkg -l > /docs/packages.txt
   ```

2. **Network Documentation**
   ```bash
   # Document network config
   ip addr > /docs/network_config.txt
   iptables-save > /docs/firewall_rules.txt
   ```

### B. Change Documentation

1. **Change Logging**

   ```bash
   # Log configuration changes
   echo "$(date): $USER modified $file" >> /var/log/config_changes.log

   # Create change summary
   diff -u $file.old $file.new > /var/log/changes/$(date +%Y%m%d)_$file.diff
   ```

2. **Audit Logging**

   ```bash
   # Configure audit rules
   auditctl -w /etc/passwd -p wa -k identity
   auditctl -w /etc/group -p wa -k identity

   # Review audit logs
   ausearch -k identity -ts today
   ```
