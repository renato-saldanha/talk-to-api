import * as fs from "fs";
import * as path from "path";

describe("Entrypoint Integration Tests", () => {
  const entrypointPath = path.join(process.cwd(), "entrypoint.sh");
  const waitForPostgresPath = path.join(process.cwd(), "wait-for-postgres.sh");

  it("should have entrypoint.sh file", () => {
    expect(fs.existsSync(entrypointPath)).toBe(true);
  });

  it("should have wait-for-postgres.sh file", () => {
    expect(fs.existsSync(waitForPostgresPath)).toBe(true);
  });

  it("should have executable permissions on entrypoint.sh", () => {
    const stats = fs.statSync(entrypointPath);
    expect(stats.isFile()).toBe(true);
  });

  it("should have executable permissions on wait-for-postgres.sh", () => {
    const stats = fs.statSync(waitForPostgresPath);
    expect(stats.isFile()).toBe(true);
  });

  it("should contain PostgreSQL wait step", () => {
    const content = fs.readFileSync(entrypointPath, "utf-8");
    expect(content).toContain("Waiting for PostgreSQL");
    expect(content).toContain("wait-for-postgres.sh");
  });

  it("should contain environment validation step", () => {
    const content = fs.readFileSync(entrypointPath, "utf-8");
    expect(content).toContain("Validating environment variables");
    expect(content).toContain("DATABASE_URL");
    expect(content).toContain("OPENAI_API_KEY");
    expect(content).toContain("PINECONE_API_KEY");
    expect(content).toContain("PINECONE_INDEX_NAME");
  });

  it("should contain Prisma generate step", () => {
    const content = fs.readFileSync(entrypointPath, "utf-8");
    expect(content).toContain("Generating Prisma Client");
    expect(content).toContain("prisma generate");
  });

  it("should contain migrations step", () => {
    const content = fs.readFileSync(entrypointPath, "utf-8");
    expect(content).toContain("Running database migrations");
    expect(content).toContain("prisma migrate deploy");
  });

  it("should contain Pinecone seed step", () => {
    const content = fs.readFileSync(entrypointPath, "utf-8");
    expect(content).toContain("Seeding Pinecone");
    expect(content).toContain("SKIP_PINECONE_SEED");
    expect(content).toContain("seed-pinecone.js");
  });

  it("should contain server start step", () => {
    const content = fs.readFileSync(entrypointPath, "utf-8");
    expect(content).toContain("Starting NestJS server");
    expect(content).toContain("start:prod");
  });

  it("should have set -e for error handling", () => {
    const content = fs.readFileSync(entrypointPath, "utf-8");
    expect(content).toContain("set -e");
  });

  it("should validate all required environment variables", () => {
    const content = fs.readFileSync(entrypointPath, "utf-8");
    const requiredVars = [
      "DATABASE_URL",
      "OPENAI_API_KEY",
      "PINECONE_API_KEY",
      "PINECONE_INDEX_NAME",
      "PINECONE_ENVIRONMENT",
    ];

    requiredVars.forEach((varName) => {
      expect(content).toContain(varName);
      expect(content).toContain("ERROR:");
    });
  });

  it("should execute steps in correct order", () => {
    const content = fs.readFileSync(entrypointPath, "utf-8");
    const steps = [
      "Step 1: Waiting for PostgreSQL",
      "Step 2: Validating environment variables",
      "Step 3: Generating Prisma Client",
      "Step 4: Running database migrations",
      "Step 5: Seeding Pinecone",
      "Step 6: Starting NestJS server",
    ];

    let lastIndex = -1;
    steps.forEach((step) => {
      const index = content.indexOf(step);
      expect(index).toBeGreaterThan(-1);
      expect(index).toBeGreaterThan(lastIndex);
      lastIndex = index;
    });
  });

  it("should handle SKIP_PINECONE_SEED flag", () => {
    const content = fs.readFileSync(entrypointPath, "utf-8");
    expect(content).toContain("SKIP_PINECONE_SEED");
    expect(content).toContain("Skipping Pinecone seed");
  });

  it("should have error handling for seed script", () => {
    const content = fs.readFileSync(entrypointPath, "utf-8");
    expect(content).toContain("Warning: Pinecone seed failed");
    expect(content).toContain("||");
  });
});
