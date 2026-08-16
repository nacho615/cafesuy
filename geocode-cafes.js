const fs = require('fs');

// Rate limit: 1 request per second for Nominatim
const DELAY_MS = 1100;

async function geocodeAddress(address) {
    const query = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'cafes.uy/1.0 (geocoding coffee shops in Montevideo)'
            }
        });

        const data = await response.json();

        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }
        return null;
    } catch (error) {
        console.error(`Error geocoding "${address}":`, error.message);
        return null;
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    // Load existing cafes
    const cafesData = JSON.parse(fs.readFileSync('cafes.json', 'utf8'));
    const cafes = cafesData.coffee_shops;

    // Check if we have existing geocoded data
    let existingCoords = {};
    if (fs.existsSync('cafes-con-coordenadas.json')) {
        const existing = JSON.parse(fs.readFileSync('cafes-con-coordenadas.json', 'utf8'));
        existing.forEach(cafe => {
            if (cafe.lat && cafe.lng) {
                existingCoords[cafe.name] = { lat: cafe.lat, lng: cafe.lng };
            }
        });
        console.log(`Found ${Object.keys(existingCoords).length} existing coordinates`);
    }

    const results = [];
    let geocoded = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < cafes.length; i++) {
        const cafe = cafes[i];

        // Check if we already have coordinates
        if (existingCoords[cafe.name]) {
            results.push({
                ...cafe,
                lat: existingCoords[cafe.name].lat,
                lng: existingCoords[cafe.name].lng
            });
            skipped++;
            console.log(`[${i + 1}/${cafes.length}] SKIP: ${cafe.name} (already geocoded)`);
            continue;
        }

        if (!cafe.address) {
            results.push(cafe);
            failed++;
            console.log(`[${i + 1}/${cafes.length}] NO ADDRESS: ${cafe.name}`);
            continue;
        }

        console.log(`[${i + 1}/${cafes.length}] Geocoding: ${cafe.name}...`);

        const coords = await geocodeAddress(cafe.address);

        if (coords) {
            results.push({
                ...cafe,
                lat: coords.lat,
                lng: coords.lng
            });
            geocoded++;
            console.log(`  -> Found: ${coords.lat}, ${coords.lng}`);
        } else {
            // Try with just the street name + Montevideo
            const simplifiedAddress = cafe.address.split(',')[0] + ', Montevideo, Uruguay';
            console.log(`  -> Retrying with: ${simplifiedAddress}`);
            await sleep(DELAY_MS);

            const coords2 = await geocodeAddress(simplifiedAddress);
            if (coords2) {
                results.push({
                    ...cafe,
                    lat: coords2.lat,
                    lng: coords2.lng
                });
                geocoded++;
                console.log(`  -> Found: ${coords2.lat}, ${coords2.lng}`);
            } else {
                results.push(cafe);
                failed++;
                console.log(`  -> NOT FOUND`);
            }
        }

        // Rate limiting
        await sleep(DELAY_MS);

        // Save progress every 10 cafes
        if ((i + 1) % 10 === 0) {
            fs.writeFileSync('cafes-con-coordenadas.json', JSON.stringify(results, null, 2));
            console.log(`\n--- Progress saved (${i + 1}/${cafes.length}) ---\n`);
        }
    }

    // Save final results
    fs.writeFileSync('cafes-con-coordenadas.json', JSON.stringify(results, null, 2));

    console.log('\n=== DONE ===');
    console.log(`Total: ${cafes.length}`);
    console.log(`Geocoded: ${geocoded}`);
    console.log(`Skipped (already had coords): ${skipped}`);
    console.log(`Failed: ${failed}`);
}

main().catch(console.error);
