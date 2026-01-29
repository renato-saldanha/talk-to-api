import { Injectable } from '@nestjs/common';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';

@Injectable()
export class RagService {
  private pinecone: Pinecone;
  private embeddings: OpenAIEmbeddings;
  private indexName: string;
  private threshold: number;

  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    this.indexName = process.env.PINECONE_INDEX_NAME!;
    this.threshold = parseFloat(
      process.env.RAG_QUALIFIED_SCORE_THRESHOLD || '0.75',
    );
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY!,
      modelName: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    });
  }

  async querySimilarReasons(reason: string): Promise<number> {
    try {
      const embedding = await this.embeddings.embedQuery(reason);
      const index = this.pinecone.index(this.indexName);

      const queryResponse = await index.query({
        vector: embedding,
        topK: 1,
        includeMetadata: true,
      });

      if (queryResponse.matches && queryResponse.matches.length > 0) {
        return queryResponse.matches[0].score || 0;
      }

      return 0;
    } catch (error) {
      console.error('Error querying Pinecone:', error);
      return 0;
    }
  }

  async isQualified(reason: string): Promise<boolean> {
    const score = await this.querySimilarReasons(reason);
    return score >= this.threshold;
  }

  getThreshold(): number {
    return this.threshold;
  }
}
