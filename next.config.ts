/**
 * @file Next.js build output configuration.
 * Uses .next for production/Vercel and .next-dev for development so production
 * verification does not overwrite an active development build.
 */
import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
export default function config(phase: string): NextConfig {
  // Keep production verification from overwriting a running development server.
  return {
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  };
}
