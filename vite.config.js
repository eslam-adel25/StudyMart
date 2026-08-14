import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import { defineConfig } from "vite";

// Plugin to copy js/ directory to dist/js/ and preserve legacy app script
function legacyAppPlugin() {
  return {
    name: "legacy-app-plugin",
    apply: "build",

    // Ensure the legacy app script tag is in the HTML
    transformIndexHtml(html) {
      const scriptTag = '<script type="module" src="./js/app.js"><\/script>';

      // Check if the script tag already exists
      if (html.includes(scriptTag) || html.includes('src="./js/app.js"')) {
        return html;
      }

      // Inject the script tag before closing </body>
      return html.replace("</body>", `    ${scriptTag}\n  </body>`);
    },

    // Copy js/ directory after build completes
    writeBundle() {
      const sourceDir = path.join(__dirname, "js");
      const destDir = path.join(__dirname, "dist", "js");

      // Recursive copy function
      function copyDirRecursive(src, dest) {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }

        const files = fs.readdirSync(src);
        files.forEach((file) => {
          const srcPath = path.join(src, file);
          const destPath = path.join(dest, file);

          if (fs.statSync(srcPath).isDirectory()) {
            copyDirRecursive(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        });
      }

      // Copy the js directory
      copyDirRecursive(sourceDir, destDir);
      console.log(`✓ Copied js/ directory to dist/js/`);
    },
  };
}

export default defineConfig(({ command }) => {
  return {
    base: command === "build" ? "/StudyMart/" : "/",
    envPrefix: ["VITE_", "PLATFORM_", "TEACHER_", "STUDENT_"],
    plugins: [legacyAppPlugin(), react(), tailwindcss()],
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
