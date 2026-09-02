Option Explicit

Dim WshShell, fso, localAppData, logDir, logFile, objHTTP
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

localAppData = WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%")
logDir = localAppData & "\LabelCraftHelper\logs"

On Error Resume Next
If Not fso.FolderExists(localAppData & "\LabelCraftHelper") Then
    fso.CreateFolder(localAppData & "\LabelCraftHelper")
End If
If Not fso.FolderExists(logDir) Then
    fso.CreateFolder(logDir)
End If
On Error GoTo 0

Set logFile = fso.OpenTextFile(logDir & "\watchdog.log", 8, True)

Sub LogMessage(msg)
    logFile.WriteLine "[" & Now & "] " & msg
End Sub

Set objHTTP = CreateObject("MSXML2.ServerXMLHTTP.6.0")
' Timeouts in milliseconds: resolve, connect, send, receive
objHTTP.setTimeouts 2000, 2000, 2000, 2000

On Error Resume Next
objHTTP.Open "GET", "http://127.0.0.1:9999/", False
objHTTP.Send

Dim failed
failed = False

If Err.Number <> 0 Then
    LogMessage "HTTP Request failed: " & Err.Description
    failed = True
    Err.Clear
ElseIf objHTTP.Status <> 200 Then
    LogMessage "HTTP Status was not 200: " & objHTTP.Status
    failed = True
Else
    ' Read expected version
    Dim expectedVersion
    expectedVersion = ""
    If fso.FileExists(localAppData & "\LabelCraftHelper\version.txt") Then
        Dim ts
        Set ts = fso.OpenTextFile(localAppData & "\LabelCraftHelper\version.txt", 1)
        If Not ts.AtEndOfStream Then
            expectedVersion = Trim(ts.ReadLine())
        End If
        ts.Close
    End If
    
    Dim actualVersion
    actualVersion = objHTTP.getResponseHeader("X-Helper-Version")
    
    If expectedVersion <> "" And actualVersion <> expectedVersion Then
        LogMessage "Version mismatch! Expected " & expectedVersion & ", got " & actualVersion
        failed = True
    End If
End If
On Error GoTo 0

If failed Then
    LogMessage "Helper appears offline or stale. Restarting..."
    ' Kill any existing instances silently
    On Error Resume Next
    WshShell.Run "cmd.exe /c for /f """"tokens=5"""" %a in ('netstat -aon ^| findstr :9999') do taskkill /F /PID %a", 0, True
    WshShell.Run "taskkill /F /IM printer-helper.exe", 0, True
    On Error GoTo 0
    WScript.Sleep 1000
    
    Dim exePath
    exePath = localAppData & "\LabelCraftHelper\printer-helper.exe"
    
    ' Only launch if the executable actually exists
    If fso.FileExists(exePath) Then
        On Error Resume Next
        WshShell.Run Chr(34) & exePath & Chr(34), 0, False
        On Error GoTo 0
        LogMessage "Restart triggered."
    Else
        LogMessage "Error: Executable not found at " & exePath
    End If
End If

logFile.Close
