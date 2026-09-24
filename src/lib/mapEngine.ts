import { MapNode, MapLink, MapData, ChatMessage } from '../types';

export const CATEGORY_CONFIG: Record<
  MapNode['category'],
  { label: string; color: string; border: string; bg: string; text: string; icon: string }
> = {
  core: {
    label: 'Core Concept',
    color: '#f59e0b',
    border: 'border-amber-500/80',
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    icon: 'Sparkles',
  },
  code: {
    label: 'Code & Tech',
    color: '#38bdf8',
    border: 'border-sky-500/80',
    bg: 'bg-sky-500/15',
    text: 'text-sky-300',
    icon: 'Terminal',
  },
  research: {
    label: 'Research & Logic',
    color: '#a855f7',
    border: 'border-purple-500/80',
    bg: 'bg-purple-500/15',
    text: 'text-purple-300',
    icon: 'Brain',
  },
  action: {
    label: 'Action Item',
    color: '#10b981',
    border: 'border-emerald-500/80',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    icon: 'CheckCircle2',
  },
  location: {
    label: 'Geo & Location',
    color: '#ec4899',
    border: 'border-pink-500/80',
    bg: 'bg-pink-500/15',
    text: 'text-pink-300',
    icon: 'MapPin',
  },
  creative: {
    label: 'Creative Idea',
    color: '#f97316',
    border: 'border-orange-500/80',
    bg: 'bg-orange-500/15',
    text: 'text-orange-300',
    icon: 'Lightbulb',
  },
};

// Initial default Knowledge Map
export function getDefaultKnowledgeMap(topic = 'Bolex Intelligent Core'): MapData {
  const nodes: MapNode[] = [
    {
      id: 'core-1',
      label: topic,
      description: 'Central intelligence hub synthesizing knowledge, code, and multimodal tasks.',
      category: 'core',
      x: 400,
      y: 260,
      notes: 'Root node for active inquiry and context flow.',
    },
    {
      id: 'node-tech-1',
      label: 'Deep Reasoning Engine',
      description: 'Multi-step analytical logic, chain-of-thought, and architecture synthesis.',
      category: 'code',
      x: 180,
      y: 130,
      notes: 'High-throughput token streaming and structured parsing.',
    },
    {
      id: 'node-research-1',
      label: 'Web Grounding & Intel',
      description: 'Real-time verified web citations and up-to-date factual synthesis.',
      category: 'research',
      x: 620,
      y: 130,
      notes: 'Live Google Search indexing integration.',
    },
    {
      id: 'node-creative-1',
      label: 'Creative Ideation',
      description: 'Brainstorming lateral solutions, design concepts, and narrative generation.',
      category: 'creative',
      x: 180,
      y: 390,
      notes: 'Adaptive tone and expansive thinking.',
    },
    {
      id: 'node-action-1',
      label: 'Execution & Tooling',
      description: 'Actionable plans, code execution frameworks, and step-by-step roadmaps.',
      category: 'action',
      x: 620,
      y: 390,
      notes: 'Direct problem resolution with zero fluff.',
    },
    {
      id: 'node-voice-1',
      label: 'Web Speech Synthesis',
      description: 'Voice dictation and audio narration engine with variable speeds.',
      category: 'code',
      x: 400,
      y: 470,
      notes: 'Continuous hands-free interaction.',
    },
  ];

  const links: MapLink[] = [
    { id: 'l1', source: 'core-1', target: 'node-tech-1', label: 'powers' },
    { id: 'l2', source: 'core-1', target: 'node-research-1', label: 'queries' },
    { id: 'l3', source: 'core-1', target: 'node-creative-1', label: 'inspires' },
    { id: 'l4', source: 'core-1', target: 'node-action-1', label: 'executes' },
    { id: 'l5', source: 'core-1', target: 'node-voice-1', label: 'narrates' },
    { id: 'l6', source: 'node-tech-1', target: 'node-action-1', label: 'builds' },
  ];

  return { nodes, links, viewMode: 'knowledge' };
}

// Initial default Places Map (Geographic Mode)
export function getDefaultPlacesMap(): MapData {
  const nodes: MapNode[] = [
    {
      id: 'geo-1',
      label: 'Silicon Valley Hub',
      placeName: 'San Francisco & Bay Area, CA',
      description: 'Global tech epicenter for AI innovation, venture capital, and startups.',
      category: 'location',
      lat: 37.7749,
      lng: -122.4194,
      x: 180,
      y: 190,
      notes: 'HQ for advanced neural computing and generative models.',
    },
    {
      id: 'geo-2',
      label: 'Silicon Roundabout',
      placeName: 'London, United Kingdom',
      description: 'European AI research capital and leading international tech ecosystem.',
      category: 'location',
      lat: 51.5074,
      lng: -0.1278,
      x: 450,
      y: 150,
      notes: 'DeepMind hub and algorithmic research center.',
    },
    {
      id: 'geo-3',
      label: 'Tokyo Tech Corridor',
      placeName: 'Tokyo, Japan',
      description: 'Robotics, hardware synergy, and next-gen semiconductor engineering.',
      category: 'location',
      lat: 35.6762,
      lng: 139.6503,
      x: 680,
      y: 200,
      notes: 'Pioneering humanoid robotics and quantum optics.',
    },
    {
      id: 'geo-4',
      label: 'Bengaluru Silicon Plateau',
      placeName: 'Bengaluru, India',
      description: 'Dynamic engineering powerhouse and rapid software scalability capital.',
      category: 'location',
      lat: 12.9716,
      lng: 77.5946,
      x: 580,
      y: 290,
      notes: 'High-growth engineering and developer talent.',
    },
    {
      id: 'geo-5',
      label: 'Zürich AI Valley',
      placeName: 'Zürich, Switzerland',
      description: 'ETH research ecosystem, precision engineering, and privacy systems.',
      category: 'location',
      lat: 47.3769,
      lng: 8.5417,
      x: 470,
      y: 175,
      notes: 'Top tier AI systems & cryptographic safety.',
    },
  ];

  const links: MapLink[] = [
    { id: 'gl-1', source: 'geo-1', target: 'geo-2', label: 'Transatlantic Bridge' },
    { id: 'gl-2', source: 'geo-2', target: 'geo-5', label: 'European Corridor' },
    { id: 'gl-3', source: 'geo-2', target: 'geo-4', label: 'Ecosystem Exchange' },
    { id: 'gl-4', source: 'geo-1', target: 'geo-3', label: 'Pacific Tech Corridor' },
    { id: 'gl-5', source: 'geo-4', target: 'geo-3', label: 'Asian Hub Link' },
  ];

  return { nodes, links, viewMode: 'places' };
}

