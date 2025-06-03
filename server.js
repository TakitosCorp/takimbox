import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { Kysely, SqliteDialect } from "kysely";
import Database from "better-sqlite3";
import bodyParser from "body-parser";
import fs from "fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

config({ path: path.resolve(__dirname, ".env") });

async function main() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  const dbFile = path.join("/app", "takimbox.db");

  const db = new Kysely({
    dialect: new SqliteDialect({
      database: new Database(dbFile, { 
        verbose: console.log,
        timeout: 5000,
        fileMustExist: false
      }),
    }),
  });

  async function initDb() {
    await db.transaction().execute(async (trx) => {
      await trx.schema
        .createTable("config")
        .ifNotExists()
        .addColumn("id", "varchar(50)", (col) => col.notNull().primaryKey())
        .addColumn("value", "varchar(255)", (col) => col.notNull())
        .execute();

      await trx.schema
        .createTable("messages")
        .ifNotExists()
        .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
        .addColumn("name", "varchar(100)", (col) => col.notNull())
        .addColumn("content", "varchar(255)", (col) => col.notNull())
        .addColumn("color", "varchar(20)", (col) => col.notNull())
        .addColumn("author", "varchar(100)", (col) => col.notNull())
        .addColumn("timestamp", "integer", (col) => col.notNull())
        .addColumn("deleted", "boolean", (col) => col.defaultTo(false).notNull())
        .execute();

      const reveal = await trx.selectFrom("config").select("id").where("id", "=", "revealTimestamp").executeTakeFirst();
      if (!reveal) {
        await trx
          .insertInto("config")
          .values({
            id: "revealTimestamp",
            value: String(1749924000 * 1000),
          })
          .execute();
      }
    });
  }

  await initDb();

  async function getRevealTimestamp() {
    const configItem = await db
      .selectFrom("config")
      .select("value")
      .where("id", "=", "revealTimestamp")
      .executeTakeFirst();
    return configItem ? Number(configItem.value) : null;
  }

  app.post("/api/messages", async (req, res) => {
    let { name, content, color, author, timestamp } = req.body;
    if (!name || !content || !color || !author) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }
    if (!timestamp) {
      timestamp = Date.now();
    }
    try {
      const result = await db
        .insertInto("messages")
        .values({
          name,
          content,
          color,
          author,
          timestamp,
        })
        .returning("id")
        .executeTakeFirst();
      res.status(201).json({ success: true, id: result.id });
    } catch (err) {
      res.status(500).json({ error: "Error al insertar el mensaje" });
    }
  });

  app.get("/api/messages", async (req, res) => {
    try {
      const revealTimestamp = await getRevealTimestamp();
      const messages = await db.selectFrom("messages").selectAll().execute();
      if (revealTimestamp && Date.now() < revealTimestamp) {
        const safeMessages = messages.map((msg) => ({
          ...msg,
          content: "",
        }));
        return res.json(safeMessages);
      }
      res.json(messages);
    } catch (err) {
      console.error("Error al obtener los mensajes:", err);
      res.status(500).json({ error: "Error al obtener los mensajes" });
    }
  });

  app.get("/api/messages/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const revealTimestamp = await getRevealTimestamp();
      if (revealTimestamp && Date.now() < revealTimestamp) {
        return res.status(403).json({
          error: "Aún no puedes ver los mensajes",
          revealTimestamp,
        });
      }
      const message = await db.selectFrom("messages").selectAll().where("id", "=", id).executeTakeFirst();
      if (!message) {
        return res.status(404).json({ error: "Mensaje no encontrado" });
      }
      res.json(message);
    } catch (err) {
      res.status(500).json({ error: "Error al obtener el mensaje" });
    }
  });

  app.get("/api/config/:key", async (req, res) => {
    const { key } = req.params;
    try {
      const configItem = await db.selectFrom("config").selectAll().where("id", "=", key).executeTakeFirst();
      if (!configItem) {
        return res.status(404).json({ error: "Config no encontrada" });
      }
      res.json(configItem);
    } catch (err) {
      res.status(500).json({ error: "Error al obtener la config" });
    }
  });

  app.use("/", express.static(path.join(__dirname, "views")));

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});
