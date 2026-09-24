import React, { useState, useMemo } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  KeyRound, 
  Sparkles, 
  X,
  Layers,
  Chrome,
  LogIn,
  Crown,
  Pin,
  PinOff,
  Search,
  Download,
  Flame,
  Compass,
  Users,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  FolderInput,
  FolderMinus,
  Edit2,
  Check,
  FolderKanban,
  RotateCcw,
  ArchiveX,
  RefreshCw,
  Sun,
  Moon,
  Sliders,
  Palette,
  Keyboard
} from 'lucide-react';
import { ChatSession, ChatFolder } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getLocalFallbackSummary } from '../lib/summarizer';

const FOLDER_COLORS = [
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Slate', value: '#64748b' },
];

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: (folderId?: string | null) => void;
  onDeleteSession: (id: string, e?: React.MouseEvent) => void;
  onTogglePinSession?: (id: string, e: React.MouseEvent) => void;
  onExportAllSessions?: () => void;
  onRequestSummary?: (sessionId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenExtension: () => void;
  onOpenMap?: () => void;
  onOpenPeopleSearch?: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenBolexPlus?: () => void;
  onOpenShortcuts?: () => void;

  // Folder Organization
  folders: ChatFolder[];
  onCreateFolder: (name: string, color?: string) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onDeleteFolder: (folderId: string, deleteContents: boolean) => void;
  onToggleFolderCollapse: (folderId: string) => void;
  onMoveSessionToFolder: (sessionId: string, folderId: string | null) => void;

  // Trash & Soft Delete
  onRestoreSession: (id: string, e?: React.MouseEvent) => void;
  onPermanentDeleteSession: (id: string, e?: React.MouseEvent) => void;
  onEmptyTrash: () => void;
}

