/**
 * RAG Knowledge Base Document Indexer
 * Splits uploaded documents into searchable text chunks for AI Retrieval-Augmented Generation.
 */

export interface IndexedChunk {
  id: string
  text: string
  source: string
}

export function indexDocumentContent(documentText: string, sourceName: string, chunkSize = 500): IndexedChunk[] {
  const words = documentText.split(/\s+/)
  const chunks: IndexedChunk[] = []

  for (let i = 0; i < words.length; i += chunkSize) {
    const chunkText = words.slice(i, i + chunkSize).join(" ")
    chunks.push({
      id: `chunk-${Math.random().toString(36).substring(2, 9)}`,
      text: chunkText,
      source: sourceName
    })
  }

  return chunks
}

export function searchIndexedChunks(chunks: IndexedChunk[], query: string, topK = 3): IndexedChunk[] {
  const queryLower = query.toLowerCase()
  return chunks
    .map(chunk => {
      const occurrences = (chunk.text.toLowerCase().match(new RegExp(queryLower, "g")) || []).length
      return { chunk, score: occurrences }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(item => item.chunk)
}
