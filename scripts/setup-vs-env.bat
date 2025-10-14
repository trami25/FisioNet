@echo off
echo Setting up Visual Studio environment for Rust...

:: Try to find vcvars64.bat
for /f "usebackq tokens=*" %%i in (`"%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe" -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath`) do (
  set InstallDir=%%i
)

if exist "%InstallDir%\VC\Auxiliary\Build\vcvars64.bat" (
  echo Found Visual Studio at: %InstallDir%
  call "%InstallDir%\VC\Auxiliary\Build\vcvars64.bat"
  echo.
  echo Visual Studio environment set up successfully.
  echo You can now run: cargo run
  echo.
) else (
  echo Visual Studio Build Tools not found properly.
  echo Please install Visual Studio Build Tools with C++ workload.
  echo.
  echo Opening installation page...
  start https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
)

cmd /k