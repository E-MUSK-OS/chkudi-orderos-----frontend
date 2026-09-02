const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const PORT = 9999;

// ⚡️ Bulletproof the server against silent background crashes
process.on('uncaughtException', (err) => {
  console.error('Caught exception:', err.message);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

function getPrinters() {
  try {
    const { execSync } = require('child_process');
    const result = execSync(
      'powershell -NoProfile -Command "Get-Printer | Select-Object -ExpandProperty Name"',
      { encoding: 'utf8', timeout: 5000 }
    );
    return result.split('\n').map(p => p.trim()).filter(p => p.length > 0);
  } catch (err) {
    return [];
  }
}

// ⚡️ MATHEMATICAL MILLIMETER LOCK PRINT FUNCTION ⚡️
function printImage(base64Image, printerName, widthMm, heightMm, callback) {
  // Use crypto to ensure zero file-name collisions during rapid bulk printing
  const tmpId = crypto.randomUUID();
  const tmpImg = path.join(os.tmpdir(), `label-${tmpId}.png`);
  const tmpPs1 = path.join(os.tmpdir(), `print-${tmpId}.ps1`);

  try {
    fs.writeFileSync(tmpImg, Buffer.from(base64Image, 'base64'));
  } catch (err) {
    return callback(new Error('Failed to write temporary image: ' + err.message));
  }

  // ⚡️ SECURITY: widthMm/heightMm arrive over the network (this server accepts
  // requests from any origin — see CORS headers below) and get spliced directly
  // into a PowerShell script string further down. If we don't force them to be
  // real finite numbers here, a crafted value could break out of the numeric
  // context and inject arbitrary PowerShell into that script. Number() turns any
  // non-clean-numeric input into NaN, which we then reject in favor of a safe
  // default — so nothing but a real number ever reaches the script.
  const safeW = Number(widthMm);
  const safeH = Number(heightMm);
  const exactW = Number.isFinite(safeW) && safeW > 0 ? safeW : 100;
  const exactH = Number.isFinite(safeH) && safeH > 0 ? safeH : 50;

  if (typeof printerName !== 'string' || !printerName.trim()) {
    return callback(new Error('Invalid printer name'));
  }

  // Optimized PowerShell script
  const ps1Content = `
Add-Type -AssemblyName System.Drawing
try {
    $imgPath = '${tmpImg.replace(/'/g, "''")}'
    $img = [System.Drawing.Image]::FromFile($imgPath)
    $doc = New-Object System.Drawing.Printing.PrintDocument
    $doc.PrinterSettings.PrinterName = '${printerName.replace(/'/g, "''")}'
    $doc.DocumentName = "LabelCraft Print"
    $doc.PrintController = New-Object System.Drawing.Printing.StandardPrintController
    
    # ⚡️ 1. FORCE ZERO MARGINS
    $doc.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins(0, 0, 0, 0)
    $doc.OriginAtMargins = $false
    
    # ⚡️ 1b. LOCK THE PAPER SIZE TO THE EXACT LABEL DIMENSIONS (fixes the extra blank label)
    # Previously we let whatever paper size is saved in Windows Printer Preferences decide
    # the page size. If that saved size doesn't exactly match the physical label (very easy
    # for it to drift out of sync), the driver thinks the job is taller/wider than one
    # physical label and prints the overflow as a second, blank label. Setting an exact
    # custom PaperSize per job removes that ambiguity so every job is exactly one label.
    $widthHundredthsInch = [int](((${exactW}) / 25.4) * 100)
    $heightHundredthsInch = [int](((${exactH}) / 25.4) * 100)
    $paperSize = New-Object System.Drawing.Printing.PaperSize("LabelCraft Custom", $widthHundredthsInch, $heightHundredthsInch)
    $doc.DefaultPageSettings.PaperSize = $paperSize
    
    $handler = {
        param($sender, $e)
        
        # ⚡️ 2. PREVENT BLUR (Keep barcodes sharp)
        $e.Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
        $e.Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
        $e.Graphics.PageUnit = [System.Drawing.GraphicsUnit]::Millimeter
        
        # ⚡️ 3. THE HARDWARE NUDGE (Fixing the "printing on the left side" issue)
        # If your label prints too far left, change $offsetX to a positive number (e.g., 2.0). 
        # If it prints too high, change $offsetY to a positive number.
        $offsetX = 0.0  
        $offsetY = 0.0  
        
        # ⚡️ 4. THE 0.1mm SPILLOVER HACK (Stops the blank second label)
        # Drawing exactly at width/height causes a floating-point rounding error in the spooler.
        # Shrinking the draw box by a microscopic 0.1mm stops the blank page completely.
        $e.Graphics.DrawImage($img, [float]$offsetX, [float]$offsetY, [float](${exactW} - 0.1), [float](${exactH} - 0.1))
        $e.HasMorePages = $false
    }
    $doc.add_PrintPage($handler)
    $doc.Print()
    
    # Explicitly release the file lock so Node can delete it
    $img.Dispose()
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
} catch {
    Write-Error $_.Exception.Message
    exit 1
}
  `;

  try {
    fs.writeFileSync(tmpPs1, ps1Content, 'utf8');
  } catch (err) {
    try { fs.unlinkSync(tmpImg); } catch(e) {}
    return callback(new Error('Failed to write temporary PS script: ' + err.message));
  }

  // Execute the script
  exec(`powershell -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "${tmpPs1}"`, { timeout: 15000 }, (error, stdout, stderr) => {
    // ⚡️ Resilient cleanup: Retry once if file is briefly locked by Windows Defender
    setTimeout(() => {
      try { if (fs.existsSync(tmpImg)) fs.unlinkSync(tmpImg); } catch(err) {}
      try { if (fs.existsSync(tmpPs1)) fs.unlinkSync(tmpPs1); } catch(err) {}
    }, 1000);

    if (error) {
      callback(new Error(stderr || error.message));
    } else {
      callback(null);
    }
  });
}

// --- CONFIGURATION ---
// NOTE: this used to read from %APPDATA%\desktop-print-helper\config.json,
// but install-helper.bat has never installed to that folder — it installs
// to %LOCALAPPDATA%\LabelCraftHelper. That mismatch meant a config.json could
// never actually be found, so ALLOWED_ORIGINS silently fell back to the
// localhost-only default below on every worker PC, no matter what. Reading
// from the exe's own install folder instead fixes that.
let config = {};
try {
  const configPath = path.join(process.env.LOCALAPPDATA || '', 'LabelCraftHelper', 'config.json');
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.error("Failed to load config.json", e.message);
}

// Kept as a localhost-dev fallback only. The real production origin(s) now
// come from config.json (written by install-helper.bat) so they can be
// changed without ever rebuilding this exe again.
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000"
];
const configOrigins = Array.isArray(config.ALLOWED_ORIGINS) ? config.ALLOWED_ORIGINS : [];
const ALLOWED_ORIGINS = [...DEFAULT_ALLOWED_ORIGINS, ...configOrigins];

const DEFAULT_PRINT_TOKEN = "dev-secret-token-123";

const server = http.createServer((req, res) => {
  // CORS Headers for Private Network Access
  const requestOrigin = req.headers.origin;
  const originAllowed = requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin);
  if (originAllowed) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  }
  // Always send these on every response so the browser can read them.
  // Without Allow-Headers on the preflight, Chrome blocks the request
  // before the origin-check error is even visible — making it look like
  // the helper is offline when it is actually running fine.
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Print-Token');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(204); 
    res.end(); 
    return;
  }

  // Auth Check (require token for any non-OPTIONS request except the root heartbeat)
  if (req.url !== '/') {
    const expectedToken = config.PRINT_TOKEN || DEFAULT_PRINT_TOKEN;
    const providedToken = req.headers['x-print-token'];
    
    // Check against expected token
    if (!expectedToken || providedToken !== expectedToken) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Unauthorized' }));
      return;
    }
  }

  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1 style="color:green; font-family:sans-serif; text-align:center; margin-top:50px;">✅ LabelCraft Rapid-Fire Helper is Running!</h1>');
    return;
  }

  if (req.method === 'GET' && req.url === '/printers') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getPrinters()));
    return;
  }

  if (req.method === 'POST' && req.url === '/print') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        const { imageBase64, printerName, widthMm, heightMm } = parsed;
        
        if (!imageBase64 || !printerName) {
           res.writeHead(400, { 'Content-Type': 'application/json' });
           return res.end(JSON.stringify({ success: false, error: 'Missing parameters' }));
        }

        console.log(`\n⚡️ RAPID PRINT TRIGGERED FOR: ${printerName} [EXACT SIZE: ${widthMm}mm x ${heightMm}mm]`);
        
        // Respond immediately to free up the frontend
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, status: "queued" }));

        // Process print silently
        printImage(imageBase64, printerName, widthMm, heightMm, (err) => {
          if (err) console.log(`❌ FAILED: ${err.message}`);
          else console.log(`✅ SUCCESSFUL HARDWARE PUSH!`);
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
      }
    });
    return;
  }
  
  res.writeHead(404); 
  res.end();
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} in use. Duplicate instance exiting immediately.`);
    process.exit(1);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`LabelCraft Rapid-Fire Strict-Size Helper running on http://127.0.0.1:${PORT}`);
});