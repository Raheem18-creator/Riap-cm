const { makeid } = require('./gen-id'); const express = require('express'); const fs = require('fs'); let router = express.Router(); const pino = require("pino"); const { default: makeWASocket, useMultiFileAuthState, delay, Browsers, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys'); const { upload } = require('./mega');

function removeFile(FilePath) { if (!fs.existsSync(FilePath)) return false; fs.rmSync(FilePath, { recursive: true, force: true }); }

router.get('/', async (req, res) => { const id = makeid(); let num = req.query.number;

async function GIFTED_MD_PAIR_CODE() {
    const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);
    try {
        var items = ["Safari"];
        var randomItem = items[Math.floor(Math.random() * items.length)];

        let sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            printQRInTerminal: false,
            generateHighQualityLinkPreview: true,
            logger: pino({ level: "fatal" }).child({ level: "fatal" }),
            syncFullHistory: false,
            browser: Browsers.macOS(randomItem)
        });

        if (!sock.authState.creds.registered) {
            await delay(1500);
            num = num.replace(/[^0-9]/g, '');
            const code = await sock.requestPairingCode(num);
            if (!res.headersSent) {
                await res.send({ code });
            }
        }

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on("connection.update", async (s) => {
            const { connection, lastDisconnect } = s;

            if (connection == "open") {
                await delay(5000);
                let rf = `./temp/${id}/creds.json`;
                const mega_url = await upload(fs.createReadStream(rf), `${sock.user.id}.json`);
                const string_session = mega_url.replace('https://mega.nz/file/', '');
                let md = "RAHEEM-XMD-3>>>" + string_session;

                let code = await sock.sendMessage(sock.user.id, { text: md });

                const kenyaTime = new Date().toLocaleTimeString('en-KE', { timeZone: 'Africa/Dar es salaam' });
                const kenyaDate = new Date().toLocaleDateString('en-KE', { timeZone: 'Africa/Dar es salaam' });

                let desc = `🟢  *ʙᴏᴛ sᴜᴄᴄᴇssғᴜʟʟʏ ᴄᴏɴɴᴇᴄᴛᴇᴅ 🟢!*
                
╭━━ 『 RAHEEM-XMD-3 ɪɴɪᴛɪᴀʟɪᴢᴇᴅ 』\n┃  ⚡ ʙᴏᴛ ɴᴀᴍᴇ: RAHEEM-XMD-3 \n┃  👑 ᴏᴡɴᴇʀ: 𝐖𝐞𝐞𝐝 𝐓𝐞𝐜𝐡 \n┃  ⚙️ ᴍᴏᴅᴇ: *private*\n┃  🎯 ᴘʀᴇꜰɪx: *.*\n┃  ⏳ ᴛɪᴍᴇ: *${kenyaTime}*\n┃  📆 ᴅᴀᴛᴇ: ${kenyaDate}\n╰━━━━━━━━━━━━━━━━━━━╯\n\n⚠️ ʀᴇᴘᴏʀᴛ ᴀɴʏ ɢʟɪᴛᴄʜᴇꜱ ᴅɪʀᴇᴄᴛʟʏ ᴛᴏ ᴛʜᴇ ᴏᴡɴᴇʀ.\n\n╭──────────────────★\n│ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴡᴇᴇᴅ ᴛᴇᴄʜ\n╰──────────────────★\n📢 𝐂ʜᴀɴɴᴇʟ: Click Here(https://whatsapp.com/channel/0029VbAffhD2ZjChG9DX922r) }\n🛠️ 𝐃ᴇᴘʟᴏʏ 𝐘ᴏᴜʀ 𝐁ᴏᴛ: GitHub Repo(https://github.com/Raheem-cm/RAHEEM-XMD-3)\n
🔋  𝐒ʏꜱᴛᴇᴍ 𝐒ᴛᴀᴛᴜꜱ: ғᴜsᴇ́ᴇ-ᴍᴅ 100% 🧐  𝐀.I 𝐑ᴇᴀᴅʏ • 𝐌ᴜʟᴛɪ 𝐃ᴇᴠɪᴄᴇ • 𝐒ᴛᴀʙʟᴇ 𝐑ᴇʟᴇᴀꜱᴇ\n`;

await sock.sendMessage(sock.user.id, {
                    text: desc,
                    contextInfo: {
                        externalAdReply: {
                            title: "ᴘᴇᴀᴄᴇ ᴍᴅ💚",
                            thumbnailUrl: "https://files.catbox.moe/wtjh55.jpg",
                            sourceUrl: "https://github.com/Raheem-cm/RAHEEM-XMD-3",
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: code });

                await delay(10);
                await sock.ws.close();
                await removeFile('./temp/' + id);
                console.log(`👤 ${sock.user.id} Connected ✅ Restarting process...`);
                await delay(10);
                process.exit();
            } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                await delay(10);
                GIFTED_MD_PAIR_CODE();
            }
        });
    } catch (err) {
        console.log("service restated");
        await removeFile('./temp/' + id);
        if (!res.headersSent) {
            await res.send({ code: "❗ Service Unavailable" });
        }
    }
}
return await GIFTED_MD_PAIR_CODE();

});

module.exports = router;
