# LabelCraft Desktop Print Helper

This is a local helper service for enabling silent printing directly from the web browser to a physical printer on Windows. It is designed to be robust and zero-touch.

## Installation & Startup

1. **Install:** Run `install-helper.bat`. This script requires NO administrator privileges. It sets up the helper as a background service via Windows Task Scheduler that starts on login and runs a watchdog to restart automatically if it crashes.
2. **Start:** The installer launches the helper immediately. It will survive reboots and crashes indefinitely without any manual intervention.
3. **Usage:** The helper runs silently on `http://127.0.0.1:9999`.

## Uninstall

To remove the helper and its background tasks, run `uninstall-helper.bat`.

## Endpoints

- `GET /printers`: Returns a JSON array of installed printer names.
- `POST /print`: Accepts a JSON payload `{ imageBase64, printerName, widthMm, heightMm }`. It queues the print job and returns success. Note: Success only indicates the job was handed off to the Windows print spooler.
