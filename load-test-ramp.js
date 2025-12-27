import autocannon from "autocannon";

// const TARGET_URL = "http://35.207.215.167";
const TARGET_URL = "https://gcp-mig-test-app-cloud-run-824626066809.asia-south1.run.app";

// Ramp-up configuration (gentler for CPU-intensive apps)
const RAMP_STAGES = [
  { connections: 4, duration: 60 }, // 2 connections for 2 min (let autoscaler react)
  { connections: 6, duration: 60 }, // 4 connections for 2 min
  { connections: 8, duration: 60 }, // 6 connections for 2 min
  { connections: 10, duration: 60 }, // 8 connections for 2 min
  { connections: 12, duration: 60 }, // 10 connections for 2 min
];

// Live stats tracking
let stats = {
  total: 0,
  success: 0,
  failed: 0,
  statusCodes: {},
};

function resetStats() {
  stats = { total: 0, success: 0, failed: 0, statusCodes: {} };
}

function printLiveStats() {
  const successRate =
    stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : 0;
  const statusStr = Object.entries(stats.statusCodes)
    .map(([code, count]) => `${code}:${count}`)
    .join(" | ");

  process.stdout.write(
    `\r   📊 Live: ${stats.total} req | ✅ ${stats.success} (${successRate}%) | ❌ ${stats.failed} | ${statusStr}   `
  );
}

function runStage(stageIndex) {
  if (stageIndex >= RAMP_STAGES.length) {
    console.log("\n\n🏁 All stages completed!");
    console.log("💡 Check GCP Console to see MIG autoscaling:");
    console.log(
      "   https://console.cloud.google.com/compute/instanceGroups/details/asia-south1-c/test-app-mig"
    );
    return;
  }

  resetStats();
  const stage = RAMP_STAGES[stageIndex];
  console.log(
    `\n📈 Stage ${stageIndex + 1}/${RAMP_STAGES.length}: ${
      stage.connections
    } connections for ${stage.duration}s`
  );

  // Live stats printer
  const liveInterval = setInterval(printLiveStats, 500);

  const instance = autocannon(
    {
      url: TARGET_URL,
      connections: stage.connections,
      duration: stage.duration,
      pipelining: 1,
      renderProgressBar: false,
      renderResultsTable: false,

      // Track each response
      setupClient: (client) => {
        client.on("response", (statusCode, resBytes, responseTime) => {
          stats.total++;
          stats.statusCodes[statusCode] =
            (stats.statusCodes[statusCode] || 0) + 1;

          if (statusCode >= 200 && statusCode < 300) {
            stats.success++;
          } else {
            stats.failed++;
          }
        });
      },
    },
    (err, result) => {
      clearInterval(liveInterval);

      if (err) {
        console.error("\n❌ Error:", err);
        process.exit(1);
      }

      // Final stats for this stage
      console.log(
        `\n   ✅ Stage Complete: ${result.requests.total} requests, ${result.errors} errors`
      );
      console.log(
        `   📊 Latency: avg=${result.latency.average}ms, max=${result.latency.max}ms`
      );
      console.log(`   📈 Throughput: ${result.requests.average} req/sec`);

      // Move to next stage
      runStage(stageIndex + 1);
    }
  );

  // Handle interrupts
  process.once("SIGINT", () => {
    clearInterval(liveInterval);
    console.log("\n\n⚠️  Stopping load test...");
    instance.stop();
    process.exit(0);
  });
}

console.log("🔥 Starting RAMP-UP load test");
console.log(`🎯 Target: ${TARGET_URL}`);
console.log(
  `📊 Stages: ${RAMP_STAGES.length} (${RAMP_STAGES.map(
    (s) => s.connections
  ).join(" → ")} connections)`
);

runStage(0);
