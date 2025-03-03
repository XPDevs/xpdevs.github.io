@echo off

echo Choose an option:
echo 1. Run a single executable
echo 2. Run all executables in a folder

set /p choice=Enter your choice (1 or 2):

if "%choice%"=="1" goto single_exe
if "%choice%"=="2" goto folder_exe
goto end

:single_exe
set exe_file=
set /p exe_file=Enter the name of the executable file:
call :run_exe "%exe_file%" /s /x /b"" /v"/qn"
goto end

:folder_exe
set folder=
set /p folder=Enter the folder path containing the executables:
for %%f in ("%folder%*.exe") do call :run_exe "%%f" /s /x /b"" /v"/qn"
goto end

:run_exe
echo ' error_handler.vbs > error_handler.vbs
echo On Error Resume Next >> error_handler.vbs
echo Set objShell = CreateObject("WScript.Shell") >> error_handler.vbs
echo objShell.Run WScript.Arguments(0) & " " & WScript.Arguments(1), 0, True >> error_handler.vbs
echo If Err.Number ^<^> 0 Then >> error_handler.vbs
echo MsgBox "Error running: " & WScript.Arguments(0) & " " & WScript.Arguments(1), vbCritical, "Error" >> error_handler.vbs
echo End If >> error_handler.vbs
cscript //nologo error_handler.vbs "%~1" "%~2"
del error_handler.vbs
goto :eof

:end
echo Done.

