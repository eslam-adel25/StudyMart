import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => {
  return {
    base: command === "build" ? "/StudyMart/" : "/",
    envPrefix: ["VITE_", "PLATFORM_", "TEACHER_", "STUDENT_"],
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
        "./.featured-config.js": path.resolve(
          __dirname,
          "js/.featured-config.js",
        ),
        "../services/.featured-config.js": path.resolve(
          __dirname,
          "js/.featured-config.js",
        ),
        "./services/.featured-config.js": path.resolve(
          __dirname,
          "js/.featured-config.js",
        ),
        "/.featured-config.js": path.resolve(
          __dirname,
          "js/.featured-config.js",
        ),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== "true",
      watch: process.env.DISABLE_HMR === "true" ? null : {},
    },
  };
});
