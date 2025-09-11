import React, { useState } from 'react';

interface EmbeddingProgress {
  type: string;
  message?: string;
  processed?: number;
  total?: number;
  progress?: number;
  articles_processed?: number;
  articles_errors?: number;
  articles_total?: number;
  documents_processed?: number;
  documents_errors?: number;
  documents_total?: number;
  chunks_processed?: number;
  chunks_errors?: number;
  chunks_total?: number;
  error?: string;
}

interface UnifiedEmbeddingsInterfaceProps {
  backendUrl: string;
}

const UnifiedEmbeddingsInterface: React.FC<UnifiedEmbeddingsInterfaceProps> = ({ backendUrl }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<EmbeddingProgress | null>(null);

  const generateEmbeddings = async () => {
    setIsGenerating(true);
    setProgress(null);

    try {
      const response = await fetch(`${backendUrl}/api/admin/chat/generate-embeddings`, {
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

      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last line in buffer as it might be incomplete
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataContent = line.slice(6).trim();
            
            // Skip empty data lines
            if (!dataContent) continue;
            
            try {
              const data = JSON.parse(dataContent);
              setProgress(data);
              
              if (data.type === 'complete') {
                setIsGenerating(false);
              } else if (data.type === 'error') {
                setIsGenerating(false);
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
              console.error('Problematic data:', dataContent);
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
        return progress.message || 'Starting unified embedding generation...';
      case 'phase':
        return progress.message || 'Processing...';
      case 'articles_total':
        return `Found ${progress.total} articles to process`;
      case 'articles_progress':
        return `Processing articles: ${progress.processed}/${progress.total} (${progress.progress}%)`;
      case 'documents_total':
        return `Found ${progress.total} RAG documents to process`;
      case 'documents_progress':
        return `Processing RAG documents: ${progress.processed}/${progress.total} (${progress.progress}%)`;
      case 'chunks_total':
        return `Found ${progress.total} document chunks to process`;
      case 'chunks_progress':
        return `Processing document chunks: ${progress.processed}/${progress.total} (${progress.progress}%)`;
      case 'complete':
        const totalProcessed = (progress.articles_processed || 0) + (progress.documents_processed || 0) + (progress.chunks_processed || 0);
        const totalErrors = (progress.articles_errors || 0) + (progress.documents_errors || 0) + (progress.chunks_errors || 0);
        const totalItems = (progress.articles_total || 0) + (progress.documents_total || 0) + (progress.chunks_total || 0);
        
        return `✅ ${progress.message} 
          Articles: ${progress.articles_processed}/${progress.articles_total}
          Documents: ${progress.documents_processed}/${progress.documents_total}
          Chunks: ${progress.chunks_processed}/${progress.chunks_total}
          Total: ${totalProcessed}/${totalItems} (${totalErrors} errors)`;
      case 'error':
        return `❌ Error: ${progress.error}`;
      default:
        return progress.message || '';
    }
  };

  const getOverallProgress = () => {
    if (!progress) return 0;
    
    if (progress.type === 'articles_progress' && progress.total) {
      return progress.progress || 0;
    }
    
    if (progress.type === 'documents_progress' && progress.total) {
      return progress.progress || 0;
    }
    
    if (progress.type === 'chunks_progress' && progress.total) {
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
          Generate All Embeddings
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Creates vector embeddings for articles, RAG documents, and document chunks to enable semantic search in the AI Chat. 
          This processes all content that doesn't have embeddings yet in three phases: articles → documents → chunks.
        </p>
        
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={generateEmbeddings}
            disabled={isGenerating}
            className={`px-6 py-3 rounded-md font-medium flex items-center ${
              isGenerating
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="flex space-x-1 mr-3">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                Generating Embeddings...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Generate All Embeddings
              </>
            )}
          </button>
        </div>

        {progress && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{getProgressMessage()}</span>
              <span>{getOverallProgress()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${getOverallProgress()}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Status Summary */}
      {progress && progress.type === 'complete' && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-green-800 mb-2">Embedding Generation Complete!</h4>
          <div className="text-sm text-green-700 space-y-1">
            <div>📰 Articles: {progress.articles_processed}/{progress.articles_total}</div>
            <div>📄 Documents: {progress.documents_processed}/{progress.documents_total}</div>
            <div>📝 Chunks: {progress.chunks_processed}/{progress.chunks_total}</div>
            <div className="font-medium pt-2">
              Total: {(progress.articles_processed || 0) + (progress.documents_processed || 0) + (progress.chunks_processed || 0)} embeddings generated
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedEmbeddingsInterface;
