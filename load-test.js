import autocannon from "autocannon";
const TARGET_URL = "http://35.207.215.167";

console.log("🔥 Starting load test with autocannon");
console.log(`🎯 Target: ${TARGET_URL}`);
console.log("📊 Duration: 5 minutes");
console.log("🚀 Connections: 100");
console.log("");

const instance = autocannon(
  {
    url: TARGET_URL,
    connections: 100, // 100 concurrent connections
    duration: 180, // 5 minutes in seconds
    pipelining: 1,

    // Auto-print results
    renderProgressBar: true,
    renderResultsTable: true,
  },
  (err, result) => {
    if (err) {
      console.error("❌ Error:", err);
      process.exit(1);
    }

    console.log("");
    console.log("🏁 Load test completed!");
    console.log("");
    console.log("💡 Check GCP Console to see MIG autoscaling:");
    console.log(
      "   https://console.cloud.google.com/compute/instanceGroups/details/asia-south1-c/test-app-mig"
    );
  }
);

// Track progress
autocannon.track(instance, {
  renderProgressBar: true,
  renderResultsTable: false,
});

// Handle interrupts
process.once("SIGINT", () => {
  console.log("\n⚠️  Stopping load test...");
  instance.stop();
});
