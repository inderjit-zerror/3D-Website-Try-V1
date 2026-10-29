import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    // React Three Fiber scene components drive Three.js imperatively:
    // materials, uniforms, the camera and the scene are mutated every frame
    // by design, which the React Compiler immutability rule can't model.
    files: ["src/components/canvas/**/*.{js,jsx}"],
    rules: { "react-hooks/immutability": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
