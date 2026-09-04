import { spawn } from "node:child_process";
import { createConnection } from "node:net";

// Start three origins with one command. Never terminate a server we did not start.
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  process.exitCode = code;
}
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => stop());
const occupied = (port) =>
  new Promise((resolve) => {
    const socket = createConnection({ port, host: "127.0.0.1" });
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
  });
for (const port of [5273, 5274, 5275]) {
  if (await occupied(port)) {
    console.error(
      `Port ${port} is already in use. Stop its existing development server before running dev:experience.`,
    );
    process.exitCode = 1;
    break;
  }
}
if (!process.exitCode) {
  for (const port of [5273, 5274, 5275]) {
    const child = spawn(
      process.execPath,
      ["node_modules/vite/bin/vite.js", "--port", String(port), "--strictPort"],
      { stdio: "inherit" },
    );
    children.push(child);
    child.on("error", (error) => {
      console.error(error.message);
      stop(1);
    });
    child.on("exit", (code) => {
      if (!stopping) stop(code || 1);
    });
  }
  console.log(
    "As I Am: http://localhost:5273 · LUNA: :5274/cinema · OLIVA: :5275/restaurant",
  );
}
