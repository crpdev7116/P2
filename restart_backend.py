import os
import subprocess
import sys

def kill_port_8000():
    try:
        output = subprocess.check_output("netstat -ano | findstr :8000", shell=True, text=True, stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError:
        return

    pids = set()
    for line in output.splitlines():
        parts = line.split()
        if len(parts) >= 5:
            pid = parts[-1].strip()
            if pid.isdigit():
                pids.add(pid)

    for pid in pids:
        try:
            subprocess.run(f"taskkill /PID {pid} /F", shell=True, check=False)
        except Exception:
            pass

def start_backend():
    # Start backend in a detached shell window
    cmd = 'start "backend-api" cmd /k "python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000"'
    subprocess.run(cmd, shell=True, check=False)

if __name__ == "__main__":
    kill_port_8000()
    start_backend()
    print("Backend restarted on http://127.0.0.1:8000")
