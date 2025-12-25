# Load Testing with Autocannon

Uses `autocannon` - a fast HTTP/1.1 benchmarking tool.

## Install

```bash
npm install autocannon --save-dev
```

## Run

```bash
node load-test.js
```

## Configuration

- **Target**: http://35.207.215.167
- **Connections**: 100 concurrent
- **Duration**: 5 minutes
- **Request pipelining**: 1

## Expected Autoscaling

1. Start: 2 instances
2. CPU >60% → Scale up
3. Max: 6 instances
4. After test: Scale down

## Monitor

https://console.cloud.google.com/compute/instanceGroups/details/asia-south1-c/test-app-mig
