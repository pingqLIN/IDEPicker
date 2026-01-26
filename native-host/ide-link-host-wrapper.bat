@echo off
:: IDE Link Interceptor - Native Host Wrapper
:: This batch file is required because Windows doesn't directly execute .js files
node "%~dp0ide-link-host.js"
