// Starts the FastAPI dev server using the backend virtualenv, on any OS,
// without requiring the venv to be activated in the current shell.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../backend");
const isWindows = process.platform === "win32";
const venvPython = isWindows
  ? resolve(backendDir, ".venv/Scripts/python.exe")
  : resolve(backendDir, ".venv/bin/python");

let python = venvPython;
if (!existsSync(venvPython)) {
  python = isWindows ? "python" : "python3";
  console.warn(
    `[backend] Virtualenv not found at ${venvPython}. Falling back to "${python}".\n` +
      "[backend] See the README to create it: python -m venv .venv && pip install -r requirements.txt",
  );
}

const port = process.env.API_PORT ?? "8000";
const server = spawn(
  python,
  ["-m", "uvicorn", "app.main:app", "--reload", "--reload-dir", "app", "--port", port],
  { cwd: backendDir, stdio: "inherit" },
);

server.on("error", (error) => {
  console.error(`[backend] Could not start uvicorn: ${error.message}`);
  process.exit(1);
});
server.on("exit", (code) => process.exit(code ?? 0));

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.kill(signal));
}
