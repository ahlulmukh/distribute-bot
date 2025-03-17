const socketDistribute = require("./class/wsdistribute");
const chalk = require("chalk");
const { getRandomProxy, loadProxies } = require("./class/proxy");
const fs = require("fs");
const { logMessage } = require("./utils/logger");

async function main() {
  console.log(
    chalk.cyan(`
░█▀▄░▀█▀░█▀▀░▀█▀░█▀▄░▀█▀░█▀▄░█░█░▀█▀░█▀▀
░█░█░░█░░▀▀█░░█░░█▀▄░░█░░█▀▄░█░█░░█░░█▀▀
░▀▀░░▀▀▀░▀▀▀░░▀░░▀░▀░▀▀▀░▀▀░░▀▀▀░░▀░░▀▀▀
    By : El Puqus Airdrop
    github.com/ahlulmukh
 Use it at your own risk
  `)
  );

  try {
    const token = fs
      .readFileSync("provider.txt", "utf8")
      .split("\n")
      .filter((line) => line.trim());

    const uniqueToken = [...new Set(token.map((token) => token.trim()))];
    const count = uniqueToken.length;

    const proxiesLoaded = loadProxies();
    if (!proxiesLoaded) {
      logMessage(null, null, "No Proxy. Using default IP", "warning");
    }

    for (let index = 0; index < uniqueToken.length; index++) {
      console.log(chalk.white("-".repeat(85)));
      const provider = uniqueToken[index];
      const currentNum = index + 1;
      const total = count;
      const proxy = await getRandomProxy(currentNum, total);

      const distribute = new socketDistribute(
        provider,
        proxy,
        currentNum,
        total
      );
      await distribute.connectWebSocket();
    }
  } catch (error) {
    logMessage(null, null, `Main process failed: ${error.message}`, "error");
    console.log(chalk.red("Restarting in 5 seconds..."));
    setTimeout(main, 5000);
  }
}

main();
