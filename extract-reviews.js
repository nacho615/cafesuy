const fs = require('fs');

const html = fs.readFileSync('/Users/ipiccinno/Desktop/instagram-cafes.uy-2026-08-08-3teUAgSv/your_instagram_activity/media/posts.html', 'utf8');

// Extract all text content between divs that look like captions
// Instagram exports have posts in a specific structure

// Find all occurrences of post content
const posts = [];
const regex = /<div[^>]*>([^<]{50,})<\/div>/g;
let match;

while ((match = regex.exec(html)) !== null) {
    const text = match[1].trim();
    // Filter out CSS and scripts
    if (!text.includes('{') && !text.includes('function') && !text.includes('http')) {
        posts.push(text);
    }
}

console.log(`Found ${posts.length} posts\n`);

// Load cafes to match
const cafes = JSON.parse(fs.readFileSync('cafes.json', 'utf8')).coffee_shops;
const cafeNames = cafes.map(c => c.name.toLowerCase());

// For each post, try to match with a cafe
const reviews = [];

posts.forEach((post, i) => {
    const postLower = post.toLowerCase();

    cafes.forEach(cafe => {
        const nameLower = cafe.name.toLowerCase();
        const nameSimple = nameLower.replace(/\s*\([^)]*\)/g, '').trim(); // Remove parentheses

        if (postLower.includes(nameSimple) || postLower.includes(cafe.instagram.toLowerCase())) {
            reviews.push({
                cafe: cafe.name,
                instagram: cafe.instagram,
                review: post.substring(0, 500) + (post.length > 500 ? '...' : ''),
                fullReview: post
            });
        }
    });
});

// Remove duplicates
const uniqueReviews = [];
const seen = new Set();

reviews.forEach(r => {
    const key = r.cafe + r.review.substring(0, 100);
    if (!seen.has(key)) {
        seen.add(key);
        uniqueReviews.push(r);
    }
});

console.log(`Found ${uniqueReviews.length} reviews matching cafes:\n`);

uniqueReviews.forEach(r => {
    console.log(`=== ${r.cafe} (@${r.instagram}) ===`);
    console.log(r.review);
    console.log('');
});

// Save to JSON
fs.writeFileSync('reviews.json', JSON.stringify(uniqueReviews, null, 2));
console.log('\nSaved to reviews.json');
