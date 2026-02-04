const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function checkModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);

    // Daftar kemungkinan model
    const candidates = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-2.0-flash-exp",
        "gemini-pro",
        "gemini-1.0-pro"
    ];

    console.log("Checking valid models for your API Key...");

    for (const modelName of candidates) {
        process.stdout.write(`Testing ${modelName}... `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hi");
            await result.response;
            console.log("✅ WORKS!");

            // Simpan yang berhasil ke file untuk dibaca agent
            const fs = require('fs');
            fs.writeFileSync('valid_model.txt', modelName);
            process.exit(0); // Stop setelah ketemu satu
        } catch (error) {
            console.log("❌ Failed");
            // console.log(error.message); // Uncomment for debug
        }
    }
    console.log("No valid models found in common list.");
}

checkModels();
