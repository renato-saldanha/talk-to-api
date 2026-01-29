import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PineconeSeedService } from '../services/pinecone-seed.service';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedService = app.get(PineconeSeedService);
  
  try {
    await seedService.seed();
    console.log('Pinecone seed completed successfully');
  } catch (error) {
    console.error('Error seeding Pinecone:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

seed();
