import { useState, useEffect, useRef } from 'react';
import { Heart, AlertCircle, ExternalLink, Trash2, Plus, Edit2, Settings } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export default function Dashboard() {
  const { workflowName } = useParams();
  const navigate = useNavigate();
  const workflow = workflowName ? decodeURIComponent(workflowName) : null;
  const editFormRef = useRef(null);
  const [links, setLinks] = useState([]);
  const [filteredLinks, setFilteredLinks] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(null); // 'active', 'broken', or null
  const [sortBy, setSortBy] = useState('recentlyAdded');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showOnlyBroken, setShowOnlyBroken] = useState(false);
  const [allTags, setAllTags] = useState([]);
  const [isManagementMode] = useState(process.env.NODE_ENV === 'development');
  const [newLink, setNewLink] = useState({
    title: '',
    url: '',
    description: '',
    tags: [],
    workflows: [],
    isFavorite: false,
    status: 'active',
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editLink, setEditLink] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('tags'); // 'tags', 'workflows', or 'deleted'
  const [allWorkflows, setAllWorkflows] = useState(['Advising', 'Curriculum', 'Admin']);
  const [newTag, setNewTag] = useState('');
  const [newWorkflow, setNewWorkflow] = useState('');
  const [editingTag, setEditingTag] = useState(null);
  const [editingTagNew, setEditingTagNew] = useState('');
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [editingWorkflowNew, setEditingWorkflowNew] = useState('');
  const [deletedLink, setDeletedLink] = useState(null);
  const [undoTimer, setUndoTimer] = useState(null);
  const [recentlyDeleted, setRecentlyDeleted] = useState([]);
  const [draggedWorkflow, setDraggedWorkflow] = useState(null);
  const [dragOverWorkflow, setDragOverWorkflow] = useState(null);
  const [reorderMode, setReorderMode] = useState(false);

  // Load links from public/links.json
  useEffect(() => {
    const loadLinks = async () => {
      try {
        const basePath = import.meta.env.BASE_URL || '/';
        const response = await fetch(basePath + 'links.json');
        let data = await response.json();
        
        // Backward compatibility: convert workflow (string) to workflows (array)
        // Also ensure tags and workflows are always arrays
        data = data.map(link => ({
          ...link,
          tags: link.tags || [],
          workflows: link.workflows || (link.workflow ? [link.workflow] : [])
        }));
        
        setLinks(data);
        
        // Load tags from tags.json
        const tagsResponse = await fetch(basePath + 'tags.json');
        const tagsData = await tagsResponse.json();
        setAllTags(tagsData || []);
        
        // Load workflows from workflows.json
        const workflowsResponse = await fetch(basePath + 'workflows.json');
        const workflowsData = await workflowsResponse.json();
        setAllWorkflows(workflowsData || []);
        
        // Load recently deleted links
        const deletedResponse = await fetch(basePath + 'recently-deleted.json');
        const deletedData = await deletedResponse.json();
        setRecentlyDeleted(deletedData || []);
      } catch (error) {
        console.error('Error loading links:', error);
      }
    };
    loadLinks();
  }, []);

  // Filter and sort links
  useEffect(() => {
    let filtered = links;

    // Filter by workflow if in a specific workflow view
    if (workflow) {
      filtered = filtered.filter(link => 
        link.workflows && link.workflows.includes(workflow)
      );
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(link =>
        selectedTags.every(tag => link.tags.includes(tag))
      );
    }

    // Filter by selected status
    if (selectedStatus) {
      filtered = filtered.filter(link => link.status === selectedStatus);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(link =>
        link.title.toLowerCase().includes(searchTerm.toLowerCase().trim())
      );
    }

    // Filter by favorites
    if (showOnlyFavorites) {
      filtered = filtered.filter(link => link.isFavorite);
    }

    // Filter by broken status
    if (showOnlyBroken) {
      filtered = filtered.filter(link => link.status === 'broken');
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'recentlyAdded') {
        return (b.createdAt || 0) - (a.createdAt || 0);
      } else if (sortBy === 'recentlyModified') {
        return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0);
      }
      return 0;
    });

    setFilteredLinks(filtered);
  }, [links, selectedTags, selectedStatus, sortBy, workflow, searchTerm, showOnlyFavorites, showOnlyBroken]);

  // Toggle favorite
  const toggleFavorite = async (id) => {
    const updated = links.map(link =>
      link.id === id ? { ...link, isFavorite: !link.isFavorite } : link
    );
    setLinks(updated);
    await saveLinks(updated);
  };

  // Delete link (management mode only)
  const deleteLink = async (id) => {
    if (!isManagementMode) return;
    
    const linkToDelete = links.find(link => link.id === id);
    if (!linkToDelete) return;
    
    // Clear any existing undo timer
    if (undoTimer) {
      clearTimeout(undoTimer);
    }
    
    // Move to recently deleted
    const updated = links.filter(link => link.id !== id);
    const newDeletedLink = { ...linkToDelete, deletedAt: new Date().toISOString() };
    const updatedDeleted = [...recentlyDeleted, newDeletedLink];
    
    setLinks(updated);
    setRecentlyDeleted(updatedDeleted);
    setDeletedLink(linkToDelete);
    
    // Set timer to save changes after 5 seconds
    const timer = setTimeout(async () => {
      await saveLinks(updated);
      await saveDeletedLinks(updatedDeleted);
      setDeletedLink(null);
    }, 5000);
    
    setUndoTimer(timer);
  };
  
  // Undo delete (restore from toast)
  const undoDelete = () => {
    if (deletedLink && undoTimer) {
      clearTimeout(undoTimer);
      setLinks([...links, deletedLink]);
      setRecentlyDeleted(recentlyDeleted.filter(l => l.id !== deletedLink.id));
      setDeletedLink(null);
      setUndoTimer(null);
    }
  };
  
  // Restore from recently deleted
  const restoreLink = async (id) => {
    const linkToRestore = recentlyDeleted.find(link => link.id === id);
    if (!linkToRestore) return;
    
    const { deletedAt, ...link } = linkToRestore;
    const restoredLinks = [...links, link];
    const updatedDeleted = recentlyDeleted.filter(l => l.id !== id);
    
    setLinks(restoredLinks);
    setRecentlyDeleted(updatedDeleted);
    await saveLinks(restoredLinks);
    await saveDeletedLinks(updatedDeleted);
  };
  
  // Permanently delete from recently deleted
  const permanentlyDelete = async (id) => {
    if (!window.confirm('Permanently delete this link? This cannot be undone.')) return;
    const updatedDeleted = recentlyDeleted.filter(l => l.id !== id);
    setRecentlyDeleted(updatedDeleted);
    await saveDeletedLinks(updatedDeleted);
  };
  
  // Empty trash (delete all recently deleted)
  const emptyTrash = async () => {
    if (!window.confirm('Permanently delete all recently deleted links? This cannot be undone.')) return;
    setRecentlyDeleted([]);
    await saveDeletedLinks([]);
  };

  // Start editing a link
  const startEditLink = (link) => {
    setEditingId(link.id);
    setEditLink({ ...link });
    setShowAddForm(false);
    
    // Scroll to edit form after state update
    setTimeout(() => {
      editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Save edited link
  const saveEditLink = async () => {
    if (!isManagementMode || !editLink.title || !editLink.url) {
      alert('Please fill in title and URL');
      return;
    }

    const updated = links.map(link =>
      link.id === editingId ? { ...editLink, updatedAt: Date.now() } : link
    );
    setLinks(updated);
    await saveLinks(updated);
    
    setEditingId(null);
    setEditLink(null);
  };

  // Cancel editing
  const cancelEditLink = () => {
    setEditingId(null);
    setEditLink(null);
  };

  // Add new tag
  const addTag = async () => {
    if (!newTag.trim() || allTags.includes(newTag)) {
      alert('Tag already exists or is empty');
      return;
    }
    const updatedTags = [...allTags, newTag].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    setAllTags(updatedTags);
    await saveTags(updatedTags);
    setNewTag('');
  };

  // Edit tag (rename all occurrences)
  const saveEditTag = async () => {
    if (!editingTagNew.trim() || allTags.includes(editingTagNew)) {
      alert('Invalid tag name or already exists');
      return;
    }
    const updated = links.map(link => ({
      ...link,
      tags: link.tags.map(tag => tag === editingTag ? editingTagNew : tag),
    }));
    setLinks(updated);
    await saveLinks(updated);
    
    const updatedTags = allTags.map(tag => tag === editingTag ? editingTagNew : tag).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    setAllTags(updatedTags);
    await saveTags(updatedTags);
    setEditingTag(null);
    setEditingTagNew('');
  };

  // Delete tag (remove from all links)
  const deleteTag = async (tagToDelete) => {
    if (!window.confirm(`Delete tag "${tagToDelete}" from all links?`)) return;
    
    const updated = links.map(link => ({
      ...link,
      tags: link.tags.filter(tag => tag !== tagToDelete),
    }));
    setLinks(updated);
    await saveLinks(updated);
    
    const updatedTags = allTags.filter(tag => tag !== tagToDelete);
    setAllTags(updatedTags);
    await saveTags(updatedTags);
    setEditingTag(null);
    setEditingTagNew('');
  };

  // Add new workflow
  const addWorkflow = async () => {
    if (!newWorkflow.trim() || allWorkflows.includes(newWorkflow)) {
      alert('Workflow already exists or is empty');
      return;
    }
    const updatedWorkflows = [...allWorkflows, newWorkflow];
    setAllWorkflows(updatedWorkflows);
    await saveWorkflows(updatedWorkflows);
    setNewWorkflow('');
  };

  // Edit workflow (rename all occurrences)
  const saveEditWorkflow = async () => {
    if (!editingWorkflowNew.trim() || allWorkflows.includes(editingWorkflowNew)) {
      alert('Invalid workflow name or already exists');
      return;
    }
    const updated = links.map(link => ({
      ...link,
      workflows: (link.workflows || []).map(w => w === editingWorkflow ? editingWorkflowNew : w),
    }));
    setLinks(updated);
    await saveLinks(updated);
    
    const updatedWorkflows = allWorkflows.map(w => w === editingWorkflow ? editingWorkflowNew : w);
    setAllWorkflows(updatedWorkflows);
    await saveWorkflows(updatedWorkflows);
    setEditingWorkflow(null);
    setEditingWorkflowNew('');
  };

  // Delete workflow
  const deleteWorkflow = async (workflowToDelete) => {
    if (!window.confirm(`Delete workflow "${workflowToDelete}" from all links?`)) return;
    
    const updated = links.map(link => ({
      ...link,
      workflows: (link.workflows || []).filter(w => w !== workflowToDelete),
    }));
    setLinks(updated);
    await saveLinks(updated);
    
    const updatedWorkflows = allWorkflows.filter(w => w !== workflowToDelete);
    setAllWorkflows(updatedWorkflows);
    await saveWorkflows(updatedWorkflows);
    setEditingWorkflow(null);
    setEditingWorkflowNew('');
  };

  // Add new link (management mode only)
  const addLink = async () => {
    if (!isManagementMode || !newLink.title || !newLink.url) {
      alert('Please fill in title and URL');
      return;
    }

    const link = {
      id: Math.max(...links.map(l => l.id), 0) + 1,
      ...newLink,
      tags: (newLink.tags || []).length > 0 ? newLink.tags : ['uncategorized'],
      workflows: (newLink.workflows || []).length > 0 ? newLink.workflows : [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updated = [...links, link];
    setLinks(updated);
    await saveLinks(updated);
    
    // Reset form
    setNewLink({
      title: '',
      url: '',
      description: '',
      tags: [],
      workflows: [],
      isFavorite: false,
      status: 'active',
    });
    setShowAddForm(false);
  };

  // Save links to links.json via API
  const saveLinks = async (updatedLinks) => {
    try {
      const basePath = import.meta.env.BASE_URL || '/';
      const response = await fetch(basePath + 'api/save-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLinks),
      });

      if (!response.ok) {
        console.error('Failed to save links');
      }
    } catch (error) {
      console.error('Error saving links:', error);
    }
  };

  const saveDeletedLinks = async (deletedLinks) => {
    try {
      const basePath = import.meta.env.BASE_URL || '/';
      const response = await fetch(basePath + 'api/save-deleted-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deletedLinks),
      });

      if (!response.ok) {
        console.error('Failed to save deleted links');
      }
    } catch (error) {
      console.error('Error saving deleted links:', error);
    }
  };

  const saveTags = async (updatedTags) => {
    try {
      const basePath = import.meta.env.BASE_URL || '/';
      const response = await fetch(basePath + 'api/save-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTags),
      });

      if (!response.ok) {
        console.error('Failed to save tags');
      }
    } catch (error) {
      console.error('Error saving tags:', error);
    }
  };

  const saveWorkflows = async (updatedWorkflows) => {
    try {
      const basePath = import.meta.env.BASE_URL || '/';
      const response = await fetch(basePath + 'api/save-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedWorkflows),
      });

      if (!response.ok) {
        console.error('Failed to save workflows');
      }
    } catch (error) {
      console.error('Error saving workflows:', error);
    }
  };

  const handleTagToggle = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleTagInputChange = (tag, action) => {
    if (action === 'add') {
      setNewLink(prev => ({
        ...prev,
        tags: [...new Set([...(prev.tags || []), tag])],
      }));
    } else {
      setNewLink(prev => ({
        ...prev,
        tags: (prev.tags || []).filter(t => t !== tag),
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CityU Internal Links</h1>
              <p className="mt-1 text-sm text-gray-600">
                {workflow ? `${workflow} Dashboard` : 'Centralized Link Hub'} 
                {isManagementMode && <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Management Mode</span>}
              </p>
            </div>
            <div className="flex gap-2">
              {isManagementMode && (
                <>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition"
                    title="Manage tags and workflows"
                  >
                    <Settings size={20} />
                    Settings
                  </button>
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                  >
                    <Plus size={20} />
                    Add Link
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Workflows */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Workflows</h2>
            <button
              onClick={() => setReorderMode(!reorderMode)}
              className={clsx(
                'px-3 py-1 rounded-lg text-sm font-medium transition',
                reorderMode
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              )}
            >
              {reorderMode ? 'Done Reordering' : 'Reorder'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => !reorderMode && navigate('/')}
              className={clsx(
                'px-4 py-2 rounded-lg font-medium transition',
                reorderMode && 'cursor-default',
                workflow === null
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              )}
            >
              All Links
            </button>
            {allWorkflows.map(wf => (
              <button
                key={wf}
                draggable={reorderMode}
                onClick={() => !reorderMode && navigate(`/workflow/${encodeURIComponent(wf)}`)}  
                onDragStart={() => reorderMode && setDraggedWorkflow(wf)}
                onDragOver={(e) => {
                  if (reorderMode) {
                    e.preventDefault();
                    setDragOverWorkflow(wf);
                  }
                }}
                onDragLeave={() => setDragOverWorkflow(null)}
                onDrop={() => {
                  if (draggedWorkflow && draggedWorkflow !== wf) {
                    const newOrder = allWorkflows.filter(w => w !== draggedWorkflow);
                    const draggedIndex = allWorkflows.indexOf(draggedWorkflow);
                    const targetIndex = newOrder.indexOf(wf);
                    newOrder.splice(draggedIndex > allWorkflows.indexOf(wf) ? targetIndex : targetIndex + 1, 0, draggedWorkflow);
                    setAllWorkflows(newOrder);
                    saveWorkflows(newOrder);
                  }
                  setDraggedWorkflow(null);
                  setDragOverWorkflow(null);
                }}
                className={clsx(
                  'px-4 py-2 rounded-lg font-medium transition',
                  reorderMode && 'cursor-grab active:cursor-grabbing',
                  !reorderMode && 'cursor-pointer',
                  draggedWorkflow === wf && 'opacity-50',
                  dragOverWorkflow === wf && 'ring-2 ring-indigo-400 ring-offset-2',
                  workflow === wf
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                )}
              >
                {wf}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && isManagementMode && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8 border-2 border-purple-500">
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => {
                  if (settingsTab === 'tags' && showSettings) {
                    setShowSettings(false);
                    setEditingTag(null);
                    setEditingTagNew('');
                  } else {
                    setSettingsTab('tags');
                    setEditingTag(null);
                    setEditingTagNew('');
                  }
                }}
                className={clsx(
                  'px-4 py-2 rounded-lg font-medium transition',
                  settingsTab === 'tags' && showSettings
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                )}
              >
                Manage Tags
              </button>
              <button
                onClick={() => {
                  if (settingsTab === 'workflows' && showSettings) {
                    setShowSettings(false);
                    setEditingWorkflow(null);
                    setEditingWorkflowNew('');
                  } else {
                    setSettingsTab('workflows');
                    setEditingWorkflow(null);
                    setEditingWorkflowNew('');
                  }
                }}
                className={clsx(
                  'px-4 py-2 rounded-lg font-medium transition',
                  settingsTab === 'workflows' && showSettings
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                )}
              >
                Manage Workflows
              </button>
              <button
                onClick={() => {
                  if (settingsTab === 'deleted' && showSettings) {
                    setShowSettings(false);
                  } else {
                    setSettingsTab('deleted');
                  }
                }}
                className={clsx(
                  'px-4 py-2 rounded-lg font-medium transition',
                  settingsTab === 'deleted' && showSettings
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                )}
              >
                Recently Deleted ({recentlyDeleted.length})
              </button>
            </div>

            {/* Tags Management */}
            {settingsTab === 'tags' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Tags</h3>
                
                {/* Add Tag */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add New Tag</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Tag name"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={addTag}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* List Tags */}
                <div className="space-y-2">
                  {allTags.map(tag => (
                    <div key={tag} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      {editingTag === tag ? (
                        <input
                          type="text"
                          value={editingTagNew}
                          onChange={(e) => setEditingTagNew(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      ) : (
                        <span className="px-3 py-2 bg-blue-100 text-blue-800 rounded">{tag}</span>
                      )}
                      <div className="flex gap-2">
                        {editingTag === tag ? (
                          <>
                            <button
                              onClick={saveEditTag}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingTag(null)}
                              className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded transition text-sm"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingTag(tag);
                                setEditingTagNew(tag);
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteTag(tag)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition text-sm"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Workflows Management */}
            {settingsTab === 'workflows' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Workflows</h3>
                
                {/* Add Workflow */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add New Workflow</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Workflow name"
                      value={newWorkflow}
                      onChange={(e) => setNewWorkflow(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addWorkflow()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={addWorkflow}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* List Workflows */}
                <div className="space-y-2">
                  {allWorkflows.map(wf => (
                    <div key={wf} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      {editingWorkflow === wf ? (
                        <input
                          type="text"
                          value={editingWorkflowNew}
                          onChange={(e) => setEditingWorkflowNew(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      ) : (
                        <span className="px-3 py-2 bg-purple-100 text-purple-800 rounded">{wf}</span>
                      )}
                      <div className="flex gap-2">
                        {editingWorkflow === wf ? (
                          <>
                            <button
                              onClick={saveEditWorkflow}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingWorkflow(null)}
                              className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded transition text-sm"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingWorkflow(wf);
                                setEditingWorkflowNew(wf);
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteWorkflow(wf)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition text-sm"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recently Deleted */}
            {settingsTab === 'deleted' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Recently Deleted Links</h3>
                  {recentlyDeleted.length > 0 && (
                    <button
                      onClick={emptyTrash}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition text-sm"
                    >
                      Empty Trash
                    </button>
                  )}
                </div>
                
                {recentlyDeleted.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No recently deleted links</p>
                ) : (
                  <div className="space-y-3">
                    {recentlyDeleted.map(link => (
                      <div key={link.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{link.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{link.description}</p>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {(link.tags || []).map(tag => (
                                <span key={tag} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <p className="text-xs text-gray-400">
                              Deleted {new Date(link.deletedAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => restoreLink(link.id)}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition text-sm whitespace-nowrap"
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => permanentlyDelete(link.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition text-sm whitespace-nowrap"
                            >
                              Delete Forever
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {/* Edit Link Form */}
        {editingId && editLink && isManagementMode && (
          <div ref={editFormRef} className="bg-white p-6 rounded-lg shadow-md mb-8 border-2 border-blue-500">
            <h2 className="text-xl font-semibold mb-4">Edit Link</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Title"
                value={editLink.title}
                onChange={(e) => setEditLink({...editLink, title: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="url"
                placeholder="URL"
                value={editLink.url}
                onChange={(e) => setEditLink({...editLink, url: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Description"
                value={editLink.description}
                onChange={(e) => setEditLink({...editLink, description: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
                rows="2"
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Workflows</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {allWorkflows.map(wf => (
                    <button
                      key={wf}
                      onClick={() => {
                        if ((editLink.workflows || []).includes(wf)) {
                          setEditLink({...editLink, workflows: editLink.workflows.filter(w => w !== wf)});
                        } else {
                          setEditLink({...editLink, workflows: [...(editLink.workflows || []), wf]});
                        }
                      }}
                      className={clsx(
                        'px-3 py-1 rounded-full text-sm transition',
                        (editLink.workflows || []).includes(wf)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      )}
                    >
                      {wf}
                    </button>
                  ))}
                </div>
              </div>
              <select
                value={editLink.status}
                onChange={(e) => setEditLink({...editLink, status: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="broken">Broken</option>
              </select>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        const tags = editLink.tags || [];
                        if (tags.includes(tag)) {
                          setEditLink({...editLink, tags: tags.filter(t => t !== tag)});
                        } else {
                          setEditLink({...editLink, tags: [...tags, tag]});
                        }
                      }}
                      className={clsx(
                        'px-3 py-1 rounded-full text-sm transition',
                        (editLink.tags || []).includes(tag)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 flex gap-2">
                <button
                  onClick={saveEditLink}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                >
                  Save Changes
                </button>
                <button
                  onClick={cancelEditLink}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Link Form */}
        {showAddForm && !editingId && isManagementMode && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Add New Link</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Title"
                value={newLink.title}
                onChange={(e) => setNewLink({...newLink, title: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="url"
                placeholder="URL"
                value={newLink.url}
                onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Description"
                value={newLink.description}
                onChange={(e) => setNewLink({...newLink, description: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
                rows="2"
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Workflows</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {allWorkflows.map(wf => (
                    <button
                      key={wf}
                      onClick={() => {
                        const workflows = newLink.workflows || [];
                        if (workflows.includes(wf)) {
                          setNewLink({...newLink, workflows: workflows.filter(w => w !== wf)});
                        } else {
                          setNewLink({...newLink, workflows: [...workflows, wf]});
                        }
                      }}
                      className={clsx(
                        'px-3 py-1 rounded-full text-sm transition',
                        (newLink.workflows || []).includes(wf)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      )}
                    >
                      {wf}
                    </button>
                  ))}
                </div>
              </div>
              <select
                value={newLink.status}
                onChange={(e) => setNewLink({...newLink, status: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="broken">Broken</option>
              </select>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleTagInputChange(tag, (newLink.tags || []).includes(tag) ? 'remove' : 'add')}
                      className={clsx(
                        'px-3 py-1 rounded-full text-sm transition',
                        (newLink.tags || []).includes(tag)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={addLink}
                className="md:col-span-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
              >
                Save Link
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Sort Controls */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'title', label: 'Title' },
                  { value: 'recentlyAdded', label: 'Recently Added' },
                  { value: 'recentlyModified', label: 'Recently Modified' },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={clsx(
                      'px-4 py-2 rounded-lg transition text-sm font-medium',
                      sortBy === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Favorites Toggle */}
            <button
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              title={showOnlyFavorites ? 'Show all links' : 'Show only favorite links'}
              className={clsx(
                'px-4 py-2 rounded-lg transition text-sm font-medium',
                showOnlyFavorites
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {showOnlyFavorites ? '★ Favorites Only' : '☆ Show All'}
            </button>

            {/* Tag Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => setSelectedTags([])}
                className={clsx(
                  'px-3 py-1 rounded-full text-sm font-medium transition',
                  selectedTags.length === 0
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                )}
              >
                All Tags
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={clsx(
                    'px-3 py-1 rounded-full text-sm font-medium transition flex items-center gap-1 group',
                    selectedTags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  )}
                >
                  {tag}
                  {selectedTags.includes(tag) && (
                    <span className="text-xs opacity-70 group-hover:opacity-100">×</span>
                  )}
                </button>
              ))}
            </div>

            {/* Broken Status Toggle */}
            <button
              onClick={() => setShowOnlyBroken(!showOnlyBroken)}
              title={showOnlyBroken ? 'Show all links' : 'Show only broken links'}
              className={clsx(
                'px-4 py-2 rounded-lg transition text-sm font-medium',
                showOnlyBroken
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {showOnlyBroken ? '⚠ Broken Only' : '✓ Show All'}
            </button>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLinks.length > 0 ? (
            filteredLinks.map(link => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={clsx(
                  'group bg-white rounded-lg shadow-md hover:shadow-lg transition p-6 flex flex-col',
                  link.status === 'broken' && 'border-l-4 border-red-500'
                )}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition flex-1">
                    {link.title}
                  </h3>
                  <div className="flex items-center gap-2 ml-2">
                    {link.status === 'broken' && (
                      <AlertCircle size={18} className="text-red-500" title="Broken link" />
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite(link.id);
                      }}
                      className="focus:outline-none transition"
                    >
                      <Heart
                        size={20}
                        className={clsx(
                          'transition',
                          link.isFavorite
                            ? 'fill-red-500 text-red-500'
                            : 'text-gray-400 hover:text-red-500'
                        )}
                      />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 flex-1">
                  {link.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {(link.tags || []).map(tag => (
                    <span
                      key={tag}
                      className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {(link.workflows || []).map(wf => (
                    <span
                      key={wf}
                      className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded font-medium"
                    >
                      {wf}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <ExternalLink size={14} className="text-gray-400" />
                    {isManagementMode && (
                      <>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            startEditLink(link);
                          }}
                          className="text-blue-500 hover:text-blue-700 transition"
                          title="Edit link"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            deleteLink(link.id);
                          }}
                          className="text-red-500 hover:text-red-700 transition"
                          title="Delete link"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </a>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">
                {selectedTags.length > 0 ? 'No links match your filters' : 'No links available'}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Undo Delete Toast */}
      {deletedLink && (
        <div className="fixed bottom-8 right-8 bg-gray-900 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-4 z-50 animate-slide-up">
          <span>
            Deleted "{deletedLink.title}"
          </span>
          <button
            onClick={undoDelete}
            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded font-medium transition"
          >
            Undo
          </button>
          <button
            onClick={() => {
              if (undoTimer) clearTimeout(undoTimer);
              setDeletedLink(null);
              setUndoTimer(null);
            }}
            className="text-gray-400 hover:text-white transition"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
