import React, { useState } from 'react';
import { 
  Anchor, 
  X, 
  Plus, 
  Search, 
  Pin, 
  Trash2, 
  Edit3, 
  Check, 
  Copy, 
  Download, 
  Upload, 
  Sparkles, 
  BookOpen, 
  Layers, 
  Cpu, 
  Code, 
  Palette, 
  ShieldCheck, 
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ContextualAnchor } from '../types';
import { DEFAULT_ANCHORS } from '../lib/anchors';

interface ContextualAnchorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  anchors: ContextualAnchor[];
  onSaveAnchors: (updated: ContextualAnchor[]) => void;
  onSendToChat?: (prompt: string) => void;
}

const CATEGORY_META = {
  architecture: { label: 'Architecture', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: Layers },
  styleguide: { label: 'Style Guide', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: Palette },
  technical_doc: { label: 'Tech Doc', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: Code },
  system_rule: { label: 'System Rule', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: ShieldCheck },
  custom: { label: 'Custom Memory', color: 'bg-neutral-800 text-neutral-300 border-neutral-700', icon: BookOpen },
};

export function ContextualAnchorsModal({
  isOpen,
  onClose,
  anchors,
  onSaveAnchors,
  onSendToChat,
}: ContextualAnchorsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editingAnchor, setEditingAnchor] = useState<Partial<ContextualAnchor> | null>(null);
  const [keywordInput, setKeywordInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 3000);
  };

  const handleToggleAnchor = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = anchors.map((a) => (a.id === id ? { ...a, isEnabled: !a.isEnabled } : a));
    onSaveAnchors(updated);
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = anchors.map((a) => (a.id === id ? { ...a, isPinned: !a.isPinned } : a));
    onSaveAnchors(updated);
  };

  const handleDeleteAnchor = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = anchors.filter((a) => a.id !== id);
    onSaveAnchors(updated);
    showNotification('Anchor removed from vault');
  };

  const handleCopyContent = async (anchor: ContextualAnchor, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(anchor.content);
      setCopiedId(anchor.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleOpenCreate = () => {
    setEditingAnchor({
      title: '',
      category: 'technical_doc',
      keywords: [],
      content: '',
      isEnabled: true,
      isPinned: false,
    });
    setKeywordInput('');
    setIsEditing(true);
  };

  const handleOpenEdit = (anchor: ContextualAnchor, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAnchor({ ...anchor });
    setKeywordInput(anchor.keywords.join(', '));
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnchor || !editingAnchor.title?.trim() || !editingAnchor.content?.trim()) {
      showNotification('Please provide a title and content for this anchor.');
      return;
    }

    // Process keywords
    const parsedKeywords = keywordInput
      .split(/[,;\n]+/)
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    if (editingAnchor.id) {
      // Update existing
      const updated = anchors.map((a) =>
        a.id === editingAnchor.id
          ? ({
              ...a,
              title: editingAnchor.title!.trim(),
              category: editingAnchor.category || 'custom',
              keywords: parsedKeywords.length > 0 ? parsedKeywords : ['general'],
              content: editingAnchor.content!.trim(),
              isEnabled: editingAnchor.isEnabled ?? true,
              isPinned: editingAnchor.isPinned ?? false,
              updatedAt: Date.now(),
            } as ContextualAnchor)
          : a
      );
      onSaveAnchors(updated);
      showNotification('Anchor updated in vault');
    } else {
      // Create new
      const newAnchor: ContextualAnchor = {
        id: `anchor-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: editingAnchor.title!.trim(),
        category: editingAnchor.category || 'custom',
        keywords: parsedKeywords.length > 0 ? parsedKeywords : ['general'],
        content: editingAnchor.content!.trim(),
        isEnabled: true,
        isPinned: editingAnchor.isPinned ?? false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      onSaveAnchors([newAnchor, ...anchors]);
      showNotification('New anchor added to vault');
    }

    setIsEditing(false);
    setEditingAnchor(null);
  };

  const handleRestoreDefaults = () => {
    const existingIds = new Set(anchors.map((a) => a.id));
    const missingDefaults = DEFAULT_ANCHORS.filter((d) => !existingIds.has(d.id));
    if (missingDefaults.length === 0) {
      showNotification('Default VIP anchors already present in vault');
      return;
    }
    onSaveAnchors([...anchors, ...missingDefaults]);
    showNotification(`Added ${missingDefaults.length} default anchors to vault`);
  };

  const handleExportAnchors = () => {
    const data = JSON.stringify(anchors, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bolex-vault-anchors-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportAnchors = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onSaveAnchors(parsed);
          showNotification(`Imported ${parsed.length} anchors successfully`);
        } else {
          alert('Invalid anchors JSON file structure.');
        }
      } catch {
        alert('Could not parse anchors JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filter anchors
  const filteredAnchors = anchors.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || a.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const activeCount = anchors.filter((a) => a.isEnabled).length;
  const pinnedCount = anchors.filter((a) => a.isPinned && a.isEnabled).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-xs">
              <Anchor className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Contextual Anchors &amp; Memory Vault
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  Persistent Context
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                {activeCount} active ({pinnedCount} pinned) • Auto-injected on keyword match into Bolex's context
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm shadow-amber-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Anchor</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusNotification && (
          <div className="px-4 py-2 bg-amber-500/20 border-b border-amber-500/40 flex items-center gap-2 text-xs text-amber-200 animate-in slide-in-from-top duration-150">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{statusNotification}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Explanation Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/30 via-neutral-900 to-purple-950/20 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-neutral-300">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-white">Zero Re-Explaining:</strong> Pin tech specs, API schemas, design rules, or coding patterns. Whenever you mention registered keywords (e.g. <em>"backend"</em>, <em>"theme"</em>, <em>"bolex"</em>), Bolex primes them automatically into its cognitive memory.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRestoreDefaults}
                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[11px] font-medium transition-colors border border-neutral-700"
              >
                Load Starter Pack
              </button>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Search anchors by title, keyword, or text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-neutral-850 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/60"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-neutral-800/80 text-neutral-400 border border-neutral-800 hover:text-neutral-200'
                }`}
              >
                All ({anchors.length})
              </button>
              {Object.entries(CATEGORY_META).map(([key, meta]) => {
                const count = anchors.filter((a) => a.category === key).length;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedCategory(key)}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
                      selectedCategory === key
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-neutral-800/80 text-neutral-400 border border-neutral-800 hover:text-neutral-200'
                    }`}
                  >
                    <span>{meta.label}</span>
                    <span className="text-[10px] opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Anchor List */}
          {filteredAnchors.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl border border-dashed border-neutral-800 bg-neutral-950/40">
              <Anchor className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-neutral-300">No anchors found</p>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? 'No anchors matched your current query or category filter.'
                  : 'Your project memory vault is empty. Click "+ New Anchor" or "Load Starter Pack" to begin.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredAnchors.map((anchor) => {
                const meta = CATEGORY_META[anchor.category] || CATEGORY_META.custom;
                const IconComponent = meta.icon;
                const isCopied = copiedId === anchor.id;

                return (
                  <div
                    key={anchor.id}
                    className={`p-4 rounded-xl border transition-all ${
                      anchor.isEnabled
                        ? anchor.isPinned
                          ? 'bg-neutral-950 border-amber-500/40 shadow-sm'
                          : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                        : 'bg-neutral-950/40 border-neutral-850 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${meta.color}`}>
                            <IconComponent className="w-3 h-3" />
                            <span>{meta.label}</span>
                          </span>

                          <h3 className="font-semibold text-sm text-neutral-100 truncate">
                            {anchor.title}
                          </h3>

                          {anchor.isPinned && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <Pin className="w-2.5 h-2.5" />
                              <span>Pinned (Always Active)</span>
                            </span>
                          )}
                        </div>

                        {/* Keyword Trigger Chips */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          <span className="text-[11px] text-neutral-500 font-medium">Triggers:</span>
                          {anchor.keywords.map((kw, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.2 rounded bg-neutral-800 border border-neutral-700 text-[10px] font-mono text-neutral-300"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>

                        {/* Content Snippet */}
                        <div className="pt-2">
                          <pre className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800/80 font-mono text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                            {anchor.content}
                          </pre>
                        </div>
                      </div>

                      {/* Right Action Toolbar */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {/* Enabled Toggle */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleAnchor(anchor.id, e)}
                          className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                            anchor.isEnabled
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                          }`}
                          title={anchor.isEnabled ? 'Active in memory' : 'Disabled'}
                        >
                          <span className={`w-2 h-2 rounded-full ${anchor.isEnabled ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
                          <span>{anchor.isEnabled ? 'Active' : 'Off'}</span>
                        </button>

                        <div className="flex items-center gap-1">
                          {/* Pin Toggle */}
                          <button
                            type="button"
                            onClick={(e) => handleTogglePin(anchor.id, e)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              anchor.isPinned
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                            }`}
                            title={anchor.isPinned ? 'Unpin anchor' : 'Pin anchor (always inject in all chats)'}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>

                          {/* Copy Content */}
                          <button
                            type="button"
                            onClick={(e) => handleCopyContent(anchor, e)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                            title="Copy anchor text"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={(e) => handleOpenEdit(anchor, e)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-300 hover:bg-neutral-800 transition-colors"
                            title="Edit anchor"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteAnchor(anchor.id, e)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                            title="Delete anchor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Backup & Export / Import Bar */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-900/90 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportAnchors}
              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-medium flex items-center gap-1.5 transition-colors border border-neutral-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Vault (.json)</span>
            </button>

            <label className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-medium flex items-center gap-1.5 transition-colors border border-neutral-700 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import Vault</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportAnchors}
                className="hidden"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>

      {/* Create / Edit Drawer Modal */}
      {isEditing && editingAnchor && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <form
            onSubmit={handleSaveEdit}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90">
              <div className="flex items-center gap-2">
                <Anchor className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm sm:text-base text-white">
                  {editingAnchor.id ? 'Edit Contextual Anchor' : 'Create New Contextual Anchor'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditingAnchor(null);
                }}
                className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-300">Anchor Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modern Full-Stack TypeScript Architecture"
                  value={editingAnchor.title || ''}
                  onChange={(e) => setEditingAnchor({ ...editingAnchor, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500/60"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-300">Category</label>
                <select
                  value={editingAnchor.category || 'technical_doc'}
                  onChange={(e) =>
                    setEditingAnchor({
                      ...editingAnchor,
                      category: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-amber-500/60"
                >
                  <option value="technical_doc">Technical Documentation &amp; Schemas</option>
                  <option value="architecture">System Architecture &amp; Stack</option>
                  <option value="styleguide">UI Design &amp; Style Guide</option>
                  <option value="system_rule">Bolex System Rule &amp; Policy</option>
                  <option value="custom">Custom Project Memory</option>
                </select>
              </div>

              {/* Keyword Triggers */}
              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-300">
                  Trigger Keywords (Comma or space separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. backend, database, schema, typescript, api"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500/60 font-mono"
                />
                <p className="text-[11px] text-neutral-400">
                  When any of these keywords appear in your prompt, this anchor is automatically loaded.
                </p>
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-neutral-300">Anchor Document / Content</label>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    {editingAnchor.content?.length || 0} characters
                  </span>
                </div>
                <textarea
                  required
                  rows={8}
                  placeholder="Paste your architecture specification, style guidelines, API schemas, or persistent instructions here..."
                  value={editingAnchor.content || ''}
                  onChange={(e) => setEditingAnchor({ ...editingAnchor, content: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500/60 font-mono leading-relaxed"
                />
              </div>

              {/* Pin Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="anchor-pinned-cb"
                  checked={Boolean(editingAnchor.isPinned)}
                  onChange={(e) => setEditingAnchor({ ...editingAnchor, isPinned: e.target.checked })}
                  className="rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500/20"
                />
                <label htmlFor="anchor-pinned-cb" className="text-neutral-300 cursor-pointer select-none">
                  Pin as Permanent Anchor (Always inject in every conversation, regardless of keywords)
                </label>
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-neutral-800 bg-neutral-900/90 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditingAnchor(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold transition-colors text-xs shadow-sm"
              >
                Save Anchor
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
