import time
import ctypes
from ctypes import wintypes
import requests
import sys
import os

# Define Windows API Requirements
user32 = ctypes.windll.user32
psapi = ctypes.windll.psapi
kernel32 = ctypes.windll.kernel32

BACKEND_URL = "http://localhost:5000/app_log"
CHECK_INTERVAL = 5  # Seconds

def get_active_window_info():
    """Get the active window title and process name."""
    hwnd = user32.GetForegroundWindow()
    
    # Get Window Title
    length = user32.GetWindowTextLengthW(hwnd)
    buff = ctypes.create_unicode_buffer(length + 1)
    user32.GetWindowTextW(hwnd, buff, length + 1)
    title = buff.value
    
    # Get Process ID
    pid = wintypes.DWORD()
    user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
    
    # Get Process Name
    app_name = "Unknown"
    try:
        # PROCESS_QUERY_INFORMATION | PROCESS_VM_READ
        process_handle = kernel32.OpenProcess(0x0410, False, pid.value)
        if process_handle:
            image_name = (ctypes.c_char * 512)()
            # GetProcessImageFileName is better for some system processes than GetModuleBaseName
            if psapi.GetProcessImageFileNameA(process_handle, image_name, 512) > 0:
                full_path = image_name.value.decode()
                app_name = full_path.split('\\')[-1] # Extract just the .exe name
            kernel32.CloseHandle(process_handle)
    except Exception as e:
        # print(f"Error getting process: {e}")
        pass
        
    return app_name, title

def send_activity(app_name, duration):
    """Send activity data to the backend."""
    try:
        payload = {
            "app": app_name,
            "duration": duration
        }
        # print(f"Sending: {payload}")
        requests.post(BACKEND_URL, json=payload, timeout=2)
    except Exception as e:
        print(f"Failed to send to backend: {e}")

def main():
    print("🚀 Windows Activity Tracker Started...")
    print(f"📡 Sending data to {BACKEND_URL}")
    print("Press Ctrl+C to stop.")
    
    last_app = None
    start_time = time.time()
    
    try:
        while True:
            current_app, current_title = get_active_window_info()
            
            # Simple deduplication/aggregation logic
            # In a real loop, we just accumulate time. 
            # Here we send a 'pulse' every CHECK_INTERVAL seconds for the active app.
            
            if current_app and current_app != "Unknown":
                print(f"Active: {current_app} | {current_title}")
                send_activity(current_app, CHECK_INTERVAL)
            
            time.sleep(CHECK_INTERVAL)
            
    except KeyboardInterrupt:
        print("\n🛑 Tracker stopped.")

if __name__ == "__main__":
    main()
