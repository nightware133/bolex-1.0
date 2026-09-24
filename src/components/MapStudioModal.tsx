import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Sparkles,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Search,
  Filter,
  Plus,
  Trash2,
  Link2,
  Compass,
  Layers,
  Globe,
  MapPin,
  Share2,
  FileCode,
  Eye,
  Check,
  Send,
  Navigation,
  ArrowRight,
  ChevronRight,
  Flame,
  HelpCircle,
  BarChart3,
  Activity,
  Copy,
  Brain,
  Terminal,
  CheckCircle2,
  Lightbulb,
  ExternalLink
} from 'lucide-react';
import { MapNode, MapLink, MapData, ChatSession } from '../types';
import {
  CATEGORY_CONFIG,
  getDefaultKnowledgeMap,
  getDefaultPlacesMap,
  extractMapFromMessages,
  calculateGeoDistance,
  geoToCanvas,
  generateMermaidFromMap,
  generateMarkdownFromMap,
} from '../lib/mapEngine';

interface MapStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSession: ChatSession;
  onSendToChat: (prompt: string, requiresSearch?: boolean) => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Sparkles,
  Terminal,
  Brain,
  CheckCircle2,
  MapPin,
  Lightbulb,
};

export function MapStudioModal({
  isOpen,
  onClose,
  activeSession,
  onSendToChat,
}: MapStudioModalProps) {
  // State
  const [mapData, setMapData] = useState<MapData>(() => {
    // Try restoring from activeSession or default
    return getDefaultKnowledgeMap(activeSession.title || 'Conversation Intelligence');
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [secondarySelectedNodeId, setSecondarySelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [isConnectingNodes, setIsConnectingNodes] = useState(false);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [connectLinkLabel, setConnectLinkLabel] = useState('connects with');
  
  // Custom Node Form state
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeCategory, setNewNodeCategory] = useState<MapNode['category']>('creative');
  const [newNodeDesc, setNewNodeDesc] = useState('');
  const [newNodePlace, setNewNodePlace] = useState('');

  // Canvas Viewport transform
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Dragging individual node
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [nodeOffset, setNodeOffset] = useState({ x: 0, y: 0 });

  // Export Feedback
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const canvasRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync / Reset when session title changes if map is empty
  useEffect(() => {
    if (activeSession.messages.length > 0 && mapData.nodes.length <= 1) {
      setMapData(extractMapFromMessages(activeSession.messages, activeSession.title));
    }
  }, [activeSession.id]);

  const selectedNode = useMemo(() => {
    return mapData.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [mapData.nodes, selectedNodeId]);

  const secondarySelectedNode = useMemo(() => {
    return mapData.nodes.find((n) => n.id === secondarySelectedNodeId) || null;
  }, [mapData.nodes, secondarySelectedNodeId]);

  // Filtered nodes by search & category
  const filteredNodeIds = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return new Set(
      mapData.nodes
        .filter((n) => {
          const matchQuery =
            !q ||
            n.label.toLowerCase().includes(q) ||
            (n.description && n.description.toLowerCase().includes(q)) ||
            (n.placeName && n.placeName.toLowerCase().includes(q)) ||
            (n.notes && n.notes.toLowerCase().includes(q));

          const matchCat =
            activeCategoryFilter === 'all' ||
            n.category === activeCategoryFilter;

          return matchQuery && matchCat;
        })
        .map((n) => n.id)
    );
  }, [mapData.nodes, searchQuery, activeCategoryFilter]);

  // Geo Distance if in places mode and 2 nodes selected
  const distanceInfo = useMemo(() => {
    if (
      mapData.viewMode === 'places' &&
      selectedNode &&
      secondarySelectedNode &&
      selectedNode.lat != null &&
      selectedNode.lng != null &&
      secondarySelectedNode.lat != null &&
      secondarySelectedNode.lng != null
    ) {
      return calculateGeoDistance(
        selectedNode.lat,
        selectedNode.lng,
        secondarySelectedNode.lat,
        secondarySelectedNode.lng
      );
    }
    return null;
  }, [mapData.viewMode, selectedNode, secondarySelectedNode]);

  // Feature 1: Dual Mode Switcher
  const handleToggleViewMode = (mode: 'knowledge' | 'places') => {
    if (mode === mapData.viewMode) return;
    if (mode === 'places') {
      setMapData(getDefaultPlacesMap());
    } else {
      setMapData(getDefaultKnowledgeMap(activeSession.title || 'Core Intelligence'));
    }
    setSelectedNodeId(null);
    setSecondarySelectedNodeId(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Feature 2: 1-Click AI Knowledge Map Generation
  const handleGenerateAiMap = async (customTopic?: string) => {
    setIsGenerating(true);
    const targetTopic = customTopic || customTopicInput || activeSession.title || 'AI Strategy & Architecture';
    
    // Conversation context snippet
    const context = activeSession.messages
      .slice(-5)
      .map((m) => `${m.role}: ${m.content.slice(0, 150)}`)
      .join('\n');

    try {
      const res = await fetch('/api/map/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: targetTopic,
          context,
          mode: mapData.viewMode,
        }),
      });

      if (!res.ok) throw new Error('API request failed');
      const json = await res.json();

      if (json.ok && json.data && Array.isArray(json.data.nodes)) {
        // Lay out nodes nicely around center
        const rawNodes: any[] = json.data.nodes;
        const total = rawNodes.length;
        const centerX = 400;
        const centerY = 260;
        const radius = 220;

        const positionedNodes: MapNode[] = rawNodes.map((n, i) => {
          if (mapData.viewMode === 'places' && n.lat != null && n.lng != null) {
            const pt = geoToCanvas(n.lat, n.lng, 800, 480);
            return { ...n, x: Math.round(pt.x), y: Math.round(pt.y) };
          }
          if (i === 0 || n.category === 'core') {
            return { ...n, x: centerX, y: centerY };
          }
          const angle = ((i - 1) / (total - 1)) * 2 * Math.PI - Math.PI / 2;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          return {
            ...n,
            x: Math.round(x),
            y: Math.round(y),
          };
        });

        setMapData({
          nodes: positionedNodes,
          links: Array.isArray(json.data.links) ? json.data.links : [],
          viewMode: mapData.viewMode,
        });
        setSelectedNodeId(positionedNodes[0]?.id || null);
      } else {
        throw new Error('Invalid format');
      }
    } catch (err) {
      console.warn('Fallback local generation:', err);
      // Fallback local extractor
      setMapData(extractMapFromMessages(activeSession.messages, targetTopic));
    } finally {
      setIsGenerating(false);
      setCustomTopicInput('');
    }
  };

  // Feature 3: AI Branch Expander ("Expand Node with Bolex AI")
  const handleExpandNode = async (node: MapNode) => {
    if (isExpanding) return;
    setIsExpanding(true);

    try {
      const res = await fetch('/api/map/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeLabel: node.label,
          nodeCategory: node.category,
          context: node.description || node.notes || activeSession.title,
        }),
      });

      const json = await res.json();
      if (json.ok && json.data && Array.isArray(json.data.newNodes)) {
        const newNodesRaw: any[] = json.data.newNodes;
        const startAngle = Math.random() * Math.PI * 2;
        const spawnRadius = 140;

        const newNodes: MapNode[] = newNodesRaw.map((nn, idx) => {
          const angle = startAngle + (idx / newNodesRaw.length) * Math.PI * 2;
          const x = Math.round(node.x + Math.cos(angle) * spawnRadius);
          const y = Math.round(node.y + Math.sin(angle) * spawnRadius);
          const uniqueId = `node-exp-${Date.now()}-${idx}`;
          return {
            ...nn,
            id: uniqueId,
            parentId: node.id,
            x: Math.max(60, Math.min(740, x)),
            y: Math.max(60, Math.min(460, y)),
          };
        });

        const newLinks: MapLink[] = newNodes.map((nn, idx) => ({
          id: `link-${node.id}-${nn.id}`,
          source: node.id,
          target: nn.id,
          label: json.data.newLinks?.[idx]?.label || 'branches to',
        }));

        setMapData((prev) => ({
          ...prev,
          nodes: [...prev.nodes, ...newNodes],
          links: [...prev.links, ...newLinks],
        }));
      }
    } catch (err) {
      console.warn('Branch expansion fallback:', err);
      // Generate a local sub-node
      const newId = `sub-${Date.now()}`;
      const subNode: MapNode = {
        id: newId,
        label: `${node.label} Insight`,
        description: `Extended analytical dimension for ${node.label}.`,
        category: 'creative',
        x: node.x + 80,
        y: node.y + 80,
        parentId: node.id,
      };
      const subLink: MapLink = {
        id: `link-${node.id}-${newId}`,
        source: node.id,
        target: newId,
        label: 'expands to',
      };
      setMapData((prev) => ({
        ...prev,
        nodes: [...prev.nodes, subNode],
        links: [...prev.links, subLink],
      }));
    } finally {
      setIsExpanding(false);
    }
  };

  // Feature 4: Canvas Mouse Navigation (Pan, Zoom, Drag Nodes)
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    // If clicked directly on canvas background (not on a node)
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'map-canvas-bg') {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingCanvas) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    } else if (draggingNodeId) {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;

      setMapData((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === draggingNodeId
            ? { ...n, x: Math.round(mouseX - nodeOffset.x), y: Math.round(mouseY - nodeOffset.y) }
            : n
        ),
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
    setDraggingNodeId(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.min(2.5, Math.max(0.4, prev * zoomFactor)));
  };

  const handleStartDragNode = (node: MapNode, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isConnectingNodes) {
      if (!connectSourceId) {
        setConnectSourceId(node.id);
      } else if (connectSourceId !== node.id) {
        // Create link
        const newLink: MapLink = {
          id: `link-${connectSourceId}-${node.id}-${Date.now()}`,
          source: connectSourceId,
          target: node.id,
          label: connectLinkLabel || 'connects with',
        };
        setMapData((prev) => ({
          ...prev,
          links: [...prev.links, newLink],
        }));
        setIsConnectingNodes(false);
        setConnectSourceId(null);
      }
      return;
    }

    if (e.shiftKey) {
      // Secondary selection for distance calculation in places mode
      setSecondarySelectedNodeId(node.id);
      return;
    }

    setSelectedNodeId(node.id);
    setDraggingNodeId(node.id);
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;
    setNodeOffset({ x: mouseX - node.x, y: mouseY - node.y });
  };

  // Feature 5: Ask Bolex in Chat
  const handleAskBolex = (promptText: string, requiresSearch = false) => {
    onSendToChat(promptText, requiresSearch);
    onClose();
  };

  // Feature 7: Custom Node Creator
  const handleCreateCustomNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeLabel.trim()) return;

    const newNode: MapNode = {
      id: `custom-node-${Date.now()}`,
      label: newNodeLabel.trim(),
      description: newNodeDesc.trim() || 'Custom brainstorm node.',
      category: newNodeCategory,
      placeName: newNodePlace.trim() || undefined,
      x: 350 + Math.floor(Math.random() * 100),
      y: 220 + Math.floor(Math.random() * 100),
    };

    setMapData((prev) => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));

    setSelectedNodeId(newNode.id);
    setIsAddingNode(false);
    setNewNodeLabel('');
    setNewNodeDesc('');
    setNewNodePlace('');
  };

  // Delete node
  const handleDeleteNode = (nodeId: string) => {
    setMapData((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((n) => n.id !== nodeId),
      links: prev.links.filter((l) => l.source !== nodeId && l.target !== nodeId),
    }));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
    if (secondarySelectedNodeId === nodeId) setSecondarySelectedNodeId(null);
  };

  // Feature 9: Multi-Format Export
  const handleExportMarkdown = async () => {
    const md = generateMarkdownFromMap(mapData);
    await navigator.clipboard.writeText(md);
    setCopiedFormat('markdown');
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const handleExportMermaid = async () => {
    const mermaid = generateMermaidFromMap(mapData);
    await navigator.clipboard.writeText(mermaid);
    setCopiedFormat('mermaid');
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const handleDownloadSVG = () => {
    if (!canvasRef.current) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(canvasRef.current);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bolex-map-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedFormat('svg');
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[860px] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header & Toolbar */}
        <div className="px-4 py-3 border-b border-neutral-800/90 bg-neutral-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-purple-500 to-amber-300 flex items-center justify-center text-neutral-950 font-bold shadow-md shadow-amber-500/20">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white tracking-tight">
                  Bolex Map Studio
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  v2.5 Pro
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                10-Feature Intelligent Concept Mind Mapping & Geographic Explorer
              </p>
            </div>
          </div>

          {/* Center Mode Switcher Tabs */}
          <div className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              type="button"
              onClick={() => handleToggleViewMode('knowledge')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                mapData.viewMode === 'knowledge'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>🧠 Knowledge Mind Map</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleViewMode('places')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                mapData.viewMode === 'places'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>🌍 Places & Geo Map</span>
            </button>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            {/* Export Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu((prev) => !prev)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/60 text-xs font-medium transition-colors cursor-pointer"
                title="Export Map graph"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-1 z-30 space-y-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      handleDownloadSVG();
                      setShowExportMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-neutral-800 text-neutral-200 text-left transition-colors"
                  >
                    <span>Download SVG Vector</span>
                    {copiedFormat === 'svg' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleExportMarkdown();
                      setShowExportMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-neutral-800 text-neutral-200 text-left transition-colors"
                  >
                    <span>Copy Markdown Outline</span>
                    {copiedFormat === 'markdown' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleExportMermaid();
                      setShowExportMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-neutral-800 text-neutral-200 text-left transition-colors"
                  >
                    <span>Copy Mermaid.js Code</span>
                    {copiedFormat === 'mermaid' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                </div>
              )}
            </div>

            {/* Close Modal Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Close Map Studio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Secondary Control Ribbon: Search, Category Filters, Generate, Add */}
        <div className="px-4 py-2 bg-neutral-900/50 border-b border-neutral-800/60 flex flex-wrap items-center justify-between gap-2.5 shrink-0 text-xs">
          {/* Live Search */}
          <div className="flex items-center gap-2 min-w-[200px] max-w-xs flex-1 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800 focus-within:border-amber-500/50">
            <Search className="w-3.5 h-3.5 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts, nodes, cities..."
              className="bg-transparent text-neutral-200 placeholder-neutral-500 text-xs focus:outline-hidden w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-neutral-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="hidden lg:flex items-center gap-1 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-[11px]">
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                activeCategoryFilter === 'all'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All ({mapData.nodes.length})
            </button>
            {Object.entries(CATEGORY_CONFIG).map(([catKey, cat]) => (
              <button
                key={catKey}
                type="button"
                onClick={() => setActiveCategoryFilter(catKey)}
                className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                  activeCategoryFilter === catKey
                    ? `${cat.bg} ${cat.text} border ${cat.border}`
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Action Triggers: AI Generate, Add Node, Link Nodes */}
          <div className="flex items-center gap-1.5 ml-auto">
            {/* AI Generator Button */}
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => handleGenerateAiMap()}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Auto-extract nodes & relationships from current discussion"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Generating Graph...' : 'AI Auto-Map'}</span>
            </button>

            {/* Add Custom Node */}
            <button
              type="button"
              onClick={() => setIsAddingNode((prev) => !prev)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                isAddingNode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-neutral-850 hover:bg-neutral-800 text-neutral-300 border-neutral-700/60'
              }`}
              title="Create a new custom node"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Node</span>
            </button>

            {/* Link Nodes Mode */}
            <button
              type="button"
              onClick={() => {
                setIsConnectingNodes((prev) => !prev);
                setConnectSourceId(null);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                isConnectingNodes
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 ring-1 ring-sky-400/40'
                  : 'bg-neutral-850 hover:bg-neutral-800 text-neutral-300 border-neutral-700/60'
              }`}
              title="Click two nodes to create an edge"
            >
              <Link2 className="w-3.5 h-3.5 text-sky-400" />
              <span>{isConnectingNodes ? 'Click 2 Nodes' : 'Connect'}</span>
            </button>
          </div>
        </div>

        {/* Main Interactive Canvas Area + Side Inspector Drawer */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className="relative flex-1 bg-neutral-950 overflow-hidden select-none cursor-grab active:cursor-grabbing"
        >
          {/* SVG Map Canvas */}
          <svg
            ref={canvasRef}
            id="map-canvas-bg"
            onMouseDown={handleMouseDownCanvas}
            className="w-full h-full block"
            viewBox="0 0 800 480"
          >
            {/* Background Grid Pattern */}
            <defs>
              <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#262626" strokeWidth="0.5" strokeOpacity="0.4" />
                <circle cx="40" cy="40" r="1" fill="#404040" fillOpacity="0.6" />
              </pattern>
              {/* Arrow Marker */}
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#737373" />
              </marker>
              <marker
                id="arrowhead-active"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" />
              </marker>
            </defs>

            <rect width="100%" height="100%" fill="url(#grid-pattern)" />

            {/* Geographic World Vector Outline if in Places Mode */}
            {mapData.viewMode === 'places' && (
              <g opacity="0.25" stroke="#525252" strokeWidth="1" fill="none">
                {/* Americas outline representation */}
                <path d="M 120 100 Q 150 140 160 220 Q 190 270 200 360 Q 210 400 180 440" />
                {/* Europe & Africa */}
                <path d="M 420 80 Q 460 120 450 200 Q 460 280 470 380 Q 440 430 460 460" />
                {/* Asia & Oceania */}
                <path d="M 520 90 Q 640 100 700 160 Q 720 260 680 340 Q 690 410 740 440" />
                {/* Equator & Latitudinal Grid lines */}
                <line x1="0" y1="240" x2="800" y2="240" stroke="#404040" strokeDasharray="4 4" />
                <line x1="0" y1="120" x2="800" y2="120" stroke="#262626" strokeDasharray="2 4" />
                <line x1="0" y1="360" x2="800" y2="360" stroke="#262626" strokeDasharray="2 4" />
              </g>
            )}

            {/* Camera Viewport Group */}
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Render Links / Connection Lines */}
              {mapData.links.map((link) => {
                const sourceNode = mapData.nodes.find((n) => n.id === link.source);
                const targetNode = mapData.nodes.find((n) => n.id === link.target);
                if (!sourceNode || !targetNode) return null;

                const isLinkActive =
                  selectedNodeId === link.source ||
                  selectedNodeId === link.target ||
                  (secondarySelectedNodeId === link.source && selectedNodeId === link.target);

                const midX = (sourceNode.x + targetNode.x) / 2;
                const midY = (sourceNode.y + targetNode.y) / 2;

                // Curved bezier path
                const dx = targetNode.x - sourceNode.x;
                const dy = targetNode.y - sourceNode.y;
                const cx = midX - dy * 0.15;
                const cy = midY + dx * 0.15;

                return (
                  <g key={link.id} className="transition-all">
                    <path
                      d={`M ${sourceNode.x} ${sourceNode.y} Q ${cx} ${cy} ${targetNode.x} ${targetNode.y}`}
                      fill="none"
                      stroke={isLinkActive ? '#f59e0b' : '#525252'}
                      strokeWidth={isLinkActive ? 2.5 : 1.5}
                      strokeDasharray={link.animated ? '5 5' : undefined}
                      opacity={isLinkActive ? 1 : 0.6}
                      markerEnd={isLinkActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                    />
                    {link.label && (
                      <g transform={`translate(${cx}, ${cy})`}>
                        <rect
                          x={-Math.max(25, link.label.length * 3.5)}
                          y="-10"
                          width={Math.max(50, link.label.length * 7)}
                          height="18"
                          rx="4"
                          fill="#171717"
                          stroke={isLinkActive ? '#f59e0b' : '#404040'}
                          strokeWidth="0.8"
                        />
                        <text
                          textAnchor="middle"
                          y="3"
                          fontSize="9"
                          fill={isLinkActive ? '#fef08a' : '#a3a3a3'}
                          fontFamily="sans-serif"
                          className="font-medium"
                        >
                          {link.label}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Render Nodes */}
              {mapData.nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isSecondary = secondarySelectedNodeId === node.id;
                const isMatch = filteredNodeIds.has(node.id);
                const isConnectSource = connectSourceId === node.id;
                const catCfg = CATEGORY_CONFIG[node.category] || CATEGORY_CONFIG.core;
                const Icon = CATEGORY_ICONS[catCfg.icon] || Sparkles;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onMouseDown={(e) => handleStartDragNode(node, e)}
                    className="cursor-pointer group"
                    opacity={isMatch ? 1 : 0.25}
                  >
                    {/* Pulsing ring on selection */}
                    {(isSelected || isConnectSource) && (
                      <circle
                        r="38"
                        fill="none"
                        stroke={isConnectSource ? '#38bdf8' : '#f59e0b'}
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        className="animate-spin"
                        style={{ transformOrigin: '0 0' }}
                      />
                    )}

                    {/* Node Background Disc / Pill */}
                    <circle
                      r="26"
                      fill="#0a0a0a"
                      stroke={
                        isConnectSource
                          ? '#38bdf8'
                          : isSelected
                          ? '#f59e0b'
                          : isSecondary
                          ? '#ec4899'
                          : catCfg.color
                      }
                      strokeWidth={isSelected || isSecondary ? 3 : 1.8}
                      className="transition-all drop-shadow-md"
                    />

                    {/* Node Center Icon */}
                    <foreignObject x="-10" y="-10" width="20" height="20">
                      <div className="w-full h-full flex items-center justify-center text-amber-400">
                        <Icon className="w-4 h-4" style={{ color: catCfg.color }} />
                      </div>
                    </foreignObject>

                    {/* Node Title Badge below */}
                    <g transform="translate(0, 36)">
                      <rect
                        x={-Math.max(45, node.label.length * 4)}
                        y="-10"
                        width={Math.max(90, node.label.length * 8)}
                        height="22"
                        rx="6"
                        fill="#171717"
                        stroke={isSelected ? '#f59e0b' : '#333333'}
                        strokeWidth={isSelected ? 1.5 : 1}
                        className="transition-colors"
                      />
                      <text
                        textAnchor="middle"
                        y="5"
                        fontSize="11"
                        fontWeight={isSelected ? 'bold' : '500'}
                        fill={isSelected ? '#ffffff' : '#e5e5e5'}
                        fontFamily="sans-serif"
                      >
                        {node.label}
                      </text>
                    </g>

                    {/* Geographic Tag if in places mode */}
                    {node.placeName && (
                      <g transform="translate(0, 56)">
                        <text
                          textAnchor="middle"
                          fontSize="9"
                          fill="#ec4899"
                          fontFamily="sans-serif"
                        >
                          📍 {node.placeName}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Floating Zoom & Canvas Controls */}
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1 bg-neutral-900/90 border border-neutral-800 p-1 rounded-xl shadow-xl backdrop-blur-md text-xs">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.5, z * 1.2))}
              className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.4, z / 1.2))}
              className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Reset view & center"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <div className="px-2 py-0.5 font-mono text-[11px] text-neutral-400 border-l border-neutral-800">
              {Math.round(zoom * 100)}%
            </div>
          </div>

          {/* Floating Minimap & Viewport Radar */}
          <div className="hidden sm:block absolute bottom-4 right-4 z-10 w-36 h-24 bg-neutral-900/90 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl p-1 pointer-events-none">
            <div className="relative w-full h-full bg-neutral-950 rounded-lg overflow-hidden flex items-center justify-center">
              <span className="absolute top-1 left-1.5 text-[8px] font-mono text-neutral-500 uppercase">
                Minimap
              </span>
              {mapData.nodes.map((n) => (
                <div
                  key={n.id}
                  className="absolute w-1.5 h-1.5 rounded-full bg-amber-400"
                  style={{
                    left: `${(n.x / 800) * 100}%`,
                    top: `${(n.y / 480) * 100}%`,
                  }}
                />
              ))}
              {/* Viewport Box */}
              <div
                className="absolute border border-amber-500/60 bg-amber-500/10"
                style={{
                  width: `${Math.min(100, (1 / zoom) * 80)}%`,
                  height: `${Math.min(100, (1 / zoom) * 80)}%`,
                }}
              />
            </div>
          </div>

          {/* Add Custom Node Form Floating Overlay */}
          {isAddingNode && (
            <div className="absolute top-4 left-4 z-20 w-80 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  Add Custom Node
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNode(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomNode} className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Concept Title</label>
                  <input
                    type="text"
                    required
                    value={newNodeLabel}
                    onChange={(e) => setNewNodeLabel(e.target.value)}
                    placeholder="e.g. Distributed Consensus"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-200 placeholder-neutral-500 focus:outline-hidden focus:border-amber-500/60"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Category</label>
                  <select
                    value={newNodeCategory}
                    onChange={(e) => setNewNodeCategory(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-hidden"
                  >
                    <option value="core">Core Concept</option>
                    <option value="code">Code & Tech</option>
                    <option value="research">Research & Logic</option>
                    <option value="action">Action Item</option>
                    <option value="creative">Creative Idea</option>
                    <option value="location">Geographic Place</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Summary / Note</label>
                  <textarea
                    rows={2}
                    value={newNodeDesc}
                    onChange={(e) => setNewNodeDesc(e.target.value)}
                    placeholder="Key rationale, idea, or takeaway..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-200 placeholder-neutral-500 focus:outline-hidden resize-none"
                  />
                </div>

                {mapData.viewMode === 'places' && (
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Place / City</label>
                    <input
                      type="text"
                      value={newNodePlace}
                      onChange={(e) => setNewNodePlace(e.target.value)}
                      placeholder="e.g. Kyoto, Japan"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-200 placeholder-neutral-500 focus:outline-hidden"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingNode(false)}
                    className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold"
                  >
                    Create Node
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Node Inspector Drawer */}
          {selectedNode && (
            <div className="absolute top-4 right-4 z-20 w-80 max-h-[85%] bg-neutral-900/95 border border-neutral-800 rounded-2xl shadow-2xl p-4 overflow-y-auto space-y-4 backdrop-blur-md animate-in fade-in slide-in-from-right-4">
              {/* Drawer Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${CATEGORY_CONFIG[selectedNode.category]?.color}20`,
                        color: CATEGORY_CONFIG[selectedNode.category]?.color,
                        border: `1px solid ${CATEGORY_CONFIG[selectedNode.category]?.color}40`,
                      }}
                    >
                      {CATEGORY_CONFIG[selectedNode.category]?.label || selectedNode.category}
                    </span>
                    {selectedNode.placeName && (
                      <span className="text-[10px] text-pink-400 font-mono">
                        📍 {selectedNode.placeName}
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-bold text-white tracking-tight break-words">
                    {selectedNode.label}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(null)}
                  className="p-1 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Description */}
              {selectedNode.description && (
                <div className="text-xs text-neutral-300 leading-relaxed bg-neutral-950/70 p-3 rounded-xl border border-neutral-800/80">
                  {selectedNode.description}
                </div>
              )}

              {/* Geographic Coordinates & Waypoint Distance Feature */}
              {distanceInfo && selectedNode && secondarySelectedNode && (
                <div className="p-3 rounded-xl bg-pink-950/30 border border-pink-500/30 text-xs text-pink-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-pink-300">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Flight Distance Telemetry</span>
                  </div>
                  <p className="text-[11px] text-neutral-300">
                    Between <strong className="text-white">{selectedNode.label}</strong> and{' '}
                    <strong className="text-white">{secondarySelectedNode.label}</strong>:
                  </p>
                  <div className="font-mono text-sm font-bold text-pink-400">
                    {distanceInfo.km.toLocaleString()} km ({distanceInfo.miles.toLocaleString()} mi)
                  </div>
                </div>
              )}

              {/* Deep Notes */}
              {selectedNode.notes && (
                <div className="space-y-1 text-xs">
                  <span className="font-semibold text-neutral-400 text-[11px] uppercase tracking-wider">
                    Context & Detail
                  </span>
                  <p className="text-neutral-300 leading-relaxed text-xs">{selectedNode.notes}</p>
                </div>
              )}

              {/* Connected Links Summary */}
              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-neutral-400 text-[11px] uppercase tracking-wider">
                  Connected Branches ({
                    mapData.links.filter(
                      (l) => l.source === selectedNode.id || l.target === selectedNode.id
                    ).length
                  })
                </span>
                <div className="space-y-1">
                  {mapData.links
                    .filter((l) => l.source === selectedNode.id || l.target === selectedNode.id)
                    .map((l) => {
                      const otherId = l.source === selectedNode.id ? l.target : l.source;
                      const otherNode = mapData.nodes.find((n) => n.id === otherId);
                      return (
                        <div
                          key={l.id}
                          onClick={() => setSelectedNodeId(otherId)}
                          className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-amber-400 font-mono text-[10px]">
                              {l.label || 'connected'}
                            </span>
                            <span className="text-neutral-200 text-xs truncate">
                              {otherNode?.label || otherId}
                            </span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Actions Footer in Drawer */}
              <div className="pt-2 border-t border-neutral-800 space-y-2">
                {/* Expand Node with AI */}
                <button
                  type="button"
                  disabled={isExpanding}
                  onClick={() => handleExpandNode(selectedNode)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/40 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-purple-400 ${isExpanding ? 'animate-spin' : ''}`} />
                  <span>{isExpanding ? 'Expanding Branch...' : '⚡ Expand Node with Bolex AI'}</span>
                </button>

                {/* Send / Ask Bolex in Chat */}
                <button
                  type="button"
                  onClick={() =>
                    handleAskBolex(
                      `Deep dive into "${selectedNode.label}": ${selectedNode.description || selectedNode.notes || ''}. Provide detailed insights and concrete steps.`
                    )
                  }
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>💬 Ask Bolex in Active Chat</span>
                </button>

                {/* Delete Node */}
                <button
                  type="button"
                  onClick={() => handleDeleteNode(selectedNode.id)}
                  className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 text-xs transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Node</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
