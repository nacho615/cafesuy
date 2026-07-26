#!/bin/bash

# Script to download missing Instagram profile pictures

IMG_DIR="img/cafes"
JSON_FILE="cafes.json"

# Get list of instagram usernames
usernames=$(jq -r '.coffee_shops[].instagram' "$JSON_FILE")

echo "Downloading missing profile pictures..."
echo "======================================="

count=0
downloaded=0
skipped=0
failed=0
total=$(echo "$usernames" | wc -l | tr -d ' ')

for username in $usernames; do
    count=$((count + 1))
    img_file="$IMG_DIR/${username}.jpg"

    # Skip if already downloaded
    if [ -f "$img_file" ] && [ -s "$img_file" ]; then
        skipped=$((skipped + 1))
        echo "[$count/$total] ⏭ Skipping $username (already exists)"
        continue
    fi

    echo "[$count/$total] Fetching $username..."

    # Get profile pic URL from Instagram API
    profile_url=$(curl -s "https://i.instagram.com/api/v1/users/web_profile_info/?username=$username" \
        -H "User-Agent: Instagram 76.0.0.15.395 Android" \
        -H "X-IG-App-ID: 936619743392459" | \
        jq -r '.data.user.profile_pic_url_hd // .data.user.profile_pic_url // empty')

    if [ -n "$profile_url" ] && [ "$profile_url" != "null" ]; then
        # Download the image
        curl -s -o "$img_file" "$profile_url"

        if [ -f "$img_file" ] && [ -s "$img_file" ]; then
            echo "  ✓ Downloaded $img_file"
            downloaded=$((downloaded + 1))
        else
            echo "  ✗ Failed to download image"
            rm -f "$img_file"
            failed=$((failed + 1))
        fi
    else
        echo "  ✗ Could not get profile URL (rate limited?)"
        failed=$((failed + 1))
    fi

    # Longer delay to avoid rate limiting
    sleep 2
done

echo ""
echo "======================================="
echo "Done!"
echo "  Skipped (already had): $skipped"
echo "  Downloaded: $downloaded"
echo "  Failed: $failed"
echo "  Total images: $(ls -1 $IMG_DIR/*.jpg 2>/dev/null | wc -l | tr -d ' ')"
