import json

# Usernames with downloaded images
downloaded = [
    "alto_cafe_",
    "bazarcafeuy",
    "brava.pan",
    "cafeparaisouy",
    "cafepura.uy",
    "cafesuarez",
    "cardenalcafe",
    "casa_de_abajo",
    "charlottecafemvd",
    "clubcafeprado",
    "cultocafeuy",
    "elcafecito.uy",
    "franca_uy",
    "gallardia.cafe",
    "gutierrezcafe_",
    "holicafe_",
    "iconico.cafe"
]

# Load cafes.json
with open('cafes.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Update cafes with image field
count = 0
for cafe in data['coffee_shops']:
    if cafe['instagram'] in downloaded:
        cafe['image'] = f"img/cafes/{cafe['instagram']}.jpg"
        count += 1
        print(f"Added image for {cafe['name']} ({cafe['instagram']})")

# Save updated JSON
with open('cafes.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\nUpdated {count} cafes with image field")
