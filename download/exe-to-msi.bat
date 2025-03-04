@echo off
setlocal enabledelayedexpansion

:: Set directory where the script is located
set SCRIPT_DIR=%~dp0
set TOOLS_DIR=%SCRIPT_DIR%Tools
set SEVEN_ZIP=%TOOLS_DIR%\7zip
set WIX=%TOOLS_DIR%\WiX

:: Set download URLs
set SEVEN_ZIP_URL=https://www.7-zip.org/a/7z2301-x64.exe
set WIX_URL=https://github.com/wixtoolset/wix3/releases/download/wix3111rtm/wix311-binaries.zip

:: Ask user for the EXE file
set /p EXE_FILE="Enter the full path of the EXE file: "
if not exist "%EXE_FILE%" (
    echo File not found! Please enter a valid file.
    pause
    exit /b
)

set EXTRACTED_DIR=%SCRIPT_DIR%Extracted
set WIX_FILE=%SCRIPT_DIR%installer.wxs
set OUTPUT_MSI=%SCRIPT_DIR%installer.msi

:: Ensure the Tools folder exists
if not exist "%TOOLS_DIR%" mkdir "%TOOLS_DIR%"

:: Check if 7-Zip is installed
if not exist "%SEVEN_ZIP%\7z.exe" (
    echo 7-Zip is not installed.
    set /p DOWNLOAD_7ZIP="Would you like to download it? (Y/N): "
    if /I "!DOWNLOAD_7ZIP!"=="Y" (
        echo Downloading 7-Zip...
        powershell -Command "& {Invoke-WebRequest '%SEVEN_ZIP_URL%' -OutFile '%SCRIPT_DIR%7zip-installer.exe'}"
        echo Installing 7-Zip...
        start /wait "" "%SCRIPT_DIR%7zip-installer.exe" /S /D="%SEVEN_ZIP%"
        del "%SCRIPT_DIR%7zip-installer.exe"
    ) else (
        echo 7-Zip is required. Exiting...
        pause
        exit /b
    )
)

:: Check if WiX Toolset is installed
if not exist "%WIX%\candle.exe" (
    echo WiX Toolset is not installed.
    set /p DOWNLOAD_WIX="Would you like to download it? (Y/N): "
    if /I "!DOWNLOAD_WIX!"=="Y" (
        echo Downloading WiX Toolset...
        powershell -Command "& {Invoke-WebRequest '%WIX_URL%' -OutFile '%SCRIPT_DIR%wix.zip'}"
        echo Extracting WiX Toolset...
        "%SEVEN_ZIP%\7z.exe" x "%SCRIPT_DIR%wix.zip" -o"%WIX%" >nul
        del "%SCRIPT_DIR%wix.zip"
    ) else (
        echo WiX Toolset is required. Exiting...
        pause
        exit /b
    )
)

:: Step 1: Extract the .exe
echo Extracting %EXE_FILE% to %EXTRACTED_DIR%...
if not exist "%EXTRACTED_DIR%" mkdir "%EXTRACTED_DIR%"
"%SEVEN_ZIP%\7z.exe" x "%EXE_FILE%" -o"%EXTRACTED_DIR%" >nul
if %errorlevel% neq 0 (
    echo Failed to extract the .exe file.
    pause
    exit /b
)

:: Step 2: Ask user for the main executable file
set /p MAIN_EXE="Enter the main executable filename (from extracted files): "
if not exist "%EXTRACTED_DIR%\%MAIN_EXE%" (
    echo Main executable file not found! Please enter a valid filename.
    pause
    exit /b
)

:: Step 3: Generate .wxs file
echo Creating WiX configuration file...
(
    echo ^<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi"^>
    echo     ^<Product Id="*" Name="ConvertedApp" Language="1033" Version="1.0.0.0" Manufacturer="XPDevs" UpgradeCode="12345678-1234-1234-1234-123456789012"^>
    echo         ^<Package InstallerVersion="200" Compressed="yes" InstallScope="perMachine" /^>
    echo         ^<Media Id="1" Cabinet="output.cab" EmbedCab="yes"/^>
    echo         ^<Directory Id="TARGETDIR" Name="SourceDir"^>
    echo             ^<Directory Id="ProgramFilesFolder"^>
    echo                 ^<Directory Id="INSTALLFOLDER" Name="ConvertedApp"^>
    echo                     ^<Component Id="MainExecutable" Guid="A1234567-89AB-CDEF-0123-456789ABCDEF"^>
    echo                         ^<File Id="MainExe" Source="%EXTRACTED_DIR%\%MAIN_EXE%" KeyPath="yes"/^>
    echo                     ^</Component^>
    echo                 ^</Directory^>
    echo             ^</Directory^>
    echo         ^</Directory^>
    echo         ^<Feature Id="MainFeature" Title="ConvertedApp" Level="1"^>
    echo             ^<ComponentRef Id="MainExecutable"/^>
    echo         ^</Feature^>
    echo     ^</Product^>
    echo ^</Wix^>
) > "%WIX_FILE%"

:: Step 4: Compile .wxs to .msi
echo Compiling .msi file...
"%WIX%\candle.exe" "%WIX_FILE%" -out "%SCRIPT_DIR%installer.wixobj"
"%WIX%\light.exe" -out "%OUTPUT_MSI%" "%SCRIPT_DIR%installer.wixobj"

if %errorlevel% neq 0 (
    echo Failed to compile the .msi file.
    pause
)
