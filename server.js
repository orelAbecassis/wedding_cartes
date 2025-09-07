// server.js
import express from "express";
import { Client } from "@notionhq/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// chemins ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- App Express
const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public"))); // sert public/index.html

// --- Notion
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DB_ID;

app.get("/health", (_, res) =>
  res.json({ ok: true, hasToken: !!process.env.NOTION_TOKEN, hasDb: !!process.env.NOTION_DB_ID })
);

// ====== FORMULAIRE ======
app.post("/api/rsvp", async (req, res) => {
  try {
    console.log("RSVP payload =>", req.body); // debug utile

    const { name, mairie, nbMairie, reception, nbHouppa, message } = req.body;
    if (!name) return res.status(400).json({ ok: false, error: "missing_name" });

    const props = {
      "Nom Prénom": { title: [{ text: { content: name } }] },
      "nbPers_mairie": { number: Number.isFinite(+nbMairie) ? +nbMairie : 0 },
      "nbPers_houppa": { number: Number.isFinite(+nbHouppa) ? +nbHouppa : 0 },
      "Message_maries": { rich_text: [{ text: { content: message || "" } }] }
    };
    if (mairie)    props["Mairie"]    = { select: { name: mairie } };      // "Oui"/"Non"
    if (reception) props["reception"] = { select: { name: reception } };

    const result = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: props
    });

    res.status(200).json({ ok: true, id: result.id });
  } catch (err) {
    console.error("Notion error:", err?.body || err?.message || err);
    res.status(500).json({
      ok: false,
      error: "notion_error",
      detail: err?.body || err?.message || "unknown"
    });
  }
});

// Fallback (Express 5 OK) pour toutes les routes hors /api
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "mairie.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ Server running: http://localhost:${port}`));
