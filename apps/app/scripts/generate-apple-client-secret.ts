import jwt from "jsonwebtoken";
import fs from "node:fs";
import path from "node:path";

const TEAM_ID = process.env.APPLE_TEAM_ID!;
const KEY_ID = process.env.APPLE_KEY_ID!;
const CLIENT_ID = process.env.APPLE_CLIENT_ID!; // Service ID
const PRIVATE_KEY_PATH = process.env.APPLE_PRIVATE_KEY_PATH!;

if (!TEAM_ID) throw new Error("Missing APPLE_TEAM_ID");
if (!KEY_ID) throw new Error("Missing APPLE_KEY_ID");
if (!CLIENT_ID) throw new Error("Missing APPLE_CLIENT_ID");
if (!PRIVATE_KEY_PATH) throw new Error("Missing APPLE_PRIVATE_KEY_PATH");

const privateKey = fs.readFileSync(path.resolve(PRIVATE_KEY_PATH), "utf8");

const now = Math.floor(Date.now() / 1000);
const expiresIn = 60 * 60 * 24 * 180; // 180 dias

const clientSecret = jwt.sign(
    {
        iss: TEAM_ID,
        iat: now,
        exp: now + expiresIn,
        aud: "https://appleid.apple.com",
        sub: CLIENT_ID,
    },
    privateKey,
    {
        algorithm: "ES256",
        header: {
            alg: "ES256",
            kid: KEY_ID,
        },
    }
);

console.log("\nAPPLE_CLIENT_SECRET=\n");
console.log(clientSecret);
console.log("\nExpires in ~180 days.\n");