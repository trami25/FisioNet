@echo off
echo Starting Auth Service with Visual Studio Build Tools...
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat"
cd /d "c:\Users\mniko\source\repos\NTP\FisioNet\backend\auth_service"
cargo run