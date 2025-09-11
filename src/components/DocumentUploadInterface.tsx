import React, { useState } from 'react';

interface DocumentUploadInterfaceProps {
  backendUrl: string;
}

interface DocumentFormData {
  title: string;
  content: string;
  fileType: string;
  accessLevel: string;
  file: File | null;
  metadata: {
    author?: string;
    date?: string;
    source?: string;
    notes?: string;
  };
}

const DocumentUploadInterface: React.FC<DocumentUploadInterfaceProps> = ({ backendUrl }) => {
  const [formData, setFormData] = useState<DocumentFormData>({
    title: '',
    content: '',
    fileType: 'manual',
    accessLevel: 'admin',
    file: null,
    metadata: {}
  });
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('metadata.')) {
      const metadataKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          [metadataKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      file: file,
      fileType: file ? getFileType(file.name) : 'manual'
    }));
    
    // Auto-fill title from filename if no title is set
    if (file && !formData.title) {
      const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      setFormData(prev => ({
        ...prev,
        title: fileName
      }));
    }
  };

  const getFileType = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'pdf';
      case 'docx': return 'docx';
      case 'doc': return 'doc';
      case 'txt': return 'txt';
      default: return 'unknown';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate based on upload type
    if (formData.file) {
      // File upload - only title required
      if (!formData.title.trim()) {
        setMessage({ type: 'error', text: 'Title is required for file uploads.' });
        return;
      }
    } else {
      // Manual entry - both title and content required
      if (!formData.title.trim() || !formData.content.trim()) {
        setMessage({ type: 'error', text: 'Title and content are required for manual entry.' });
        return;
      }
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const formDataToSend = new FormData();
      
      // Add file if present
      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }
      
      // Add other form data
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('content', formData.content.trim());
      formDataToSend.append('fileType', formData.fileType);
      formDataToSend.append('accessLevel', formData.accessLevel);
      formDataToSend.append('metadata', JSON.stringify(formData.metadata));
      formDataToSend.append('uploadedBy', 'admin@microplasticspulse.com');

      const response = await fetch(`${backendUrl}/api/admin/rag-documents/upload`, {
        method: 'POST',
        body: formDataToSend, // FormData automatically sets Content-Type with boundary
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload document');
      }

      setMessage({ 
        type: 'success', 
        text: formData.file 
          ? `Document uploaded and processed successfully! (${data.document.wordCount} words, ${data.document.chunkCount} chunks)`
          : 'Document saved successfully!'
      });
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        fileType: 'manual',
        accessLevel: 'admin',
        file: null,
        metadata: {}
      });

    } catch (error) {
      console.error('Error uploading document:', error);
      setMessage({ 
        type: 'error', 
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload RAG Document</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload */}
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
            Upload Document (Optional)
          </label>
          <input
            type="file"
            id="file"
            name="file"
            onChange={handleFileChange}
            accept=".pdf,.docx,.doc,.txt"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">
            Supported formats: PDF, Word (.docx, .doc), Text (.txt). Max size: 10MB
          </p>
          {formData.file && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                <strong>Selected:</strong> {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Document Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter document title..."
            required
          />
        </div>

        {/* Content - Only show for manual entry */}
        {!formData.file && (
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Document Content *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows={12}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Paste or type the document content here..."
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Character count: {formData.content.length}
            </p>
          </div>
        )}

        {/* File Type */}
        <div>
          <label htmlFor="fileType" className="block text-sm font-medium text-gray-700 mb-2">
            File Type
          </label>
          <select
            id="fileType"
            name="fileType"
            value={formData.fileType}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="manual">Manual Entry</option>
            <option value="pdf">PDF Document</option>
            <option value="docx">Word Document</option>
            <option value="txt">Text File</option>
            <option value="url">Web URL</option>
          </select>
        </div>

        {/* Access Level */}
        <div>
          <label htmlFor="accessLevel" className="block text-sm font-medium text-gray-700 mb-2">
            Access Level
          </label>
          <select
            id="accessLevel"
            name="accessLevel"
            value={formData.accessLevel}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="admin">Admin Only</option>
            <option value="public">Public (Research Library)</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            {formData.accessLevel === 'public' && 'This document will be visible to all users in the Research Library.'}
            {formData.accessLevel === 'admin' && 'This document will only be accessible to admins and in AI Chat.'}
          </p>
        </div>

        {/* Metadata */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Document Metadata (Optional)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="metadata.author" className="block text-sm font-medium text-gray-700 mb-2">
                Author
              </label>
              <input
                type="text"
                id="metadata.author"
                name="metadata.author"
                value={formData.metadata.author || ''}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Document author..."
              />
            </div>

            <div>
              <label htmlFor="metadata.date" className="block text-sm font-medium text-gray-700 mb-2">
                Publication Date
              </label>
              <input
                type="date"
                id="metadata.date"
                name="metadata.date"
                value={formData.metadata.date || ''}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="metadata.source" className="block text-sm font-medium text-gray-700 mb-2">
                Source
              </label>
              <input
                type="text"
                id="metadata.source"
                name="metadata.source"
                value={formData.metadata.source || ''}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Source organization or website..."
              />
            </div>

            <div>
              <label htmlFor="metadata.notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <input
                type="text"
                id="metadata.notes"
                name="metadata.notes"
                value={formData.metadata.notes || ''}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional notes..."
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isUploading || !formData.title.trim() || !formData.content.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      </form>

      {/* Message Display */}
      {message && (
        <div className={`mt-4 p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-100 border border-green-300 text-green-800' 
            : 'bg-red-100 border border-red-300 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-gray-50 rounded-md">
        <h3 className="text-lg font-medium text-gray-800 mb-2">Instructions</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>File Upload:</strong> Upload PDF, Word, or text files (max 10MB)</li>
          <li>• <strong>Manual Entry:</strong> Or paste content directly into the text area</li>
          <li>• <strong>Title:</strong> A clear, descriptive title for the document</li>
          <li>• <strong>Access Level:</strong> Choose who can see this document</li>
          <li>• <strong>Metadata:</strong> Optional information about the document</li>
          <li>• <strong>Processing:</strong> Files are automatically processed and chunked</li>
          <li>• After uploading, generate embeddings to enable semantic search</li>
        </ul>
      </div>
    </div>
  );
};

export default DocumentUploadInterface;
