const { spawn } = require("node:child_process")

function runCommand(command, args) {
  // eslint-disable-next-line no-undef
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: "inherit" })
    proc.on("exit", (code) => (code === 0 ? resolve() : reject(code)))
  })
}

let servicesAreRunning = false

async function startServicesAndDev() {
  try {
    await runCommand("npm", ["run", "services:up"])
    servicesAreRunning = true

    await runCommand("npm", ["run", "services:wait:database"])

    await runCommand("npm", ["run", "migrations:up"])

    const nextProcess = spawn("npx", ["next", "dev"], { stdio: "inherit" })

    nextProcess.on("exit", async (code) => {
      await stopServices()
      process.exit(code)
    })

    process.on("SIGINT", () => {
      console.log("\nRecebido Ctrl+C. Finalizando...")
      nextProcess.kill("SIGINT")
    })
  } catch (err) {
    await stopServices()
    process.exit(typeof err === "number" ? err : 1)
  }
}

/**
 * Encerra os serviços se estavam rodando
 */
async function stopServices() {
  if (servicesAreRunning) {
    await runCommand("npm", ["run", "services:down"])
    servicesAreRunning = false
  }
}

// Inicia todo o fluxo
startServicesAndDev()
