import { Injectable, Logger } from '@nestjs/common';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';

@Injectable()
export class PineconeSeedService {
  private readonly logger = new Logger(PineconeSeedService.name);
  private pinecone: Pinecone;
  private embeddings: OpenAIEmbeddings;
  private indexName: string;
  private environment: string;

  private readonly strongReasons = [
    'Preciso fazer cirurgia e o médico exigiu perder peso',
    'Minha saúde está em risco, pressão alta e diabetes',
    'Quero engravidar mas o médico disse que preciso emagrecer',
    'Tenho dor nas articulações por causa do peso',
    'Meu colesterol está altíssimo e estou com medo de infarto',
  ];

  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    this.indexName = process.env.PINECONE_INDEX_NAME!;
    this.environment = process.env.PINECONE_ENVIRONMENT || 'gcp-starter';
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY!,
      modelName: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    });
  }

  async seed(): Promise<void> {
    try {
      this.logger.log('Starting Pinecone seed process...');

      const skipSeed = process.env.SKIP_PINECONE_SEED === '1';
      if (skipSeed) {
        this.logger.log('Skipping Pinecone seed (SKIP_PINECONE_SEED=1)');
        return;
      }

      await this.ensureIndexExists();

      const index = this.pinecone.index(this.indexName);
      const stats = await index.describeIndexStats();

      if (stats.totalRecordCount && stats.totalRecordCount > 0) {
        this.logger.log(
          `Index already contains ${stats.totalRecordCount} records. Skipping seed.`,
        );
        return;
      }

      this.logger.log('Populating index with strong reasons...');

      const vectors = [];
      for (let i = 0; i < this.strongReasons.length; i++) {
        const reason = this.strongReasons[i];
        const embedding = await this.embeddings.embedQuery(reason);

        vectors.push({
          id: `reason-${i + 1}`,
          values: embedding,
          metadata: {
            text: reason,
            type: 'strong_reason',
            index: i + 1,
          },
        });
      }

      await index.upsert(vectors);
      this.logger.log(
        `Successfully seeded ${this.strongReasons.length} strong reasons`,
      );
    } catch (error) {
      this.logger.error('Error seeding Pinecone:', error);
      throw error;
    }
  }

  private getServerlessSpec(): { cloud: 'aws' | 'gcp'; region: string } {
    const env = (this.environment || '').toLowerCase();
    if (env.startsWith('gcp')) {
      return { cloud: 'gcp', region: 'us-central1' };
    }
    return { cloud: 'aws', region: 'us-east-1' };
  }

  private async ensureIndexExists(): Promise<void> {
    try {
      const indexList = await this.pinecone.listIndexes();
      const indexExists = indexList.indexes?.some(
        (idx) => idx.name === this.indexName,
      );

      if (!indexExists) {
        const { cloud, region } = this.getServerlessSpec();
        this.logger.log(`Creating index: ${this.indexName} (${cloud}/${region})`);
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: 1536,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud,
              region,
            },
          },
        });

        this.logger.log('Waiting for index to be ready...');
        await new Promise((resolve) => setTimeout(resolve, 10000));
      } else {
        this.logger.log(`Index ${this.indexName} already exists`);
      }
    } catch (error) {
      this.logger.error('Error ensuring index exists:', error);
      throw error;
    }
  }
}
