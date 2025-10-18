const { spawn } = require("child_process")

// Função principal
async function runTestsWithCleanup() {
  const testProcess = spawn(
    "npm",
    [
      "run",
      "services:up",
      "&&",
      "concurrently",
      "--names",
      "next,jest",
      "--hide",
      "next",
      "-k",
      "--success",
      "command-jest",
      '"next dev"',
      '"jest --runInBand --verbose"',
    ],
    {
      stdio: "inherit",
      shell: true,
    },
  )

  testProcess.on("error", (error) => {
    console.error("Erro ao executar os testes:", error)
    process.exit(1)
  })

  testProcess.on("close", (code) => {
    console.log(`Processo finalizado com código: ${code}`)

    const stopProcess = spawn("npm", ["run", "services:stop"], {
      stdio: "inherit",
      shell: true,
    })

    stopProcess.on("close", () => {
      process.exit(code)
    })

    stopProcess.on("error", () => {
      process.exit(1)
    })
  })
}

runTestsWithCleanup()
