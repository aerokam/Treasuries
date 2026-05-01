@echo off
cd /d "%~dp0.."
start "" http://localhost:3737
node Dashboard\server.js
