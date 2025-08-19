import psutil
import time
import os
import json
import subprocess
from datetime import datetime
from typing import List, Dict, Optional
from pathlib import Path

CURSOR_CONFIG_PATH = os.path.expanduser("~/AppData/Roaming/Cursor/config.json")

def get_cursor_processes() -> List[psutil.Process]:
    """Get all Cursor processes."""
    return [p for p in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'cmdline'])
            if 'cursor' in p.info['name'].lower()]

def analyze_cursor_processes() -> Dict:
    """Analyze Cursor processes and their resource usage."""
    processes = get_cursor_processes()
    total_cpu = sum(p.info['cpu_percent'] for p in processes)
    total_memory = sum(p.info['memory_percent'] for p in processes)
    
    return {
        'timestamp': datetime.now().isoformat(),
        'process_count': len(processes),
        'total_cpu': total_cpu,
        'total_memory': total_memory,
        'processes': [{
            'pid': p.pid,
            'cpu_percent': p.info['cpu_percent'],
            'memory_percent': p.info['memory_percent'],
            'command': ' '.join(p.info['cmdline'] if p.info['cmdline'] else []),
            'create_time': datetime.fromtimestamp(p.create_time()).isoformat() if hasattr(p, 'create_time') else None
        } for p in processes]
    }

def optimize_cursor_config():
    """Optimize Cursor configuration for better performance."""
    if not os.path.exists(CURSOR_CONFIG_PATH):
        print("⚠️ Cursor config file not found")
        return False
    
    try:
        with open(CURSOR_CONFIG_PATH, 'r') as f:
            config = json.load(f)
        
        # Backup original config
        backup_path = CURSOR_CONFIG_PATH + '.backup'
        with open(backup_path, 'w') as f:
            json.dump(config, f, indent=2)
        
        # Apply optimizations
        optimizations = {
            'editor.suggest.snippetsPreventQuickSuggestions': True,
            'editor.suggest.showWords': False,
            'editor.hover.delay': 1000,
            'editor.quickSuggestionsDelay': 200,
            'files.autoSave': 'off',
            'workbench.enablePreview': False,
            'search.followSymlinks': False,
            'files.watcherExclude': {
                '**/.git/objects/**': True,
                '**/.git/subtree-cache/**': True,
                '**/node_modules/**': True,
                '**/.hg/store/**': True,
                '**/venv/**': True,
                '**/__pycache__/**': True
            }
        }
        
        config.update(optimizations)
        
        with open(CURSOR_CONFIG_PATH, 'w') as f:
            json.dump(config, f, indent=2)
        
        print("✅ Applied performance optimizations to Cursor config")
        print("📝 Backup saved to:", backup_path)
        return True
    
    except Exception as e:
        print(f"❌ Error optimizing config: {str(e)}")
        return False

def close_inactive_windows():
    """Close Cursor windows that appear to be inactive."""
    processes = get_cursor_processes()
    closed_count = 0
    
    for proc in processes:
        try:
            if proc.cpu_percent() < 1.0 and proc.memory_percent() < 0.5:
                proc.terminate()
                closed_count += 1
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    
    return closed_count

def restart_cursor():
    """Restart Cursor with optimized settings."""
    processes = get_cursor_processes()
    
    # Terminate all Cursor processes
    for proc in processes:
        try:
            proc.terminate()
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    
    time.sleep(2)  # Wait for processes to terminate
    
    # Start a new Cursor instance
    try:
        subprocess.Popen(['C:\\Users\\malli\\AppData\\Local\\Programs\\cursor\\Cursor.exe'])
        return True
    except Exception as e:
        print(f"❌ Error restarting Cursor: {str(e)}")
        return False

def monitor_usage(duration_seconds: int = 60):
    """Monitor Cursor usage over time."""
    print(f"📊 Monitoring Cursor usage for {duration_seconds} seconds...")
    samples = []
    
    start_time = time.time()
    while time.time() - start_time < duration_seconds:
        analysis = analyze_cursor_processes()
        samples.append({
            'timestamp': analysis['timestamp'],
            'cpu': analysis['total_cpu'],
            'memory': analysis['total_memory']
        })
        time.sleep(5)
    
    # Calculate averages
    avg_cpu = sum(s['cpu'] for s in samples) / len(samples)
    avg_memory = sum(s['memory'] for s in samples) / len(samples)
    
    print("\n📈 Usage Statistics:")
    print(f"Average CPU Usage: {avg_cpu:.1f}%")
    print(f"Average Memory Usage: {avg_memory:.1f}%")
    
    # Save monitoring data
    with open('cursor_monitoring.json', 'w') as f:
        json.dump(samples, f, indent=2)

def optimize_cursor():
    """Analyze and optimize Cursor processes."""
    print("🔍 Analyzing Cursor processes...")
    analysis = analyze_cursor_processes()
    
    print(f"\n📊 Current Cursor Usage:")
    print(f"Number of instances: {analysis['process_count']}")
    print(f"Total CPU Usage: {analysis['total_cpu']:.1f}%")
    print(f"Total Memory Usage: {analysis['total_memory']:.1f}%")
    
    print("\n🔍 Individual Process Details:")
    for proc in analysis['processes']:
        print(f"\nPID: {proc['pid']}")
        print(f"CPU Usage: {proc['cpu_percent']:.1f}%")
        print(f"Memory Usage: {proc['memory_percent']:.1f}%")
        if proc['command']:
            print(f"Command: {proc['command']}")
        if proc.get('create_time'):
            print(f"Running since: {proc['create_time']}")
    
    print("\n💡 Optimization Recommendations:")
    if analysis['process_count'] > 3:
        print("- Multiple Cursor instances detected. Consider closing unused windows.")
    
    if analysis['total_cpu'] > 200:
        print("- High CPU usage detected. Recommendations:")
        print("  • Close unused Cursor windows")
        print("  • Disable or reduce auto-completion features temporarily")
        print("  • Check for any stuck/frozen instances")
    
    # Save analysis to file
    with open('cursor_analysis.json', 'w') as f:
        json.dump(analysis, f, indent=2)
    
    print("\n✅ Analysis saved to cursor_analysis.json")
    print("\n⚡ Quick Actions Available:")
    print("1. Close inactive Cursor windows")
    print("2. Optimize Cursor settings")
    print("3. Restart Cursor with optimized settings")
    print("4. Monitor Cursor usage over time")
    
    while True:
        choice = input("\nEnter action number (or press Enter to exit): ")
        
        if not choice:
            break
        
        if choice == '1':
            closed = close_inactive_windows()
            print(f"Closed {closed} inactive windows")
        
        elif choice == '2':
            if optimize_cursor_config():
                print("Settings optimized. Please restart Cursor to apply changes.")
        
        elif choice == '3':
            print("Restarting Cursor...")
            if restart_cursor():
                print("✅ Cursor restarted successfully")
        
        elif choice == '4':
            monitor_usage()
        
        else:
            print("Invalid choice")

if __name__ == "__main__":
    print("Starting Cursor optimization...")
    success = optimize_cursor_config()
    if success:
        print("Optimization applied successfully.")
    else:
        print("Optimization failed.")
    restart_success = restart_cursor()
    if restart_success:
        print("Cursor restarted successfully.")
    else:
        print("Failed to restart Cursor.") 