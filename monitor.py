import psutil
import time
import logging
from datetime import datetime
from typing import Dict, List, Deque
from collections import deque, defaultdict
import statistics

# Store historical data for trending
CPU_HISTORY = deque(maxlen=60)  # Last 5 minutes
MEMORY_HISTORY = deque(maxlen=60)
NETWORK_HISTORY = deque(maxlen=60)
PROCESS_HISTORY = {}

# Previous network counters for calculating rates
PREV_NET_IO = None
PREV_NET_TIME = None

def setup_logging():
    """Setup basic logging configuration."""
    logging.basicConfig(
        filename='performance.log',
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    return logging.getLogger(__name__)

def get_process_command(pid):
    """Get process command line safely."""
    try:
        process = psutil.Process(pid)
        return ' '.join(process.cmdline())
    except (psutil.NoSuchProcess, psutil.AccessDenied):
        return "N/A"

def get_network_usage():
    """Get network usage in MB/s."""
    global PREV_NET_IO, PREV_NET_TIME
    
    current_net_io = psutil.net_io_counters()
    current_time = time.time()
    
    if PREV_NET_IO is None or PREV_NET_TIME is None:
        PREV_NET_IO = current_net_io
        PREV_NET_TIME = current_time
        return {'sent': 0, 'received': 0}
    
    time_elapsed = current_time - PREV_NET_TIME
    
    # Calculate MB/s
    bytes_sent = (current_net_io.bytes_sent - PREV_NET_IO.bytes_sent) / time_elapsed / (1024 * 1024)
    bytes_recv = (current_net_io.bytes_recv - PREV_NET_IO.bytes_recv) / time_elapsed / (1024 * 1024)
    
    PREV_NET_IO = current_net_io
    PREV_NET_TIME = current_time
    
    return {'sent': bytes_sent, 'received': bytes_recv}

def group_processes_by_name(processes: List[Dict]) -> Dict[str, Dict]:
    """Group processes by base name and sum their resources."""
    groups = defaultdict(lambda: {'cpu_percent': 0, 'memory_percent': 0, 'instances': 0, 'pids': []})
    
    for proc in processes:
        name = proc['name']
        groups[name]['cpu_percent'] += proc.get('cpu_percent', 0)
        groups[name]['memory_percent'] += proc.get('memory_percent', 0)
        groups[name]['instances'] += 1
        groups[name]['pids'].append(proc['pid'])
    
    return dict(groups)

def get_process_details(include_grouped=True) -> Dict:
    """Get detailed process information including grouped stats."""
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
        try:
            pinfo = proc.info
            pinfo['cmd'] = get_process_command(proc.pid)
            processes.append(pinfo)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    
    # Sort by CPU usage
    processes.sort(key=lambda x: x.get('cpu_percent', 0), reverse=True)
    
    if include_grouped:
        grouped = group_processes_by_name(processes)
        # Sort grouped processes by total CPU usage
        grouped = dict(sorted(grouped.items(), key=lambda x: x[1]['cpu_percent'], reverse=True))
        return {'individual': processes[:5], 'grouped': grouped}
    
    return {'individual': processes[:5], 'grouped': {}}

def get_trend(values: deque) -> str:
    """Calculate trend from historical data."""
    if len(values) < 2:
        return "➡️"
    avg_first_half = statistics.mean(list(values)[:len(values)//2])
    avg_second_half = statistics.mean(list(values)[len(values)//2:])
    diff = avg_second_half - avg_first_half
    if diff > 5:
        return "⬆️"
    elif diff < -5:
        return "⬇️"
    return "➡️"

def collect_metrics():
    """Collect detailed system metrics with historical data."""
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    cpu_percent = psutil.cpu_percent(interval=1)
    network = get_network_usage()
    process_details = get_process_details()
    
    # Store historical data
    CPU_HISTORY.append(cpu_percent)
    MEMORY_HISTORY.append(memory.percent)
    NETWORK_HISTORY.append(network['received'] + network['sent'])
    
    return {
        'timestamp': datetime.now(),
        'cpu': {
            'percent': cpu_percent,
            'count': psutil.cpu_count(),
            'freq': psutil.cpu_freq().current if hasattr(psutil.cpu_freq(), 'current') else None,
            'processes': process_details,
            'trend': get_trend(CPU_HISTORY)
        },
        'memory': {
            'percent': memory.percent,
            'used_gb': memory.used / (1024 ** 3),
            'total_gb': memory.total / (1024 ** 3),
            'trend': get_trend(MEMORY_HISTORY)
        },
        'disk': {
            'percent': disk.percent,
            'used_gb': disk.used / (1024 ** 3),
            'total_gb': disk.total / (1024 ** 3)
        },
        'network': {
            'sent_mbs': network['sent'],
            'received_mbs': network['received'],
            'trend': get_trend(NETWORK_HISTORY)
        }
    }

def analyze_process(pinfo: Dict) -> str:
    """Analyze process behavior and provide recommendations."""
    pid = pinfo['pid']
    if pid in PROCESS_HISTORY:
        history = PROCESS_HISTORY[pid]
        cpu_avg = statistics.mean(history['cpu_samples'])
        if cpu_avg > 50:
            return f"⚠️ Consistently high CPU usage ({cpu_avg:.1f}% avg)"
        elif len(history['cpu_samples']) > 6 and all(x > 30 for x in list(history['cpu_samples'])[-6:]):
            return "⚠️ Sustained moderate CPU usage"
    return ""

def format_process_list(processes: List[Dict], metric: str) -> str:
    """Format process list for display with analysis."""
    result = []
    for p in processes:
        value = p.get(metric, 0)
        analysis = analyze_process(p)
        cmd = p.get('cmd', 'N/A')[:50] + '...' if len(p.get('cmd', 'N/A')) > 50 else p.get('cmd', 'N/A')
        result.append(f"  - {p['name']} (PID: {p['pid']}): {value:.1f}%")
        if analysis:
            result.append(f"    {analysis}")
        if cmd != "N/A":
            result.append(f"    CMD: {cmd}")
    return '\n'.join(result)

def display_metrics(metrics: Dict):
    """Display formatted metrics with trends and grouped processes."""
    print(f"\n📊 System Metrics ({metrics['timestamp']})")
    
    # CPU Section
    print(f"\n🔄 CPU: {metrics['cpu']['trend']}")
    print(f"  Usage: {metrics['cpu']['percent']}%")
    print(f"  Cores: {metrics['cpu']['count']}")
    if metrics['cpu']['freq']:
        print(f"  Frequency: {metrics['cpu']['freq']/1000:.1f} GHz")
    
    # Grouped Process Display
    print("\n  📦 Grouped Processes (Total Resource Usage):")
    for name, stats in list(metrics['cpu']['processes']['grouped'].items())[:5]:
        print(f"  - {name} ({stats['instances']} instances):")
        print(f"    CPU: {stats['cpu_percent']:.1f}% | Memory: {stats['memory_percent']:.1f}%")
    
    # Memory Section
    print(f"\n💾 Memory: {metrics['memory']['trend']}")
    print(f"  Usage: {metrics['memory']['percent']}%")
    print(f"  Used: {metrics['memory']['used_gb']:.1f}GB / {metrics['memory']['total_gb']:.1f}GB")
    
    # Network Section
    print(f"\n🌐 Network: {metrics['network']['trend']}")
    print(f"  Upload: {metrics['network']['sent_mbs']:.2f} MB/s")
    print(f"  Download: {metrics['network']['received_mbs']:.2f} MB/s")
    
    # Disk Section
    print("\n💿 Disk:")
    print(f"  Usage: {metrics['disk']['percent']}%")
    print(f"  Used: {metrics['disk']['used_gb']:.1f}GB / {metrics['disk']['total_gb']:.1f}GB")

def get_optimization_suggestions(metrics: Dict) -> List[str]:
    """Generate optimization suggestions based on metrics."""
    suggestions = []
    
    # CPU optimizations
    if metrics['cpu']['percent'] > 70:
        grouped_procs = metrics['cpu']['processes']['grouped']
        high_cpu_apps = [name for name, stats in grouped_procs.items() 
                        if stats['cpu_percent'] > 20]
        if high_cpu_apps:
            suggestions.append(f"🔄 Consider closing or investigating high CPU apps: {', '.join(high_cpu_apps)}")
    
    # Memory optimizations
    if metrics['memory']['percent'] > 80:
        suggestions.append("💾 High memory usage detected. Consider closing unused applications.")
    
    # Disk optimizations
    if metrics['disk']['percent'] > 85:
        suggestions.append("💿 Disk space is running low. Consider running disk cleanup.")
    
    return suggestions

def check_thresholds(metrics: Dict, logger: logging.Logger):
    """Check metrics against thresholds and provide detailed warnings with recommendations."""
    suggestions = get_optimization_suggestions(metrics)
    
    if suggestions:
        print("\n⚡ Optimization Suggestions:")
        for suggestion in suggestions:
            print(f"  {suggestion}")
            logger.warning(suggestion)

def main():
    logger = setup_logging()
    print("🚀 Starting enhanced performance monitoring...")
    print("Press Ctrl+C to stop")
    
    try:
        while True:
            metrics = collect_metrics()
            display_metrics(metrics)
            check_thresholds(metrics, logger)
            time.sleep(5)  # Check every 5 seconds
            
    except KeyboardInterrupt:
        print("\n🛑 Stopping monitoring...")
    finally:
        print("✅ Monitoring stopped. Check performance.log for full results.")

if __name__ == "__main__":
    main() 