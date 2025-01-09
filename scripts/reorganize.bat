@echo off
echo Creating directory structure...

:: Create directories
mkdir ..\src\api\v1
mkdir ..\src\auth
mkdir ..\src\core\game
mkdir ..\src\core\tournament
mkdir ..\src\core\ranking
mkdir ..\src\core\realtime
mkdir ..\src\frontend\src
mkdir ..\src\frontend\public
mkdir ..\src\models
mkdir ..\src\services\email
mkdir ..\src\services\notification
mkdir ..\src\static\css
mkdir ..\src\static\js
mkdir ..\src\static\images
mkdir ..\src\templates
mkdir ..\src\utils

:: Create __init__.py files
type nul > ..\src\api\__init__.py
type nul > ..\src\auth\__init__.py
type nul > ..\src\core\__init__.py
type nul > ..\src\core\game\__init__.py
type nul > ..\src\core\tournament\__init__.py
type nul > ..\src\core\ranking\__init__.py
type nul > ..\src\core\realtime\__init__.py
type nul > ..\src\models\__init__.py
type nul > ..\src\services\__init__.py
type nul > ..\src\services\email\__init__.py
type nul > ..\src\services\notification\__init__.py
type nul > ..\src\utils\__init__.py

echo Moving files...

:: Move frontend files
if exist ..\src\setupTests.ts move ..\src\setupTests.ts ..\src\frontend\src\tests\
if exist ..\src\constants.ts move ..\src\constants.ts ..\src\frontend\src\

:: Move email services
if exist ..\src\email move ..\src\email\* ..\src\services\email\
if exist ..\src\mail_service move ..\src\mail_service\* ..\src\services\email\

:: Move socket files
if exist ..\src\websockets move ..\src\websockets\* ..\src\core\realtime\
if exist ..\src\sockets move ..\src\sockets\* ..\src\core\realtime\

:: Move blueprint files
if exist ..\src\blueprints (
    for %%f in (..\src\blueprints\auth_*) do move %%f ..\src\auth\
    for %%f in (..\src\blueprints\game_*) do move %%f ..\src\core\game\
    for %%f in (..\src\blueprints\tournament_*) do move %%f ..\src\core\tournament\
)

echo Cleaning up...

:: Remove redundant directories
if exist ..\src\.gitignore del ..\src\.gitignore
if exist ..\src\dojopool.egg-info rmdir /s /q ..\src\dojopool.egg-info
if exist ..\src\dojopool rmdir /s /q ..\src\dojopool
if exist ..\src\__pycache__ rmdir /s /q ..\src\__pycache__
if exist ..\src\email rmdir /s /q ..\src\email
if exist ..\src\mail_service rmdir /s /q ..\src\mail_service
if exist ..\src\websockets rmdir /s /q ..\src\websockets
if exist ..\src\sockets rmdir /s /q ..\src\sockets
if exist ..\src\blueprints rmdir /s /q ..\src\blueprints

echo Done! Codebase reorganized successfully. 