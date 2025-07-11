import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Save, FolderOpen, Copy, Scissors, Clipboard, Undo, Redo, Type, Image, Search, Heart, Tag, Upload, X, FileText, Download } from 'lucide-react';

interface MemeTemplate {
  id: string;
  name: string;
  url: string;
  dateAdded: Date;
  tags: string[];
  isFavorite: boolean;
  category: string;
}

interface Document {
  id: string;
  name: string;
  content: string;
  lastModified: Date;
}

const TextEditor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'editor' | 'templates'>('editor');
  const [editorContent, setEditorContent] = useState('');
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [recentFiles, setRecentFiles] = useState<Document[]>([]);
  const [memeTemplates, setMemeTemplates] = useState<MemeTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isFormatting, setIsFormatting] = useState({
    bold: false,
    italic: false,
    underline: false
  });
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [showRecentFiles, setShowRecentFiles] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveEnabled && editorContent && currentDocument) {
      const timer = setTimeout(() => {
        saveDocument();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [editorContent, autoSaveEnabled, currentDocument]);

  // Load saved data on component mount
  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = () => {
    try {
      const savedTemplates = localStorage.getItem('memeTemplates');
      const savedDocuments = localStorage.getItem('recentDocuments');
      
      if (savedTemplates) {
        const templates = JSON.parse(savedTemplates).map((t: any) => ({
          ...t,
          dateAdded: new Date(t.dateAdded)
        }));
        setMemeTemplates(templates);
      }
      
      if (savedDocuments) {
        const documents = JSON.parse(savedDocuments).map((d: any) => ({
          ...d,
          lastModified: new Date(d.lastModified)
        }));
        setRecentFiles(documents);
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  const saveToLocalStorage = () => {
    try {
      localStorage.setItem('memeTemplates', JSON.stringify(memeTemplates));
      localStorage.setItem('recentDocuments', JSON.stringify(recentFiles));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  useEffect(() => {
    saveToLocalStorage();
  }, [memeTemplates, recentFiles]);

  // Text formatting functions
  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    updateFormattingState();
  };

  const updateFormattingState = () => {
    setIsFormatting({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline')
    });
  };

  const handleTextAlign = (alignment: 'left' | 'center' | 'right') => {
    const alignCommand = alignment === 'left' ? 'justifyLeft' : 
                        alignment === 'center' ? 'justifyCenter' : 'justifyRight';
    applyFormat(alignCommand);
    setTextAlign(alignment);
  };

  // File operations
  const newDocument = () => {
    setCurrentDocument({
      id: Date.now().toString(),
      name: 'Untitled Document',
      content: '',
      lastModified: new Date()
    });
    setEditorContent('');
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
  };

  const saveDocument = () => {
    if (!currentDocument) return;
    
    const content = editorRef.current?.innerHTML || '';
    const updatedDoc = {
      ...currentDocument,
      content,
      lastModified: new Date()
    };
    
    setCurrentDocument(updatedDoc);
    
    // Update recent files
    const updatedRecentFiles = [
      updatedDoc,
      ...recentFiles.filter(f => f.id !== updatedDoc.id)
    ].slice(0, 10);
    
    setRecentFiles(updatedRecentFiles);
    
    // Show save confirmation
    showNotification('Document saved successfully!');
  };

  const saveAsFile = (format: 'txt' | 'html') => {
    if (!currentDocument) return;
    
    const content = format === 'txt' ? 
      editorRef.current?.innerText || '' : 
      editorRef.current?.innerHTML || '';
    
    const blob = new Blob([content], { 
      type: format === 'txt' ? 'text/plain' : 'text/html' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDocument.name}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification(`Document exported as ${format.toUpperCase()}!`);
  };

  const openDocument = (doc: Document) => {
    setCurrentDocument(doc);
    setEditorContent(doc.content);
    if (editorRef.current) {
      editorRef.current.innerHTML = doc.content;
    }
    setShowRecentFiles(false);
  };

  // Meme template functions
  const handleTemplateUpload = (files: FileList) => {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const template: MemeTemplate = {
            id: Date.now().toString() + Math.random(),
            name: file.name.replace(/\.[^/.]+$/, ''),
            url: e.target?.result as string,
            dateAdded: new Date(),
            tags: [],
            isFavorite: false,
            category: 'imported'
          };
          setMemeTemplates(prev => [template, ...prev]);
          showNotification(`Template "${template.name}" added successfully!`);
        };
        reader.readAsDataURL(file);
      } else {
        showNotification(`Invalid file type: ${file.name}`, 'error');
      }
    });
  };

  const toggleTemplateFavorite = (templateId: string) => {
    setMemeTemplates(prev => 
      prev.map(t => 
        t.id === templateId ? { ...t, isFavorite: !t.isFavorite } : t
      )
    );
  };

  const deleteTemplate = (templateId: string) => {
    setMemeTemplates(prev => prev.filter(t => t.id !== templateId));
    showNotification('Template deleted successfully!');
  };

  const addTagToTemplate = (templateId: string, tag: string) => {
    if (!tag.trim()) return;
    
    setMemeTemplates(prev => 
      prev.map(t => 
        t.id === templateId ? 
        { ...t, tags: [...new Set([...t.tags, tag.trim().toLowerCase()])] } : t
      )
    );
  };

  // Filter templates
  const filteredTemplates = memeTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesFavorites = !showFavoritesOnly || template.isFavorite;
    
    return matchesSearch && matchesCategory && matchesFavorites;
  });

  const categories = ['all', ...new Set(memeTemplates.map(t => t.category))];

  // Drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleTemplateUpload(files);
    }
  };

  // Clipboard operations
  const handleCopy = () => {
    applyFormat('copy');
    showNotification('Text copied to clipboard!');
  };

  const handleCut = () => {
    applyFormat('cut');
    showNotification('Text cut to clipboard!');
  };

  const handlePaste = () => {
    applyFormat('paste');
    showNotification('Text pasted from clipboard!');
  };

  // Notification system
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-300 windows98-text">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 p-3 rounded border-2 z-50 ${
          notification.type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="windows98-titlebar px-2 py-1 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText size={16} />
          <span className="text-sm font-bold">MS Write++ - {currentDocument?.name || 'New Document'}</span>
        </div>
        <div className="flex space-x-1">
          <button className="w-4 h-4 windows98-button text-xs">_</button>
          <button className="w-4 h-4 windows98-button text-xs">□</button>
          <button className="w-4 h-4 windows98-button text-xs">×</button>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="bg-gray-200 border-b border-gray-400 px-2 py-1">
        <div className="flex space-x-4 text-sm">
          <span className="windows98-menu-item">File</span>
          <span className="windows98-menu-item">Edit</span>
          <span className="windows98-menu-item">Format</span>
          <span className="windows98-menu-item">Insert</span>
          <span className="windows98-menu-item">Tools</span>
          <span className="windows98-menu-item">Help</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-gray-200 border-b border-gray-400 p-2">
        <div className="flex items-center space-x-1 flex-wrap">
          {/* File Operations */}
          <button onClick={newDocument} className="windows98-button p-1" title="New Document">
            <FileText size={16} />
          </button>
          <button 
            onClick={() => setShowRecentFiles(!showRecentFiles)} 
            className="windows98-button p-1" 
            title="Open Recent"
          >
            <FolderOpen size={16} />
          </button>
          <button onClick={saveDocument} className="windows98-button p-1" title="Save">
            <Save size={16} />
          </button>
          
          <div className="w-px h-6 bg-gray-400 mx-1"></div>
          
          {/* Clipboard Operations */}
          <button onClick={handleCopy} className="windows98-button p-1" title="Copy">
            <Copy size={16} />
          </button>
          <button onClick={handleCut} className="windows98-button p-1" title="Cut">
            <Scissors size={16} />
          </button>
          <button onClick={handlePaste} className="windows98-button p-1" title="Paste">
            <Clipboard size={16} />
          </button>
          
          <div className="w-px h-6 bg-gray-400 mx-1"></div>
          
          {/* Undo/Redo */}
          <button onClick={() => applyFormat('undo')} className="windows98-button p-1" title="Undo">
            <Undo size={16} />
          </button>
          <button onClick={() => applyFormat('redo')} className="windows98-button p-1" title="Redo">
            <Redo size={16} />
          </button>
          
          <div className="w-px h-6 bg-gray-400 mx-1"></div>
          
          {/* Text Formatting */}
          <button 
            onClick={() => applyFormat('bold')} 
            className={`windows98-button p-1 ${isFormatting.bold ? 'pressed' : ''}`}
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button 
            onClick={() => applyFormat('italic')} 
            className={`windows98-button p-1 ${isFormatting.italic ? 'pressed' : ''}`}
            title="Italic"
          >
            <Italic size={16} />
          </button>
          <button 
            onClick={() => applyFormat('underline')} 
            className={`windows98-button p-1 ${isFormatting.underline ? 'pressed' : ''}`}
            title="Underline"
          >
            <Underline size={16} />
          </button>
          
          <div className="w-px h-6 bg-gray-400 mx-1"></div>
          
          {/* Text Alignment */}
          <button 
            onClick={() => handleTextAlign('left')} 
            className={`windows98-button p-1 ${textAlign === 'left' ? 'pressed' : ''}`}
            title="Align Left"
          >
            <AlignLeft size={16} />
          </button>
          <button 
            onClick={() => handleTextAlign('center')} 
            className={`windows98-button p-1 ${textAlign === 'center' ? 'pressed' : ''}`}
            title="Align Center"
          >
            <AlignCenter size={16} />
          </button>
          <button 
            onClick={() => handleTextAlign('right')} 
            className={`windows98-button p-1 ${textAlign === 'right' ? 'pressed' : ''}`}
            title="Align Right"
          >
            <AlignRight size={16} />
          </button>
          
          <div className="w-px h-6 bg-gray-400 mx-1"></div>
          
          {/* Export Options */}
          <button onClick={() => saveAsFile('txt')} className="windows98-button p-1" title="Export as TXT">
            <Download size={16} />
          </button>
          <button onClick={() => saveAsFile('html')} className="windows98-button p-1" title="Export as HTML">
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-200 border-b border-gray-400">
        <div className="flex">
          <button 
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2 border-r border-gray-400 ${
              activeTab === 'editor' ? 'bg-white border-b-white' : 'bg-gray-200'
            }`}
          >
            <Type size={16} className="inline mr-2" />
            Text Editor
          </button>
          <button 
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 border-r border-gray-400 ${
              activeTab === 'templates' ? 'bg-white border-b-white' : 'bg-gray-200'
            }`}
          >
            <Image size={16} className="inline mr-2" />
            Meme Templates
          </button>
        </div>
      </div>

      {/* Recent Files Dropdown */}
      {showRecentFiles && (
        <div className="absolute top-20 left-2 bg-white border-2 border-gray-400 shadow-lg z-10 min-w-64">
          <div className="p-2 bg-gray-200 border-b border-gray-400 font-bold text-sm">Recent Files</div>
          {recentFiles.length === 0 ? (
            <div className="p-4 text-gray-600 text-sm">No recent files</div>
          ) : (
            recentFiles.map(doc => (
              <button
                key={doc.id}
                onClick={() => openDocument(doc)}
                className="w-full text-left p-2 hover:bg-blue-100 border-b border-gray-200 text-sm"
              >
                <div className="font-medium">{doc.name}</div>
                <div className="text-xs text-gray-600">
                  {doc.lastModified.toLocaleDateString()} {doc.lastModified.toLocaleTimeString()}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'editor' ? (
          /* Text Editor */
          <div className="flex-1 p-4 overflow-auto">
            <div className="bg-white border-2 border-gray-400 min-h-full">
              <div
                ref={editorRef}
                contentEditable
                className="p-4 min-h-96 outline-none text-black"
                style={{ 
                  fontFamily: 'Times New Roman, serif',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  textAlign: textAlign
                }}
                onInput={(e) => {
                  setEditorContent(e.currentTarget.innerHTML);
                  updateFormattingState();
                }}
                onKeyUp={updateFormattingState}
                onMouseUp={updateFormattingState}
                placeholder="Start typing your document..."
              />
            </div>
          </div>
        ) : (
          /* Meme Templates */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Template Controls */}
            <div className="p-4 bg-gray-200 border-b border-gray-400">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="windows98-input px-2 py-1 w-48"
                  />
                </div>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="windows98-input px-2 py-1"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`windows98-button px-3 py-1 ${showFavoritesOnly ? 'pressed' : ''}`}
                >
                  <Heart size={16} className="inline mr-1" />
                  Favorites
                </button>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="windows98-button px-3 py-1"
                >
                  <Upload size={16} className="inline mr-1" />
                  Upload Templates
                </button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && handleTemplateUpload(e.target.files)}
                className="hidden"
              />
            </div>

            {/* Template Gallery */}
            <div 
              className={`flex-1 p-4 overflow-auto ${dragOver ? 'bg-blue-100' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {dragOver && (
                <div className="border-2 border-dashed border-blue-400 rounded-lg p-8 text-center text-blue-600 mb-4">
                  <Upload size={48} className="mx-auto mb-2" />
                  <p>Drop image files here to add them as meme templates</p>
                </div>
              )}
              
              {filteredTemplates.length === 0 ? (
                <div className="text-center text-gray-600 mt-8">
                  <Image size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No meme templates found</p>
                  <p className="text-sm">Upload some images to get started!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredTemplates.map(template => (
                    <div key={template.id} className="bg-white border-2 border-gray-400 p-2">
                      <div className="relative">
                        <img
                          src={template.url}
                          alt={template.name}
                          className="w-full h-32 object-cover border border-gray-300"
                        />
                        <button
                          onClick={() => toggleTemplateFavorite(template.id)}
                          className={`absolute top-1 right-1 p-1 rounded ${
                            template.isFavorite ? 'bg-red-500 text-white' : 'bg-white text-gray-600'
                          }`}
                        >
                          <Heart size={12} />
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="absolute top-1 left-1 p-1 bg-red-500 text-white rounded"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-sm font-medium truncate" title={template.name}>
                          {template.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {template.dateAdded.toLocaleDateString()}
                        </p>
                        
                        <div className="flex flex-wrap gap-1 mt-1">
                          {template.tags.map(tag => (
                            <span key={tag} className="text-xs bg-blue-100 px-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        <div className="mt-2">
                          <input
                            type="text"
                            placeholder="Add tag..."
                            className="text-xs w-full border border-gray-300 px-1 py-0.5"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addTagToTemplate(template.id, e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-gray-200 border-t border-gray-400 px-2 py-1 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-4">
          <div className="windows98-statusbar-panel">
            {activeTab === 'editor' ? 'Text Editor' : 'Meme Templates'}
          </div>
          {activeTab === 'editor' && (
            <>
              <div className="windows98-statusbar-panel">
                Characters: {editorRef.current?.innerText?.length || 0}
              </div>
              <div className="windows98-statusbar-panel">
                Auto-save: {autoSaveEnabled ? 'ON' : 'OFF'}
              </div>
            </>
          )}
          {activeTab === 'templates' && (
            <div className="windows98-statusbar-panel">
              Templates: {filteredTemplates.length} / {memeTemplates.length}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {activeTab === 'editor' && (
            <button
              onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
              className={`windows98-button px-2 py-1 ${autoSaveEnabled ? 'pressed' : ''}`}
            >
              Auto-save
            </button>
          )}
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextEditor;