import socket

s = socket.socket()
try:
    s.bind(('0.0.0.0', 49152))
    print("SUCCESS: Python can bind to port 49152.")
except Exception as e:
    print(f"FAIL: {e}")
finally:
    s.close()
input("Press Enter to exit...")
