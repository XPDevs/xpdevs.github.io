@echo off
setlocal enabledelayedexpansion

:: Set the log file
set log_file=execution_log.txt

:: User authentication
set user_db=users.txt
if not exist "%user_db%" echo. > "%user_db%"

:login
cls
echo ================================
echo        Login System
echo ================================
echo 1. Login
echo 2. Register
echo 3. Exit
echo ================================
set /p choice=Enter your choice (1, 2, or 3): 

if "%choice%"=="1" goto login_user
if "%choice%"=="2" goto register_user
if "%choice%"=="3" exit
echo Invalid choice. Try again.
pause
goto login

:login_user
set /p username=Enter username: 
set /p password=Enter password: 

:: Encrypt entered password
call :encrypt_password "%password%" encrypted_password

:: Verify login
set found=0
for /f "tokens=1,2 delims=:" %%a in (%user_db%) do (
    if "%%a"=="%username%" if "%%b"=="%encrypted_password%" (
        set found=1
        set user_role=normal
        if "%username%"=="admin" set user_role=admin
    )
)

if "%found%"=="1" (
    echo [INFO] User %username% logged in at %date% %time% >> "%log_file%"
    echo Login successful! Welcome, %username%.
    if "%user_role%"=="admin" echo (Admin Mode Enabled)
    pause
    goto menu
) else (
    echo [ERROR] Invalid credentials!
    echo [ERROR] Failed login attempt for %username% at %date% %time% >> "%log_file%"
    pause
    goto login
)

:register_user
set /p new_username=Enter new username: 
set /p new_password=Enter new password: 

:: Encrypt password before storing
call :encrypt_password "%new_password%" encrypted_password

:: Save credentials
echo %new_username%:%encrypted_password% >> %user_db%
echo Account created successfully!
pause
goto login

:encrypt_password
setlocal enabledelayedexpansion
set input=%~1
set output=
for /l %%i in (0,1,31) do (
    set char=!input:~%%i,1!
    if not "!char!"=="" (
        set /a ascii=0x1F ^^^^ (0x!char! * 3) %% 256
        for /f %%A in ('cmd /c echo\^!ascii^!') do set hex=%%A
        set output=!output!!hex!
    )
)
endlocal & set "%~2=%output%"
goto :eof

:: Main Menu
:menu
cls
echo ================================
echo     Executable Runner
echo ================================
echo 1. Run a single executable
echo 2. Run all executables in a folder
echo 3. Show execution log
echo 4. Logout
if "%user_role%"=="admin" echo 5. Admin Options
echo ================================
set /p choice=Enter your choice: 

if "%choice%"=="1" goto single_exe
if "%choice%"=="2" goto folder_exe
if "%choice%"=="3" type "%log_file%" & pause & goto menu
if "%choice%"=="4" goto login
if "%choice%"=="5" if "%user_role%"=="admin" goto admin_options
echo Invalid choice. Try again.
pause
goto menu

:single_exe
set /p exe_file=Enter the name of the executable file: 

if not exist "%exe_file%" (
    echo [ERROR] File not found: %exe_file% >> "%log_file%"
    echo File not found!
    pause
    goto menu
)

set /p exe_params=Enter any parameters (leave empty for default): 

call :run_exe "%exe_file%" "%exe_params%"
pause
goto menu

:folder_exe
set /p folder=Enter the folder path containing the executables: 

if not exist "%folder%" (
    echo [ERROR] Folder not found: %folder% >> "%log_file%"
    echo Folder not found!
    pause
    goto menu
)

for %%f in ("%folder%\*.exe") do call :run_exe "%%f" "/s /x /b /v/qn"
pause
goto menu

:run_exe
echo Running: %1 %2
echo [INFO] Running: %1 %2 >> "%log_file%"

:: Create a VBScript for silent execution with error handling
echo ' error_handler.vbs > error_handler.vbs
echo On Error Resume Next >> error_handler.vbs
echo Set objShell = CreateObject("WScript.Shell") >> error_handler.vbs
echo objShell.Run WScript.Arguments(0) & " " & WScript.Arguments(1), 0, True >> error_handler.vbs
echo If Err.Number ^<^> 0 Then >> error_handler.vbs
echo MsgBox "Error running: " & WScript.Arguments(0) & " " & WScript.Arguments(1), vbCritical, "Error" >> error_handler.vbs
echo echo [ERROR] Failed to run: %1 %2 >> "%log_file%" >> error_handler.vbs
echo End If >> error_handler.vbs

cscript //nologo error_handler.vbs "%~1" "%~2"
del error_handler.vbs
goto :eof

:admin_options
cls
echo ================================
echo        Admin Options
echo ================================
echo 1. View all registered users
echo 2. Delete execution log
echo 3. Back to menu
echo ================================
set /p admin_choice=Enter your choice: 

if "%admin_choice%"=="1" type %user_db% & pause & goto admin_options
if "%admin_choice%"=="2" echo. > "%log_file%" & echo Log cleared! & pause & goto admin_options
if "%admin_choice%"=="3" goto menu
echo Invalid choice.
pause
goto admin_options
