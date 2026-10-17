import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypes from "eslint-config-next/typescript";
export default defineConfig([...nextVitals, ...nextTypes, globalIgnores([".next/**", ".vercel/**", "test-results/**", "playwright-report/**", "next-env.d.ts"])]);

