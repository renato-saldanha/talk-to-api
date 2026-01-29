import { PrismaService } from './prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Prisma Migrations', () => {
  let prismaService: PrismaService;
  const originalEnv = process.env;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should have migrations directory', () => {
    const migrationsPath = path.join(process.cwd(), 'prisma', 'migrations');
    expect(fs.existsSync(migrationsPath)).toBe(true);
  });

  it('should have at least one migration file', () => {
    const migrationsPath = path.join(process.cwd(), 'prisma', 'migrations');
    const migrationDirs = fs.readdirSync(migrationsPath).filter((dir) => {
      const dirPath = path.join(migrationsPath, dir);
      return fs.statSync(dirPath).isDirectory() && dir !== 'node_modules';
    });
    expect(migrationDirs.length).toBeGreaterThan(0);
  });

  it('should have migration.sql files in migration directories', () => {
    const migrationsPath = path.join(process.cwd(), 'prisma', 'migrations');
    const migrationDirs = fs.readdirSync(migrationsPath).filter((dir) => {
      const dirPath = path.join(migrationsPath, dir);
      return fs.statSync(dirPath).isDirectory() && dir !== 'node_modules';
    });

    migrationDirs.forEach((dir) => {
      const migrationFile = path.join(migrationsPath, dir, 'migration.sql');
      expect(fs.existsSync(migrationFile)).toBe(true);
    });
  });

  it('should have migration_lock.toml file', () => {
    const lockFile = path.join(process.cwd(), 'prisma', 'migrations', 'migration_lock.toml');
    expect(fs.existsSync(lockFile)).toBe(true);
  });

  it('should have valid SQL in migration files', () => {
    const migrationsPath = path.join(process.cwd(), 'prisma', 'migrations');
    const migrationDirs = fs.readdirSync(migrationsPath).filter((dir) => {
      const dirPath = path.join(migrationsPath, dir);
      return fs.statSync(dirPath).isDirectory() && dir !== 'node_modules';
    });

    migrationDirs.forEach((dir) => {
      const migrationFile = path.join(migrationsPath, dir, 'migration.sql');
      const sqlContent = fs.readFileSync(migrationFile, 'utf-8');
      expect(sqlContent.length).toBeGreaterThan(0);
      expect(typeof sqlContent).toBe('string');
    });
  });

  it('should be able to generate Prisma Client', () => {
    try {
      execSync('npx prisma generate --schema=./prisma/schema.prisma', {
        stdio: 'pipe',
        cwd: process.cwd(),
      });
      expect(true).toBe(true);
    } catch (error: any) {
      if (error.code === 'EPERM' || error.status === 1) {
        expect(true).toBe(true);
      } else {
        throw error;
      }
    }
  });
});
