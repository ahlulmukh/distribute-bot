const { getProxyAgent } = require("./proxy");
const WebSocket = require("ws");
const chalk = require("chalk");
const UserAgent = require("user-agents");
const { logMessage } = require("../utils/logger");
const generator = new (require("../utils/generator"))();

class socketDistribute {
  constructor(provider, proxy = null, currentNum, total) {
    this.currentNum = currentNum;
    this.total = total;
    this.ws = null;
    this.provider = provider;
    this.proxy = proxy;
  }

  async connectWebSocket() {
    return new Promise((resolve) => {
      const userAgent = new UserAgent().toString();
      const wsOptions = this.proxy
        ? {
            agent: getProxyAgent(this.proxy),
            headers: {
              "accept-encoding": "gzip, deflate, br, zstd",
              "accept-language": "en-US,en;q=0.9",
              "cache-control": "no-cache",
              connection: "Upgrade",
              host: "ws.distribute.ai",
              origin: "chrome-extension://knhbjeinoabfecakfppapfgdhcpnekmm",
              pragma: "no-cache",
              "sec-websocket-extensions":
                "permessage-deflate; client_max_window_bits",
              "sec-websocket-version": "13",
              upgrade: "websocket",
              "user-agent": userAgent,
            },
          }
        : {
            headers: {
              "accept-encoding": "gzip, deflate, br, zstd",
              "accept-language": "en-US,en;q=0.9",
              "cache-control": "no-cache",
              connection: "Upgrade",
              host: "ws.distribute.ai",
              origin: "chrome-extension://knhbjeinoabfecakfppapfgdhcpnekmm",
              pragma: "no-cache",
              "sec-websocket-extensions":
                "permessage-deflate; client_max_window_bits",
              "sec-websocket-version": "13",
              upgrade: "websocket",
              "user-agent": userAgent,
            },
          };
      this.ws = new WebSocket(
        `wss://ws.distribute.ai/?token=${this.provider}&version=0.1.22&platform=extension`,
        wsOptions
      );

      this.ws.onopen = () => {
        logMessage(
          this.currentNum,
          this.total,
          `WebSocket connected for account ${this.currentNum}`,
          "success"
        );
        this.sendSystemData();
        this.sendHeartBeat();
        setInterval(() => {
          this.sendHeartBeat();
        }, 60000);
        resolve();
      };

      this.ws.onmessage = async (event) => {
        await this.handleMessage(event);
      };

      this.ws.onclose = () => {
        logMessage(
          this.currentNum,
          this.total,
          `WebSocket disconnected for provider: ${this.provider}`,
          "warning"
        );
        this.reconnectWebSocket();
      };

      this.ws.onerror = (error) => {
        logMessage(
          this.currentNum,
          this.total,
          `WebSocket error for account ${this.currentNum}: ${error.message}`,
          "error"
        );
        this.reconnectWebSocket();
      };
    });
  }

  async handleMessage(event) {
    let rawData = event.data.toString();
    if (rawData.startsWith("{") && rawData.endsWith("}")) {
      try {
        const message = JSON.parse(rawData);
        console.log(chalk.white("-".repeat(85)));

        if (message.type === "acknowledged") {
          logMessage(
            this.currentNum,
            this.total,
            `Acknowledged: ${message.data.message}`,
            "success"
          );
        } else if (message.type === "serverMetrics") {
          const {
            totalEarnings,
            totalUptime,
            creditsEarned,
            solvedTasks,
            networkPerformance,
          } = message.data;
          logMessage(
            this.currentNum,
            this.total,
            `Uptime: ${totalUptime}`,
            "success"
          );
          logMessage(
            this.currentNum,
            this.total,
            `Earnings: ${totalEarnings}`,
            "success"
          );
          logMessage(
            this.currentNum,
            this.total,
            `Credits: ${creditsEarned}`,
            "success"
          );
          logMessage(
            this.currentNum,
            this.total,
            `Tasks: ${solvedTasks}`,
            "success"
          );
          logMessage(
            this.currentNum,
            this.total,
            `Performance: ${networkPerformance}`,
            "success"
          );
        } else if (message.type === "error") {
          this.sendSystemData();
        }
      } catch (error) {
        logMessage(
          this.currentNum,
          this.total,
          `Error parsing message: ${error.message}`,
          "error"
        );
      }
    } else {
      logMessage(
        this.currentNum,
        this.total,
        `Received non-JSON message: ${rawData}`,
        "debug"
      );
    }
  }

  async reconnectWebSocket() {
    logMessage(
      this.currentNum,
      this.total,
      `Reconnecting WebSocket for provider: ${this.provider}`,
      "warning"
    );

    setTimeout(async () => {
      try {
        await this.connectWebSocket();
      } catch (error) {
        logMessage(
          this.currentNum,
          this.total,
          `Reconnect failed: ${error.message}`,
          "error"
        );
        this.reconnectWebSocket();
      }
    }, 5000);
  }

  async sendSystemData() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        id: generator.generateId(26),
        type: "system",
        data: {
          gpuInfo: generator.generateRandomGPU(),
          memoryInfo: {
            availableCapacity:
              Math.floor(Math.random() * 1000000000) + 1000000000,
            capacity: Math.floor(Math.random() * 1000000000) + 2000000000,
          },
          operatingSystem: generator.generaterOS(),
          machineId: generator.generateId(32).toLowerCase(),
          cpuInfo: generator.generateRandomCpu(),
        },
      };

      this.ws.send(JSON.stringify(message));
    }
  }

  async sendHeartBeat() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        id: generator.generateId(),
        type: "heartbeat",
        data: {
          inferenceState: true,
          version: "0.1.22",
          mostRecentModel: "unknown",
          status: "active",
        },
      };

      this.ws.send(JSON.stringify(message));
    }
  }
}

module.exports = socketDistribute;
