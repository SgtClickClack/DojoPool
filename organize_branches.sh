#!/bin/bash

declare -A branches=(
    ["feature/core-gameplay"]="DojoPool/gameplay_logic.py DojoPool/rules_engine.py DojoPool/turn_manager.py DojoPool/score_tracker.py"
    ["feature/special-powers"]="DojoPool/special_powers.py DojoPool/power_manager.py DojoPool/coin_system.py"
    ["feature/ai-integration"]="DojoPool/ai_engine.py DojoPool/ai_logic.py"
    ["feature/user-avatars"]="DojoPool/avatar_manager.py DojoPool/avatars/ DojoPool/customization_logic.py"
    ["feature/map-integration"]="DojoPool/map_overlay.py DojoPool/geolocation.py DojoPool/maps_sdk.py"
    ["feature/frontend-ui"]="DojoPool/templates/ DojoPool/static/ DojoPool/ui_manager.js"
    ["feature/backend-api"]="DojoPool/server.py DojoPool/api_routes.py DojoPool/database_manager.py"
    ["feature/testing"]="DojoPool/tests/test_gameplay.py DojoPool/tests/test_powers.py DojoPool/tests/test_ui.js"
)

for branch in "${!branches[@]}"; do
    echo "Organizing branch: $branch"
    git checkout $branch
    git rm -r --cached *
    git add ${branches[$branch]}
    git commit -m "Isolated files for ${branch#feature/}"
    git push origin $branch
done
