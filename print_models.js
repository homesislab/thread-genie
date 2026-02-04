const fs = require('fs');

try {
    // Try reading as UTF-8 first, then UCS-2 if needed, but let's just try to read and regex it if JSON parse fails
    let content = fs.readFileSync('models.json', 'utf8');

    // If it looks like binary/garbage, try utf-16le
    if (content.includes('\0')) {
        content = fs.readFileSync('models.json', 'utf16le');
    }

    try {
        const data = JSON.parse(content);
        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => console.log(m.name));
        } else {
            console.log("No models property found.");
        }
    } catch (e) {
        console.log("JSON Parse Error, trying regex extracted names:");
        const matches = content.match(/"name": "models\/[^"]+"/g);
        if (matches) {
            matches.forEach(m => console.log(m));
        } else {
            console.log("No names found via regex.");
            console.log("Preview:", content.substring(0, 200));
        }
    }
} catch (err) {
    console.error("Read File Error:", err);
}
