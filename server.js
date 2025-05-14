import e from "express";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

config({ path: path.resolve(__dirname, ".env") });

async function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const __filename = path.basename(fileURLToPath(import.meta.url));

  const app = e();
  const port = 3000;

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});