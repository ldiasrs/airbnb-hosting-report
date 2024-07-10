import express from "express";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { generateHostingInvoiceSpreadsheet } from "./src/airbnb-hosting-invoice.js";
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, "src");

const upload = multer({ dest: "uploads/" }); // Adjust 'uploads/' if needed

// Serve static files from the root directory
app.use(express.static(rootDir));

app.get("/", (req, res) => {
  res.redirect("/report.html");
});

app.post("/report", upload.single("report"), async (req, res) => {
  const { originalname, filename, path } = req.file;
  console.log("Received file:", originalname, filename, path);
  const reportJson = await generateHostingInvoiceSpreadsheet(path);
  res.json(reportJson);
});

app.listen(3000, () => console.log("Server listening on port 3000"));
