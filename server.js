import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { Kysely, SqliteDialect } from "kysely";
import Database from "better-sqlite3";
import bodyParser from "body-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

config({ path: path.resolve(__dirname, ".env") });

const ADMIN_PASSWORD = process.env.UNLOCK_ADMIN_PASSWORD;

async function main() {
  const app = express();
  const port = process.env.PORT || 3000;
  let server;

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  const dbPath = process.env.NODE_ENV === "development" ? path.resolve(__dirname, "takimbox.db") : "/app/takimbox.db";

  console.log("Usando base de datos en:", dbPath);

  let database;
  try {
    database = new Database(dbPath, {
      verbose: process.env.NODE_ENV === "development" ? console.log : undefined,
    });
    console.log("Conexión a la base de datos establecida");
  } catch (err) {
    console.error("Error al conectar con la base de datos:", err);
    throw err;
  }

  const cleanup = () => {
    console.log("Cerrando servidor y base de datos...");
    server.close(() => {
      database.close();
      console.log("Servidor y base de datos cerrados correctamente");
      process.exit(0);
    });
  };

  process.on("SIGTERM", cleanup);
  process.on("SIGINT", cleanup);

  const db = new Kysely({
    dialect: new SqliteDialect({
      database,
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
        .addColumn("deleted", "integer", (col) => col.defaultTo(0).notNull())
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
    try {
      const configItem = await db
        .selectFrom("config")
        .select(["value"])
        .where("id", "=", String("revealTimestamp"))
        .executeTakeFirst();
      return configItem ? Number(configItem.value) : null;
    } catch (err) {
      console.error("Error al obtener revealTimestamp:", err);
      return null;
    }
  }

  app.post("/api/messages", async (req, res) => {
    let { name, content, color, author, timestamp } = req.body;
    if (!name || !content || !color || !author) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    if (name.length > 26 || author.length > 26) {
      return res.status(400).json({ error: "Los campos name y author deben tener como máximo 26 caracteres" });
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
      const adminPassword = req.query.adminUnlock;
      const isAdmin = adminPassword && adminPassword === ADMIN_PASSWORD;
      const messages = await db.selectFrom("messages").selectAll().where("deleted", "=", 0).execute();

      if (revealTimestamp && Date.now() < revealTimestamp && !isAdmin) {
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

  app.get("/api/verify-admin", async (req, res) => {
    const adminPassword = req.query.adminUnlock;
    const isAdmin = adminPassword && adminPassword === ADMIN_PASSWORD;
    res.json({ isAdmin });
  });

  app.delete("/api/messages/:id", async (req, res) => {
    const { id } = req.params;
    const adminPassword = req.query.adminUnlock;

    if (!adminPassword || adminPassword !== ADMIN_PASSWORD) {
      return res.status(403).json({ error: "No autorizado" });
    }

    try {
      await db.updateTable("messages").set({ deleted: 1 }).where("id", "=", Number(id)).execute();

      res.json({ success: true });
    } catch (err) {
      console.error("Error al eliminar el mensaje:", err);
      res.status(500).json({ error: "Error al eliminar el mensaje" });
    }
  });

  app.use("/", express.static(path.join(__dirname, "views")));

  server = app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});
