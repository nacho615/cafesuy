#!/bin/bash

# Script to download Instagram profile pictures for all cafes

IMG_DIR="img/cafes"
JSON_FILE="cafes.json"
TEMP_JSON="cafes_temp.json"

# Get list of instagram usernames
usernames=$(jq -r '.coffee_shops[].instagram' "$JSON_FILE")

echo "Downloading profile pictures..."
echo "=============================="

count=0
total=$(echo "$usernames" | wc -l | tr -d ' ')

for username in $usernames; do
    count=$((count + 1))
    echo "[$count/$total] Fetching $username..."

    # Get profile pic URL from Instagram API
    profile_url=$(curl -s "https://i.instagram.com/api/v1/users/web_profile_info/?username=$username" \
        -H "User-Agent: Instagram 76.0.0.15.395 Android" \
        -H "X-IG-App-ID: 936619743392459" | \
        jq -r '.data.user.profile_pic_url_hd // .data.user.profile_pic_url // empty')

    if [ -n "$profile_url" ] && [ "$profile_url" != "null" ]; then
        # Download the image
        img_file="$IMG_DIR/${username}.jpg"
        curl -s -o "$img_file" "$profile_url"

        if [ -f "$img_file" ] && [ -s "$img_file" ]; then
            echo "  ✓ Downloaded $img_file"
        else
            echo "  ✗ Failed to download image"
            rm -f "$img_file"
        fi
    else
        echo "  ✗ Could not get profile URL"
    fi

    # Small delay to avoid rate limiting
    sleep 0.5
done

echo ""
echo "Done! Downloaded $(ls -1 $IMG_DIR/*.jpg 2>/dev/null | wc -l | tr -d ' ') images"
