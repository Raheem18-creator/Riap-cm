const { makeid } = require('./gen-id');
const express = require('express');
const fs = require('fs');
const pino = require("pino");
const { default: makeWASocket, useMultiFileAuthState, delay, Browsers, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const { upload } = require('./mega'); // Assuming './mega' is a utility for uploading to Mega.nz

const router = express.Router();

/**
 * Safely removes a file or directory.
 * @param {string} filePath - The path to the file or directory.
 * @returns {boolean} True if removed, false otherwise.
 */
function removeFile(filePath) {
    if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { recursive: true, force: true });
        return true;
    }
    return false;
}

/**
 * Core logic for generating the WhatsApp pairing code and handling the connection.
 * This function is separated from the Express route for better reusability and testing.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function generatePairingCodeAndConnect(req, res) {
    const sessionId = makeid(); // Unique ID for the temporary session directory
    let { number: phoneNumber } = req.query; // Destructure and rename for clarity

    // Basic input validation
    if (!phoneNumber) {
        // Send a 400 Bad Request if the phone number is missing
        return res.status(400).send({ code: "❗ Phone number is required." });
    }

    // Sanitize the phone number to contain only digits
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');

    const sessionDirPath = `./temp/${sessionId}`;
    const WA_LOGGER = pino({ level: "fatal" }).child({ level: "fatal" }); // Baileys logger

    try {
        // Use MultiFileAuthState to manage session credentials
        const { state, saveCreds } = await useMultiFileAuthState(sessionDirPath);

        const sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, WA_LOGGER),
            },
            printQRInTerminal: false, // Don't print QR code in terminal
            generateHighQualityLinkPreview: true,
            logger: WA_LOGGER,
            syncFullHistory: false, // Prevents downloading full chat history
            browser: Browsers.macOS("Safari") // Using a specific browser type
        });

        // If the session is not registered, request a pairing code
        if (!sock.authState.creds.registered) {
            await delay(1500); // Wait a bit before requesting the code
            const pairingCode = await sock.requestPairingCode(phoneNumber);
            // Ensure response hasn't been sent yet to avoid errors
            if (!res.headersSent) {
                return res.send({ code: pairingCode }); // Send the pairing code to the client
            }
        }

        // Event listener to save credentials whenever they update
        sock.ev.on('creds.update', saveCreds);

        // Event listener for connection updates
        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;

            // Handle successful connection
            if (connection === "open") {
                await delay(5000); // Wait for credentials to fully save
                const credsFilePath = `${sessionDirPath}/creds.json`;

                // Verify if creds.json exists after connection
                if (!fs.existsSync(credsFilePath)) {
                    console.error(`ERROR: creds.json not found at ${cresFilePath}`);
                    if (!res.headersSent) {
                        res.status(500).send({ code: "❗ Connection failed: Credentials file not found." });
                    }
                    await sock.ws.close();
                    removeFile(sessionDirPath);
                    return;
                }

                try {
                    // Upload credentials file to Mega.nz
                    const megaUrl = await upload(fs.createReadStream(credsFilePath), `${sock.user.id}.json`);
                    // Extract the session string from the Mega.nz URL
                    const sessionString = megaUrl.replace('https://mega.nz/file/', '');
                    const messageToSelf = `RAHEEM-XMD-3>>>${sessionString}`;

                    // Send the session string to the connected WhatsApp number
                    const sentMessage = await sock.sendMessage(sock.user.id, { text: messageToSelf });

                    // Get current time and date in Dar es Salaam timezone
                    const tanzaniaTime = new Date().toLocaleTimeString('en-TZ', { timeZone: 'Africa/Dar_es_Salaam' });
                    const tanzaniaDate = new Date().toLocaleDateString('en-TZ', { timeZone: 'Africa/Dar_es_Salaam' });

                    // Construct the detailed bot description message
                    const botDescription = `🟢  *BOT SUCCESSFULLY CONNECTED 🟢!*
                
╭━━ 『 RAHEEM-XMD-3 INITIALIZED 』
┃  ⚡ BOT NAME: RAHEEM-XMD-3 
┃  👑 OWNER: Raheem-cm 
┃  ⚙️ MODE: *private*
┃  🎯 PREFIX: *.*
┃  ⏳ TIME: *${tanzaniaTime}*
┃  📆 DATE: ${tanzaniaDate}
╰━━━━━━━━━━━━━━━━━━━╯

⚠️ REPORT ANY GLITCHES DIRECTLY TO THE OWNER.

╭──────────────────★
│ POWERED BY Raheem-cm
╰──────────────────★
📢 CHANNEL: Click Here(https://whatsapp.com/channel/0029VbAffhD2ZjChG9DX922r)
🛠️ DEPLOY YOUR BOT: GitHub Repo(https://github.com/Raheem-cm/RAHEEM-XMD-3)

🔋  SYSTEM STATUS: RAHEEM-XMD-3 100% 🧐  A.I READY • MULTI DEVICE • STABLE RELEASE
`;

                    // Send the detailed description message
                    await sock.sendMessage(sock.user.id, {
                        text: botDescription,
                        contextInfo: {
                            externalAdReply: {
                                title: "PEACE MD💚",
                                thumbnailUrl: "https://files.catbox.moe/wtjh55.jpg",
                                sourceUrl: "https://github.com/Raheem-cm/RAHEEM-XMD-3",
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    }, { quoted: sentMessage }); // Quote the previously sent message

                    await delay(100); // Small delay to ensure messages are sent
                    await sock.ws.close(); // Close the WebSocket connection
                    removeFile(sessionDirPath); // Clean up temporary session files
                    console.log(`👤 ${sock.user.id} Connected ✅ Restarting process...`);
                    // Exit the process. Be cautious with this in a long-running server.
                    // If this is an API for a persistent bot, you might want to handle this differently.
                    process.exit();

                } catch (megaError) {
                    console.error("ERROR uploading to Mega or sending messages:", megaError);
                    if (!res.headersSent) {
                        res.status(500).send({ code: "❗ Failed to upload or send messages." });
                    }
                    await sock.ws.close();
                    removeFile(sessionDirPath);
                }

            }
            // Handle connection close scenarios
            else if (connection === "close") {
                // If the connection closed due to a non-authentication error
                if (lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
                    console.log("Connection closed, restarting pairing process due to:", lastDisconnect.error);
                    removeFile(sessionDirPath); // Clean up old session files
                    // Implement more robust retry logic here (e.g., retry counter, exponential backoff)
                    // For now, we'll simply attempt to restart the process by calling the function again.
                    // **Warning:** Direct recursion can lead to infinite loops on persistent errors.
                    await delay(2000); // Wait a bit before retrying
                    generatePairingCodeAndConnect(req, res); // Re-call the main logic
                }
                // If the connection closed due to an authentication failure (e.g., session invalidated)
                else if (lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode === 401) {
                    console.log("Authentication failed, removing session and restarting:", lastDisconnect.error);
                    removeFile(sessionDirPath); // Remove the invalid session
                    if (!res.headersSent) {
                        res.status(401).send({ code: "❗ Authentication failed. Please try again." });
                    }
                    process.exit(); // Exit if authentication fails
                }
            }
        });

    } catch (err) {
        console.error("ERROR in generatePairingCodeAndConnect:", err);
        removeFile(sessionDirPath); // Ensure temporary files are cleaned up on any error
        if (!res.headersSent) {
            res.status(500).send({ code: "❗ Service currently unavailable. Please try again." });
        }
    }
}

// Assign the core logic function to the Express GET route
router.get('/', generatePairingCodeAndConnect);

module.exports = router;
