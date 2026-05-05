import socket
try:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('localhost', 0))
        print(f"Success: bound to {s.getsockname()}")
except Exception as e:
    print(f"Error: {e}")
