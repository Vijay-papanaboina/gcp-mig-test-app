import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors("*"));

/**
 * Intentionally block CPU for N milliseconds
 * This is BAD for real apps, GOOD for ASG testing
 */
function burnCpu(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {}
}

/**
 * Health check endpoint
 * Used by ALB target group
 * Must be FAST and NOT burn CPU
 */
app.get("/health", (req, res) => {
  res.status(200).send("ok");
});

/**
 * Main endpoint
 * Every request burns CPU to trigger scaling
 */
app.get("/", (req, res) => {
  burnCpu(1000); // adjust to control CPU usage
  res
    .status(200)
    .send("waited for 1 second. Image built with cloud build with rollback templates using replacement method substitute");
});

/**
 * Start server
 */
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
