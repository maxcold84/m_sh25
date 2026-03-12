import { rm } from "node:fs/promises";

await rm("server", { recursive: true, force: true });
console.log("Removed server");
