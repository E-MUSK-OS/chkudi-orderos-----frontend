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
End If
On Error GoTo 0

If failed Then
    LogMessage "Helper appears offline. Restarting..."
    ' Kill any existing instances silently
    On Error Resume Next
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
