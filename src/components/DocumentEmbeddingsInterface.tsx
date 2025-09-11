import React, { useState, useEffect } from 'react';

interface EmbeddingProgress {
  type: string;
  message?: string;
  processed?: number;
  total?: number;
  progress?: number;
  current?: string;
  documents_processed?: number;
  documents_errors?: number;
  chunks_processed?: number;
  chunks_errors?: number;
  total_documents?: number;
  total_chunks?: number;
  error?: string;
}

interface DocumentStatus {
  id: string;
  title: string;
  file_type: string;
  doc_status: string;
  total_chunks: number;
  chunks_with_embeddings: number;
  chunks_without_embeddings: number;
}

const DocumentEmbeddingsInterface: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<EmbeddingProgress | null>(null);
  const [documents, setDocuments] = useState<DocumentStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch document status
  const fetchDocumentStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/rag-documents/status');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching document status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentStatus();
  }, []);

  const generateEmbeddings = async () => {
    setIsGenerating(true);
    setProgress(null);

    try {
      const response = await fetch('/api/admin/rag-documents/generate-embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to start embedding generation');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              setProgress(data);
              
              if (data.type === 'complete') {
                setIsGenerating(false);
                // Refresh document status
                await fetchDocumentStatus();
              } else if (data.type === 'error') {
                setIsGenerating(false);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating embeddings:', error);
      setIsGenerating(false);
    }
  };

  const getProgressMessage = () => {
    if (!progress) return '';
    
    switch (progress.type) {
      case 'start':
        return progress.message || 'Starting embedding generation...';
      case 'total':
        return `Found ${progress.total} documents to process`;
      case 'progress':
        return `Processing documents: ${progress.processed}/${progress.total} (${progress.progress}%)`;
      case 'phase':
        return progress.message || 'Processing document chunks...';
      case 'chunk_total':
        return `Found ${progress.total} chunks to process`;
      case 'chunk_progress':
        return `Processing chunks: ${progress.processed}/${progress.total} (${progress.progress}%)`;
      case 'complete':
        return `Complete! Documents: ${progress.documents_processed}/${progress.total_documents}, Chunks: ${progress.chunks_processed}/${progress.total_chunks}`;
      case 'error':
        return `Error: ${progress.error}`;
      default:
        return progress.message || '';
    }
  };

  const getOverallProgress = () => {
    if (!progress) return 0;
    
    if (progress.type === 'progress' && progress.total) {
      return progress.progress || 0;
    }
    
    if (progress.type === 'chunk_progress' && progress.total) {
      return progress.progress || 0;
    }
    
    if (progress.type === 'complete') {
      return 100;
    }
    
    return 0;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Document Embeddings
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Generate embeddings for uploaded RAG documents and their chunks to enable semantic search in the AI Chat.
          This process converts document content into vector embeddings that allow the AI to find relevant information.
        </p>
        
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={generateEmbeddings}
            disabled={isGenerating}
            className={`px-4 py-2 rounded-md font-medium ${
              isGenerating
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isGenerating ? 'Generating...' : 'Generate Embeddings'}
          </button>
          
          <button
            onClick={fetchDocumentStatus}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            {isLoading ? 'Refreshing...' : 'Refresh Status'}
          </button>
        </div>

        {progress && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{getProgressMessage()}</span>
              <span>{getOverallProgress()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getOverallProgress()}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Document Status Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Document
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Document Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chunks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Embeddings
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {doc.title.length > 50 ? `${doc.title.substring(0, 50)}...` : doc.title}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {doc.file_type.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    doc.doc_status === 'Has Doc Embedding' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {doc.doc_status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {doc.total_chunks} total
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-medium">
                        {doc.chunks_with_embeddings}
                      </span>
                      <span className="text-gray-400">/</span>
                      <span className="text-gray-600">
                        {doc.chunks_without_embeddings}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {doc.total_chunks > 0 
                        ? `${Math.round((doc.chunks_with_embeddings / doc.total_chunks) * 100)}% complete`
                        : '0% complete'
                      }
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {documents.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            No RAG documents found. Upload documents first to generate embeddings.
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentEmbeddingsInterface;