export function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onTogglePinSession,
  onExportAllSessions,
  onRequestSummary,
  isOpen,
  onClose,
  onOpenSettings,
  onOpenExtension,
  onOpenMap,
  onOpenPeopleSearch,
  onOpenAuth,
  onOpenProfile,
  onOpenBolexPlus,
  onOpenShortcuts,
  folders,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onToggleFolderCollapse,
  onMoveSessionToFolder,
  onRestoreSession,
  onPermanentDeleteSession,
  onEmptyTrash,
}: SidebarProps) {
  const { user, profile, effectiveTier, isTrialActive } = useAuth();
  const { themeMode, resolvedTheme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Hover state for 1-sentence conversation summary preview
  const [hoveredSession, setHoveredSession] = useState<{
    sessionId: string;
    rect: DOMRect;
  } | null>(null);
  const hoverTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTitleMouseEnter = (session: ChatSession, e: React.MouseEvent<HTMLElement>) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredSession({ sessionId: session.id, rect });
      if (!session.summary && session.messages.length > 0 && onRequestSummary) {
        onRequestSummary(session.id);
      }
    }, 120);
  };

  const handleTitleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredSession(null);
  };

  const activeHoveredSession = hoveredSession
    ? sessions.find((s) => s.id === hoveredSession.sessionId) || null
    : null;

  // Folder creation & editing state
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#f59e0b');

  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');

  const [folderMenuOpenId, setFolderMenuOpenId] = useState<string | null>(null);
  const [sessionFolderMenuId, setSessionFolderMenuId] = useState<string | null>(null);
  const [deleteModalFolder, setDeleteModalFolder] = useState<ChatFolder | null>(null);

  // Trash UI states
  const [isTrashCollapsed, setIsTrashCollapsed] = useState(true);
  const [isEmptyTrashConfirmOpen, setIsEmptyTrashConfirmOpen] = useState(false);

  // Filtered sessions (excluding soft-deleted ones for active lists)
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter((s) => {
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchMessage = s.messages.some((m) => m.content.toLowerCase().includes(q));
      return matchTitle || matchMessage;
    });
  }, [sessions, searchQuery]);

  const activeSessions = useMemo(() => {
    return filteredSessions.filter((s) => !s.isDeleted);
  }, [filteredSessions]);

  const pinnedSessions = useMemo(() => {
    return activeSessions.filter((s) => s.isPinned);
  }, [activeSessions]);

  const unassignedSessions = useMemo(() => {
    return activeSessions.filter((s) => !s.isPinned && !s.folderId);
  }, [activeSessions]);

  const deletedSessions = useMemo(() => {
    return filteredSessions.filter((s) => s.isDeleted);
  }, [filteredSessions]);

  const handleCreateFolderSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim(), selectedColor);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleRenameSubmit = (folderId: string) => {
    if (editingFolderName.trim()) {
      onRenameFolder(folderId, editingFolderName.trim());
    }
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  const getDaysRemainingText = (deletedAt?: number | null) => {
    if (!deletedAt) return '30d left';
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const elapsed = Date.now() - deletedAt;
    const remainingMs = THIRTY_DAYS_MS - elapsed;
    const daysLeft = Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
    return `${daysLeft}d left`;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-neutral-950/70 z-30 md:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 sm:w-72 bg-neutral-950 border-r border-neutral-800 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top bar with New Chat & New Folder */}
        <div className="p-3 border-b border-neutral-800 space-y-2">
          <div className="flex items-center gap-1.5">
            <button
              id="sidebar-new-chat-btn"
              type="button"
              onClick={() => {
                onNewSession();
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs sm:text-sm transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </button>

            <button
              id="sidebar-new-folder-btn"
              type="button"
              onClick={() => setIsCreatingFolder((prev) => !prev)}
              className={`p-2 rounded-lg transition-all border ${
                isCreatingFolder
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-neutral-900 text-neutral-300 hover:text-white border-neutral-800 hover:border-neutral-700'
              }`}
              title="Create a new custom folder"
            >
              <FolderPlus className="w-4 h-4 text-amber-400" />
            </button>

            {onExportAllSessions && sessions.length > 0 && (
              <button
                id="sidebar-export-all-btn"
                type="button"
                onClick={onExportAllSessions}
                className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors border border-neutral-800"
                title="Backup all chats as JSON"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            <button
              id="sidebar-close-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 md:hidden"
              title="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* New Folder Inline Form */}
          {isCreatingFolder && (
            <form onSubmit={handleCreateFolderSubmit} className="p-2.5 rounded-xl bg-neutral-900 border border-amber-500/40 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
                <span className="flex items-center gap-1.5">
                  <FolderPlus className="w-3.5 h-3.5" /> Create Folder
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreatingFolder(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <input
                type="text"
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name (e.g. Work, Code, Ideas)..."
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-hidden focus:border-amber-500"
              />

              <div className="flex items-center justify-between gap-1 pt-1">
                <div className="flex items-center gap-1">
                  {FOLDER_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setSelectedColor(c.value)}
                      className={`w-4 h-4 rounded-full transition-transform ${
                        selectedColor === c.value ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          )}

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-7 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-400 focus:outline-hidden focus:border-amber-500/50 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sessions & Folders list */}
        <div 
          className="flex-1 overflow-y-auto px-2 py-2 space-y-4"
          onScroll={() => setHoveredSession(null)}
        >
          {/* Pinned Section */}
          {pinnedSessions.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-0.5 flex items-center justify-between text-[10px] font-semibold tracking-wider text-amber-400/90 uppercase">
                <span className="flex items-center gap-1">
                  <Pin className="w-2.5 h-2.5 fill-current" /> Pinned
                </span>
                <span>{pinnedSessions.length}</span>
              </div>
              {pinnedSessions.map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <div
                    key={session.id}
                    onClick={() => {
                      onSelectSession(session.id);
                      onClose();
                    }}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-xs sm:text-sm transition-all ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-200 font-medium border border-amber-500/40 shadow-xs'
                        : 'text-neutral-300 hover:bg-neutral-900 border border-neutral-850/40'
                    }`}
                  >
                    <div 
                      className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                      onMouseEnter={(e) => handleTitleMouseEnter(session, e)}
                      onMouseLeave={handleTitleMouseLeave}
                      title={session.summary ? `Summary: ${session.summary}` : session.title}
                    >
                      <Pin className="w-3 h-3 shrink-0 text-amber-400 fill-current" />
                      <span className="truncate group-hover:text-amber-200 transition-colors font-medium">
                        {session.title || 'Untitled conversation'}
                      </span>
                      {session.summary && (
                        <Sparkles className="w-2.5 h-2.5 shrink-0 text-amber-400/70 group-hover:text-amber-400 transition-colors" />
                      )}
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onTogglePinSession && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePinSession(session.id, e);
                          }}
                          className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-amber-300"
                          title="Unpin conversation"
                        >
                          <PinOff className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id, e);
                        }}
                        className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-rose-400"
                        title="Move to Trash"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* FOLDERS SECTION */}
          {folders.length > 0 && (
            <div className="space-y-2">
              <div className="px-2 py-0.5 flex items-center justify-between text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
                <span className="flex items-center gap-1.5">
                  <FolderKanban className="w-3 h-3 text-amber-400" /> Folders ({folders.length})
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreatingFolder(true)}
                  className="text-neutral-400 hover:text-amber-300 transition-colors"
                  title="Add new folder"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {folders.map((folder) => {
                const folderSessions = activeSessions.filter(
                  (s) => !s.isPinned && s.folderId === folder.id
                );
                const isCollapsed = !!folder.isCollapsed;
                const isEditing = editingFolderId === folder.id;
                const isMenuOpen = folderMenuOpenId === folder.id;

                return (
                  <div key={folder.id} className="rounded-xl border border-neutral-850 bg-neutral-900/40 overflow-hidden space-y-0.5">
                    {/* Folder Header */}
                    <div className="flex items-center justify-between px-2.5 py-1.5 hover:bg-neutral-900/80 transition-colors group relative select-none">
                      <div
                        onClick={() => onToggleFolderCollapse(folder.id)}
                        className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                      >
                        <button
                          type="button"
                          className="text-neutral-400 hover:text-white shrink-0"
                        >
                          {isCollapsed ? (
                            <ChevronRight className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: folder.color || '#f59e0b' }}
                        />

                        {isEditing ? (
                          <input
                            type="text"
                            autoFocus
                            value={editingFolderName}
                            onChange={(e) => setEditingFolderName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameSubmit(folder.id);
                              if (e.key === 'Escape') setEditingFolderId(null);
                            }}
                            onBlur={() => handleRenameSubmit(folder.id)}
                            className="px-1.5 py-0.5 bg-neutral-950 border border-amber-500 rounded text-xs text-white focus:outline-hidden"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-neutral-200 truncate">
                            {folder.name}
                          </span>
                        )}

                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 font-mono">
                          {folderSessions.length}
                        </span>
                      </div>

                      {/* Folder Options Dropdown */}
                      <div className="relative flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNewSession(folder.id);
                            onClose();
                          }}
                          className="p-1 rounded text-neutral-400 hover:text-amber-300 hover:bg-neutral-800 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Create new chat in this folder"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFolderMenuOpenId(isMenuOpen ? null : folder.id);
                          }}
                          className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {/* Menu Popover */}
                        {isMenuOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-6 z-50 w-44 p-1 rounded-xl bg-neutral-900 border border-neutral-700 shadow-xl text-xs space-y-0.5 animate-in fade-in duration-100"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                onNewSession(folder.id);
                                setFolderMenuOpenId(null);
                                onClose();
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-neutral-200 hover:bg-neutral-800 hover:text-white text-left"
                            >
                              <Plus className="w-3.5 h-3.5 text-amber-400" />
                              <span>New Chat Here</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingFolderId(folder.id);
                                setEditingFolderName(folder.name);
                                setFolderMenuOpenId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-neutral-200 hover:bg-neutral-800 hover:text-white text-left"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                              <span>Rename Folder</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setDeleteModalFolder(folder);
                                setFolderMenuOpenId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-300 hover:bg-rose-950/50 hover:text-rose-200 text-left"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              <span>Delete Folder...</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Folder Items (Expanded) */}
                    {!isCollapsed && (
                      <div className="pl-3 pr-1 py-1 space-y-0.5 border-t border-neutral-850/50">
                        {folderSessions.length === 0 ? (
                          <div className="px-2 py-2 text-[11px] text-neutral-400 italic text-center">
                            Empty folder. Click <span className="text-amber-400 font-bold">+</span> to add chat.
                          </div>
                        ) : (
                          folderSessions.map((session) => {
                            const isActive = session.id === activeSessionId;
                            const isMoveMenuOpen = sessionFolderMenuId === session.id;

                            return (
                              <div
                                key={session.id}
                                onClick={() => {
                                  onSelectSession(session.id);
                                  onClose();
                                }}
                                className={`group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer text-xs transition-all relative ${
                                  isActive
                                    ? 'bg-neutral-800 text-white font-medium border border-neutral-700/60'
                                    : 'text-neutral-300 hover:bg-neutral-850 hover:text-white'
                                }`}
                              >
                                <div 
                                  className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                                  onMouseEnter={(e) => handleTitleMouseEnter(session, e)}
                                  onMouseLeave={handleTitleMouseLeave}
                                  title={session.summary ? `Summary: ${session.summary}` : session.title}
                                >
                                  <MessageSquare className={`w-3 h-3 shrink-0 ${isActive ? 'text-amber-400' : 'text-neutral-400'}`} />
                                  <span className="truncate group-hover:text-amber-200 transition-colors font-medium">
                                    {session.title || 'Untitled chat'}
                                  </span>
                                  {session.summary && (
                                    <Sparkles className="w-2.5 h-2.5 shrink-0 text-amber-400/70 group-hover:text-amber-400 transition-colors" />
                                  )}
                                </div>

                                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {/* Folder reassignment dropdown button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSessionFolderMenuId(isMoveMenuOpen ? null : session.id);
                                    }}
                                    className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-amber-300"
                                    title="Move to another folder"
                                  >
                                    <FolderInput className="w-3 h-3" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteSession(session.id, e);
                                    }}
                                    className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-rose-400"
                                    title="Move to Trash"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>

                                  {/* Move Session Popover */}
                                  {isMoveMenuOpen && (
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      className="absolute right-0 top-6 z-50 w-48 p-1 rounded-xl bg-neutral-900 border border-neutral-700 shadow-xl text-xs space-y-0.5 animate-in fade-in duration-100"
                                    >
                                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                        Move to Folder
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onMoveSessionToFolder(session.id, null);
                                          setSessionFolderMenuId(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-neutral-300 hover:bg-neutral-800 hover:text-white text-left"
                                      >
                                        <FolderMinus className="w-3.5 h-3.5 text-neutral-400" />
                                        <span>Remove from Folder</span>
                                      </button>
                                      {folders.map((f) => (
                                        <button
                                          key={f.id}
                                          type="button"
                                          onClick={() => {
                                            onMoveSessionToFolder(session.id, f.id);
                                            setSessionFolderMenuId(null);
                                          }}
                                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left ${
                                            session.folderId === f.id
                                              ? 'bg-amber-500/20 text-amber-300 font-bold'
                                              : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2 truncate">
                                            <div
                                              className="w-2 h-2 rounded-full shrink-0"
                                              style={{ backgroundColor: f.color || '#f59e0b' }}
                                            />
                                            <span className="truncate">{f.name}</span>
                                          </div>
                                          {session.folderId === f.id && <Check className="w-3 h-3 text-amber-400" />}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* UNASSIGNED / RECENT SECTION */}
          <div className="space-y-1">
            <div className="px-2 py-0.5 flex items-center justify-between text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3 h-3" /> {folders.length > 0 ? 'Uncategorized Chats' : 'Recent Chats'}
              </span>
              <span>{unassignedSessions.length}</span>
            </div>

            {activeSessions.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-neutral-400">
                {searchQuery ? `No matches for "${searchQuery}"` : 'No active conversations.'}
              </div>
            ) : unassignedSessions.length === 0 && folders.length > 0 ? (
              <div className="px-3 py-2 text-center text-[11px] text-neutral-500">
                All conversations organized in folders.
              </div>
            ) : (
              unassignedSessions.map((session) => {
                const isActive = session.id === activeSessionId;
                const isMoveMenuOpen = sessionFolderMenuId === session.id;

                return (
                  <div
                    key={session.id}
                    onClick={() => {
                      onSelectSession(session.id);
                      onClose();
                    }}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-xs sm:text-sm transition-all relative ${
                      isActive
                        ? 'bg-neutral-800 text-white font-medium shadow-xs border border-neutral-700/60'
                        : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 border border-transparent'
                    }`}
                  >
                    <div 
                      className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                      onMouseEnter={(e) => handleTitleMouseEnter(session, e)}
                      onMouseLeave={handleTitleMouseLeave}
                      title={session.summary ? `Summary: ${session.summary}` : session.title}
                    >
                      <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-400' : 'text-neutral-400'}`} />
                      <span className="truncate group-hover:text-amber-200 transition-colors font-medium">
                        {session.title || 'Untitled conversation'}
                      </span>
                      {session.summary && (
                        <Sparkles className="w-2.5 h-2.5 shrink-0 text-amber-400/70 group-hover:text-amber-400 transition-colors" />
                      )}
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Move to folder trigger */}
                      {folders.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSessionFolderMenuId(isMoveMenuOpen ? null : session.id);
                          }}
                          className="p-1 rounded hover:bg-neutral-700/60 text-neutral-400 hover:text-amber-300"
                          title="Move to folder"
                        >
                          <FolderInput className="w-3 h-3" />
                        </button>
                      )}

                      {onTogglePinSession && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePinSession(session.id, e);
                          }}
                          className="p-1 rounded hover:bg-neutral-700/60 text-neutral-400 hover:text-amber-300"
                          title="Pin to top"
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id, e);
                        }}
                        className="p-1 rounded hover:bg-neutral-700/60 text-neutral-400 hover:text-rose-400"
                        title="Move to Trash"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>

                      {/* Move Session Popover */}
                      {isMoveMenuOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-6 z-50 w-48 p-1 rounded-xl bg-neutral-900 border border-neutral-700 shadow-xl text-xs space-y-0.5 animate-in fade-in duration-100"
                        >
                          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                            Move to Folder
                          </div>
                          {folders.map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => {
                                onMoveSessionToFolder(session.id, f.id);
                                setSessionFolderMenuId(null);
                              }}
                              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-neutral-300 hover:bg-neutral-800 hover:text-white"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <div
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: f.color || '#f59e0b' }}
                                />
                                <span className="truncate">{f.name}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* TRASH / SOFT DELETE SECTION */}
          {deletedSessions.length > 0 && (
            <div className="pt-2 border-t border-neutral-850 space-y-1">
              <div className="px-2 py-1 flex items-center justify-between text-[10px] font-semibold tracking-wider text-rose-400/90 uppercase select-none">
                <button
                  type="button"
                  onClick={() => setIsTrashCollapsed((prev) => !prev)}
                  className="flex items-center gap-1.5 hover:text-rose-300"
                >
                  {isTrashCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  <Trash2 className="w-3 h-3 text-rose-400" />
                  <span>Trash ({deletedSessions.length})</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-neutral-400 lowercase font-normal">30d auto-purge</span>
                  <button
                    type="button"
                    onClick={() => setIsEmptyTrashConfirmOpen(true)}
                    className="text-[10px] text-rose-400 hover:text-rose-300 underline font-semibold"
                    title="Empty all deleted chats in trash"
                  >
                    Empty
                  </button>
                </div>
              </div>

              {!isTrashCollapsed && (
                <div className="space-y-0.5 pl-1.5 animate-in fade-in duration-100">
                  {deletedSessions.map((session) => (
                    <div
                      key={session.id}
                      className="group flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-neutral-900/60 border border-neutral-850/80 text-xs text-neutral-400 hover:text-neutral-200 transition-all"
                    >
                      <div 
                        className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                        onMouseEnter={(e) => handleTitleMouseEnter(session, e)}
                        onMouseLeave={handleTitleMouseLeave}
                        title={session.summary ? `Summary: ${session.summary}` : session.title}
                      >
                        <ArchiveX className="w-3.5 h-3.5 shrink-0 text-neutral-500" />
                        <span className="truncate line-through decoration-neutral-600 group-hover:text-neutral-200 transition-colors font-medium">
                          {session.title || 'Untitled conversation'}
                        </span>
                        {session.summary && (
                          <Sparkles className="w-2.5 h-2.5 shrink-0 text-amber-400/50 group-hover:text-amber-400 transition-colors" />
                        )}
                        <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-800 text-neutral-500 shrink-0 font-mono">
                          {getDaysRemainingText(session.deletedAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRestoreSession(session.id, e);
                          }}
                          className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors border border-emerald-500/30 flex items-center gap-1 text-[10px] font-semibold"
                          title="Restore chat to active conversations"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span className="hidden sm:inline">Restore</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPermanentDeleteSession(session.id, e);
                          }}
                          className="p-1 rounded hover:bg-rose-950/50 text-neutral-400 hover:text-rose-400 transition-colors"
                          title="Permanently delete this chat now"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Cards: Bolex Studio Map, Extension & User Account */}
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-900/50 space-y-2">
          {/* Bolex Map Studio Button */}
          {onOpenMap && (
            <button
              id="sidebar-map-studio-btn"
              type="button"
              onClick={() => {
                onOpenMap();
                onClose();
              }}
              className="w-full p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 text-left transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                  <Compass className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                    Bolex Map Studio
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    Mind Map & Geo Explorer
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25 font-mono">
                10-Feature
              </span>
            </button>
          )}

          {/* Search People (Bolex Accounts) Button */}
          {onOpenPeopleSearch && (
            <button
              id="sidebar-search-people-btn"
              type="button"
              onClick={() => {
                onOpenPeopleSearch();
                onClose();
              }}
              className="w-full p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 text-left transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                    Search People
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    Real Accounts • Zero Bots
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-mono">
                People
              </span>
            </button>
          )}

          {/* Bolex Tier Membership Card */}
          {onOpenBolexPlus && (
            <button
              id="sidebar-bolex-plus-card-btn"
              type="button"
              onClick={() => {
                onOpenBolexPlus();
                onClose();
              }}
              className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between group ${
                effectiveTier === 'quantum'
                  ? 'bg-cyan-950/30 border-cyan-500/50 hover:bg-cyan-950/50'
                  : effectiveTier === 'ultra'
                  ? 'bg-purple-950/30 border-purple-500/50 hover:bg-purple-950/50'
                  : effectiveTier === 'plus'
                  ? 'bg-amber-950/30 border-amber-500/40 hover:bg-amber-950/50'
                  : 'bg-neutral-900/90 border-neutral-800 hover:border-amber-500/40'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${
                  effectiveTier === 'quantum'
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                    : effectiveTier === 'ultra'
                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                }`}>
                  {effectiveTier === 'quantum' ? <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" /> : effectiveTier === 'ultra' ? <Flame className="w-4 h-4 fill-purple-400/20" /> : <Crown className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{effectiveTier === 'quantum' ? 'Bolex Quantum' : effectiveTier === 'ultra' ? 'Bolex Ultra' : effectiveTier === 'plus' ? 'Bolex Plus' : 'Membership Tiers'}</span>
                  </div>
                  <div className="text-[10px] text-neutral-400 truncate">
                    {effectiveTier === 'quantum'
                      ? 'Consensus Engine + Unlimited Memory'
                      : effectiveTier === 'ultra'
                      ? '∞ Tokens + 1M Memory & Ultra Lane'
                      : effectiveTier === 'plus'
                      ? '∞ Tokens & Web Speech Studio'
                      : 'Free 60 tokens • 3-Day Trials'}
                  </div>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold shrink-0 transition-colors ${
                effectiveTier === 'quantum'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : effectiveTier === 'ultra'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : effectiveTier === 'plus' 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                  : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold'
              }`}>
                {effectiveTier === 'quantum' ? 'Quantum' : effectiveTier === 'ultra' ? 'Ultra' : effectiveTier === 'plus' ? 'Perks' : '3-Day Trial'}
              </span>
            </button>
          )}

          {/* User Account / Auth Section */}
          {user ? (
            <button
              id="sidebar-user-profile-btn"
              type="button"
              onClick={() => {
                onOpenProfile();
                onClose();
              }}
              className="w-full p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-left transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold text-[11px] shrink-0 uppercase">
                  {user.email?.[0] || 'U'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">
                    {profile?.displayName || user.displayName || user.email?.split('@')[0]}
                  </div>
                  <div className="text-[10px] text-neutral-400 truncate">
                    {user.email}
                  </div>
                </div>
              </div>
            </button>
          ) : (
            <button
              id="sidebar-sign-in-btn"
              type="button"
              onClick={() => {
                onOpenAuth();
                onClose();
              }}
              className="w-full py-2 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors border border-neutral-700/60"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              <span>Sign In / Sign Up</span>
            </button>
          )}

          {/* Theme, Settings & Keyboard Shortcuts Quick Actions */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              id="sidebar-theme-toggle-btn"
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-colors flex flex-col items-center justify-center gap-1 text-[11px] font-medium"
              title={`Theme: ${resolvedTheme === 'dark' ? 'Dark' : 'Light'} (${themeMode === 'system' ? 'Auto OS' : 'Manual'}). Click to switch.`}
            >
              {resolvedTheme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="truncate">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-purple-400" />
                  <span className="truncate">Dark</span>
                </>
              )}
            </button>

            <button
              id="sidebar-settings-btn"
              type="button"
              onClick={() => {
                onOpenSettings();
                onClose();
              }}
              className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-colors flex flex-col items-center justify-center gap-1 text-[11px] font-medium"
              title="Open Settings & Theme Preferences"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate">Settings</span>
            </button>

            {onOpenShortcuts ? (
              <button
                id="sidebar-shortcuts-btn"
                type="button"
                onClick={() => {
                  onOpenShortcuts();
                  onClose();
                }}
                className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-amber-300 transition-colors flex flex-col items-center justify-center gap-1 text-[11px] font-medium"
                title="Keyboard Shortcuts Productivity Help (?)"
              >
                <Keyboard className="w-3.5 h-3.5 text-amber-400" />
                <span className="truncate">Keys (?)</span>
              </button>
            ) : (
              <button
                id="sidebar-shortcuts-placeholder-btn"
                type="button"
                onClick={() => {
                  onOpenSettings();
                  onClose();
                }}
                className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-amber-300 transition-colors flex flex-col items-center justify-center gap-1 text-[11px] font-medium"
              >
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span className="truncate">Theme</span>
              </button>
            )}
          </div>

          {/* Browser Extension Button */}
          <button
            id="sidebar-extension-btn"
            type="button"
            onClick={() => {
              onOpenExtension();
              onClose();
            }}
            className="w-full p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-left transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-amber-500/10 text-amber-400">
                <Chrome className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                  Browser Extension
                </div>
                <div className="text-[10px] text-neutral-400">
                  Chrome, Edge & Brave (.ZIP)
                </div>
              </div>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-medium">
              V3
            </span>
          </button>
        </div>
      </aside>

      {/* Floating 1-Sentence Summary Hover Card */}
      {hoveredSession && activeHoveredSession && (
        <div
          className="fixed z-60 pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95"
          style={{
            top:
              hoveredSession.rect.bottom + 160 > window.innerHeight
                ? Math.max(10, hoveredSession.rect.top - 120)
                : hoveredSession.rect.bottom + 6,
            left: Math.max(12, Math.min(window.innerWidth - 300, hoveredSession.rect.left)),
            width: '280px',
          }}
        >
          <div className="rounded-xl bg-neutral-950/95 border border-amber-500/40 p-3 shadow-2xl backdrop-blur-xl ring-1 ring-amber-500/20 space-y-2">
            <div className="flex items-center justify-between gap-2 border-b border-neutral-800/80 pb-1.5">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Sparkles className="w-3.5 h-3.5 fill-amber-400/20 animate-pulse" />
                <span className="text-[10px] font-bold tracking-wider uppercase">
                  1-Sentence Summary
                </span>
              </div>
              <span className="text-[10px] font-medium text-neutral-400">
                {activeHoveredSession.messages.length} msg{activeHoveredSession.messages.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="text-[11px] font-semibold text-neutral-200 truncate">
              {activeHoveredSession.title || 'Untitled conversation'}
            </div>

            {activeHoveredSession.isSummaryLoading ? (
              <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-amber-300/80">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
                <span className="text-[11px]">Generating concise summary...</span>
              </div>
            ) : activeHoveredSession.summary ? (
              <p className="text-xs text-neutral-100 font-normal leading-relaxed italic bg-neutral-900/90 p-2.5 rounded-lg border border-neutral-800/80 text-left shadow-inner">
                "{activeHoveredSession.summary}"
              </p>
            ) : activeHoveredSession.messages.length === 0 ? (
              <p className="text-xs text-neutral-400 italic bg-neutral-900/50 p-2 rounded-lg text-left">
                Empty conversation awaiting first prompt.
              </p>
            ) : (
              <p className="text-xs text-neutral-200 italic bg-neutral-900/90 p-2.5 rounded-lg border border-neutral-800/80 text-left">
                "{getLocalFallbackSummary(activeHoveredSession.messages, activeHoveredSession.title)}"
              </p>
            )}

            <div className="flex items-center justify-between text-[9px] text-neutral-500 pt-0.5">
              <span>Bolex AI Context Memory</span>
              <span>
                {activeHoveredSession.updatedAt
                  ? new Date(activeHoveredSession.updatedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Delete Folder Modal Confirmation */}
      {deleteModalFolder && (
        <div className="fixed inset-0 bg-neutral-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md p-5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <Trash2 className="w-4 h-4" />
                <span>Delete Folder: {deleteModalFolder.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalFolder(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              What would you like to do with the chat conversations stored inside <strong className="text-white">{deleteModalFolder.name}</strong>?
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onDeleteFolder(deleteModalFolder.id, false);
                  setDeleteModalFolder(null);
                }}
                className="w-full p-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 text-xs font-semibold transition-colors text-left flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-white">Keep Chats (Remove Folder Only)</div>
                  <div className="text-[11px] text-neutral-400 font-normal">Moves chats to Uncategorized list without deleting them.</div>
                </div>
                <FolderMinus className="w-4 h-4 text-amber-400 shrink-0 ml-2" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onDeleteFolder(deleteModalFolder.id, true);
                  setDeleteModalFolder(null);
                }}
                className="w-full p-3 rounded-xl bg-rose-950/40 hover:bg-rose-950/70 text-rose-200 border border-rose-800/60 text-xs font-semibold transition-colors text-left flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-rose-300">Delete Folder & Move Chats to Trash</div>
                  <div className="text-[11px] text-rose-300/80 font-normal">Moves folder chats to Trash (restorable for 30 days).</div>
                </div>
                <Trash2 className="w-4 h-4 text-rose-400 shrink-0 ml-2" />
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setDeleteModalFolder(null)}
                className="px-4 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs font-medium hover:bg-neutral-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty Trash Confirmation Modal */}
      {isEmptyTrashConfirmOpen && (
        <div className="fixed inset-0 bg-neutral-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm p-5 rounded-2xl bg-neutral-900 border border-rose-500/30 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <Trash2 className="w-4.5 h-4.5 text-rose-400" />
              <span>Empty Trash?</span>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Are you sure you want to permanently delete all {deletedSessions.length} chat{deletedSessions.length > 1 ? 's' : ''} in the Trash? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEmptyTrashConfirmOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onEmptyTrash();
                  setIsEmptyTrashConfirmOpen(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-xs"
              >
                Empty Trash Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
