import autocannon from "autocannon";
const TARGET_URL = "http://35.207.249.133";
// const TARGET_URL = "https://gcp-mig-test-app-cloud-run-824626066809.asia-south1.run.app";

console.log("🔥 Starting load test with autocannon");
console.log(`🎯 Target: ${TARGET_URL}`);

const instance = autocannon(
  {
    url: TARGET_URL,
    connections: 10, // 100 concurrent connections
    duration: 180, // 5 minutes in seconds
    pipelining: 1,

    // Auto-print results
    renderProgressBar: true,
    renderResultsTable: true,

    // Log response status
    setupClient: (client) => {
      client.on("response", (statusCode, resBytes, responseTime) => {
        if (statusCode !== 200) {
          console.log(`⚠️  Status: ${statusCode} | Time: ${responseTime}ms`);
        }
      });
    },
  },
  (err, result) => {
    if (err) {
      console.error("❌ Error:", err);
      process.exit(1);
    }

    console.log("🏁 Load test completed!");
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