// Convert geographic coordinates (lat/lng) to canvas X/Y on equirectangular projection
export function geoToCanvas(lat: number, lng: number, width = 800, height = 480): { x: number; y: number } {
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return {
    x: Math.max(40, Math.min(width - 40, x)),
    y: Math.max(40, Math.min(height - 40, y)),
  };
}

// Calculate distance between two lat/lng points using Haversine formula (in km)
export function calculateGeoDistance(lat1: number, lon1: number, lat2: number, lon2: number): { km: number; miles: number } {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = Math.round(R * c);
  const miles = Math.round(km * 0.621371);
  return { km, miles };
}

// Heuristic extractor for creating map from messages if offline
export function extractMapFromMessages(messages: ChatMessage[], sessionTitle = 'Exploration'): MapData {
  const lastMessages = messages.slice(-4);
  const fullText = lastMessages.map((m) => m.content).join('\n');

  const nodes: MapNode[] = [
    {
      id: 'root-node',
      label: sessionTitle || 'Core Focus',
      description: 'Primary inquiry topic and conversation context.',
      category: 'core',
      x: 400,
      y: 250,
      notes: 'Synthesized from active discussion.',
    },
  ];

  const links: MapLink[] = [];

  // Extract key sentences / topics / headings
  const lines = fullText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('#') || l.startsWith('*') || l.startsWith('-') || l.length > 20);

  const categories: MapNode['category'][] = ['code', 'research', 'action', 'creative', 'location'];

  const angles = [0, 45, 90, 135, 180, 225, 270, 315];
  const radius = 180;

  const count = Math.min(6, Math.max(3, lines.length));

  for (let i = 0; i < count; i++) {
    const raw = lines[i] || `Topic Branch ${i + 1}`;
    const clean = raw.replace(/^[#*\-\d.\s]+/, '').slice(0, 40);
    const angle = (angles[i % angles.length] * Math.PI) / 180;
    const x = 400 + Math.cos(angle) * radius;
    const y = 250 + Math.sin(angle) * radius;

    const nodeId = `extracted-${i + 1}`;
    nodes.push({
      id: nodeId,
      label: clean || `Insight ${i + 1}`,
      description: raw.length > 50 ? raw.slice(0, 120) + '...' : 'Extracted conversation node.',
      category: categories[i % categories.length],
      x: Math.round(x),
      y: Math.round(y),
      notes: raw,
    });

    links.push({
      id: `link-root-${i + 1}`,
      source: 'root-node',
      target: nodeId,
      label: i % 2 === 0 ? 'involves' : 'enables',
    });
  }

  return { nodes, links, viewMode: 'knowledge' };
}

// Generate Mermaid flowchart syntax from MapData
export function generateMermaidFromMap(mapData: MapData): string {
  let mermaid = 'graph TD\n';
  mapData.nodes.forEach((n) => {
    const safeLabel = n.label.replace(/"/g, "'");
    mermaid += `  ${n.id.replace(/[^a-zA-Z0-9]/g, '_')}["${safeLabel}"]\n`;
  });

  mapData.links.forEach((l) => {
    const s = l.source.replace(/[^a-zA-Z0-9]/g, '_');
    const t = l.target.replace(/[^a-zA-Z0-9]/g, '_');
    if (l.label) {
      mermaid += `  ${s} -->|${l.label}| ${t}\n`;
    } else {
      mermaid += `  ${s} --> ${t}\n`;
    }
  });

  return mermaid;
}

// Generate Markdown Outline from MapData
export function generateMarkdownFromMap(mapData: MapData): string {
  let md = `# Knowledge Map Outline: ${mapData.nodes[0]?.label || 'Map'}\n\n`;

  mapData.nodes.forEach((n) => {
    md += `### ${n.label} (${CATEGORY_CONFIG[n.category]?.label || n.category})\n`;
    if (n.description) md += `- **Summary**: ${n.description}\n`;
    if (n.placeName) md += `- **Location**: ${n.placeName}\n`;
    if (n.notes) md += `- **Notes**: ${n.notes}\n`;

    // Connected links
    const connected = mapData.links
      .filter((l) => l.source === n.id || l.target === n.id)
      .map((l) => {
        const otherId = l.source === n.id ? l.target : l.source;
        const otherNode = mapData.nodes.find((x) => x.id === otherId);
        return `${l.label ? `[${l.label}] ` : ''}${otherNode?.label || otherId}`;
      });

    if (connected.length > 0) {
      md += `- **Connections**: ${connected.join(', ')}\n`;
    }
    md += `\n`;
  });

  return md;
}
