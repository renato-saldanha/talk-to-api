export function validateEnvironment(): void {
  const requiredVars = [
    'DATABASE_URL',
    'OPENAI_API_KEY',
    'PINECONE_API_KEY',
    'PINECONE_INDEX_NAME',
    'PINECONE_ENVIRONMENT',
  ];

  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`,
    );
  }

  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('sk-')) {
    throw new Error('OPENAI_API_KEY must be a valid OpenAI API key');
  }

  if (process.env.PINECONE_API_KEY && !process.env.PINECONE_API_KEY.startsWith('pcsk_')) {
    throw new Error('PINECONE_API_KEY must be a valid Pinecone API key');
  }

  console.log('Environment variables validated successfully');
}
