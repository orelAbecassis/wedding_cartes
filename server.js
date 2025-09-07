// server.js
import express from "express";
import { Client } from "@notionhq/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// ESM paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Env (sécurisation: trim)
const NOTION_TOKEN = (process.env.NOTION_TOKEN || "").trim();
const NOTION_DB_ID = (process.env.NOTION_DB_ID || "").trim();

// ---- App
const app = express();

// Static avec cache fort (1 jour) + ETag
app.use(
  express.static(path.join(__dirname, "public"), {
    etag: true,
    lastModified: true,
    maxAge: "1d",
    immutable: false,
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
    }
  })
);

// JSON parser (léger)
app.use(express.json({ limit: "32kb", type: "application/json" }));

// ---- Notion
const notion = new Client({ auth: NOTION_TOKEN });

// Utils
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
const isOuiNon = (v) => v === "Oui" || v === "Non";

// Health
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    env: {
      hasToken: !!NOTION_TOKEN,
      hasDb: !!NOTION_DB_ID
    }
  });
});

// ====== API RSVP ======
app.post("/api/rsvp", async (req, res) => {
  try {
    // Validation & normalisation
    const name = String(req.body?.name ?? "").trim();
    const reception = String(req.body?.reception ?? "").trim();
    const nbHouppa = clamp(Number.isFinite(+req.body?.nbHouppa) ? +req.body.nbHouppa : 0, 0, 50);
    const message = String(req.body?.message ?? "").slice(0, 1000);

    if (!name) {
      return res.status(400).json({ ok: false, error: "missing_name" });
    }
    if (reception && !isOuiNon(reception)) {
      return res.status(400).json({ ok: false, error: "invalid_reception" });
    }

    const finalNbHouppa = reception === "Non" ? 0 : nbHouppa;

    const props = {
      "Nom Prénom": { title: [{ text: { content: name } }] },
      "nbPers_houppa": { number: finalNbHouppa },
    };
    if (reception) props["reception"] = { select: { name: reception } };
    if (message)   props["Message_maries"] = { rich_text: [{ text: { content: message } }] };

    const created = await notion.pages.create({
      parent: { database_id: NOTION_DB_ID },
      properties: props,
    });

    return res.status(200).json({ ok: true, id: created.id });
  } catch (err) {
    const detail = err?.body || err?.message || String(err);
    console.error("[Notion] create page error:", detail);
    return res.status(500).json({ ok: false, error: "notion_error", detail });
  }
});

// Fallback → sert public/form.html
app.get(/^\/(?!api\/).*/, (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "form.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server running: http://localhost:${port}`);
});
