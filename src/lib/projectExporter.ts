import JSZip from 'jszip';

export interface ExportProgressCallback {
  (progress: { percent: number; message: string }): void;
}

export async function generateProjectZip(onProgress?: ExportProgressCallback): Promise<Blob> {
  const zip = new JSZip();

  if (onProgress) onProgress({ percent: 10, message: 'Collecting project configurations...' });

  // 1. Root configuration files
  zip.file(
    'package.json',
    JSON.stringify(
      {
        name: 'bolex-ai-assistant',
        private: true,
        version: '1.0.0',
        type: 'module',
        scripts: {
          dev: 'tsx server.ts',
          build: 'vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs',
          start: 'node dist/server.cjs',
          preview: 'vite preview',
          lint: 'tsc --noEmit',
        },
        dependencies: {
          '@google/genai': '^2.4.0',
          '@tailwindcss/vite': '^4.1.14',
          '@vitejs/plugin-react': '^5.0.4',
          dotenv: '^17.2.3',
          express: '^4.21.2',
          firebase: '^12.19.0',
          'lucide-react': '^0.546.0',
          motion: '^12.23.24',
          react: '^19.0.1',
          'react-dom': '^19.0.1',
          'react-markdown': '^10.1.0',
          recharts: '^3.10.1',
          vite: '^6.2.3',
          jszip: '^3.10.1',
        },
        devDependencies: {
          '@types/node': '^22.14.0',
          '@types/express': '^4.17.21',
          '@types/jszip': '^3.4.1',
          autoprefixer: '^10.4.21',
          esbuild: '^0.25.0',
          tailwindcss: '^4.1.14',
          tsx: '^4.21.0',
          typescript: '~5.8.2',
        },
      },
      null,
      2
    )
  );

  zip.file(
    'tsconfig.json',
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          useDefineForClassFields: true,
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: false,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true,
        },
        include: ['src', 'server.ts'],
      },
      null,
      2
    )
  );

  zip.file(
    'vite.config.ts',
    `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
`
  );

  zip.file(
    '.env.example',
    `# Bolex AI Environment Variables
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
`
  );

  zip.file(
    '.gitignore',
    `node_modules
dist
.env
.DS_Store
`
  );

  zip.file(
    'README.md',
    `# Bolex AI Assistant — Advanced AI Workstation

Built by **Tayden Simon** (Founder) • **Bolex Systems / Bolex Labs**

An elite AI workstation featuring real-time Cognitive Trace internal chain-of-thought, Project Memory Vault (Contextual Anchors), Web Speech Voice Studio, Multimodal Vision, and Interactive Map Studio.

---

## 🚀 Quick Start on Any Computer

### 1. Install Dependencies
Make sure you have [Node.js (v18+)](https://nodejs.org/) installed:
\`\`\`bash
npm install
\`\`\`

### 2. Set Up Your API Key (Optional for Local AI Features)
Create a \`.env\` file in the root directory:
\`\`\`bash
GEMINI_API_KEY=your_gemini_api_key
\`\`\`

### 3. Run the Development Server
\`\`\`bash
npm run dev
\`\`\`
Open [http://localhost:3000](http://localhost:3000) in your browser!

---

## 🌐 Deploying to Free Public Web Hosting (Zero Auth Redirects)

### Option A: Deploy to Vercel (Recommended • 1-Click)
1. Push this folder to your GitHub repository (or use the [Vercel CLI](https://vercel.com/cli)).
2. Import the repository in [Vercel](https://vercel.com/new).
3. Set your \`GEMINI_API_KEY\` in Environment Variables.
4. Click **Deploy**. Your permanent public URL (e.g. \`https://bolex-ai.vercel.app\`) is live!

### Option B: Deploy to Netlify
1. Drag and drop the \`dist\` folder (generated via \`npm run build\`) directly into [Netlify Drop](https://app.netlify.com/drop).
2. Your public link is created instantly.

### Option C: Deploy to Firebase Hosting
\`\`\`bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy --only hosting
\`\`\`
`
  );

  if (onProgress) onProgress({ percent: 30, message: 'Packing source code and components...' });

  // List of known source files to fetch and include in zip
  const filesToFetch = [
    'index.html',
    'server.ts',
    'src/main.tsx',
    'src/App.tsx',
    'src/index.css',
    'src/types.ts',
    'src/constants.ts',
    'src/context/AuthContext.tsx',
    'src/context/ThemeContext.tsx',
    'src/lib/firebase.ts',
    'src/lib/founder.ts',
    'src/lib/anchors.ts',
    'src/lib/mapEngine.ts',
    'src/lib/speech.ts',
    'src/lib/speechManager.ts',
    'src/lib/summarizer.ts',
    'src/lib/tokenCounter.ts',
    'src/lib/tokenUsage.ts',
    'src/lib/projectExporter.ts',
    'src/components/Header.tsx',
    'src/components/Sidebar.tsx',
    'src/components/ChatInput.tsx',
    'src/components/MessageItem.tsx',
    'src/components/EmptyState.tsx',
    'src/components/AuthModal.tsx',
    'src/components/BolexPlusModal.tsx',
    'src/components/CheckoutModal.tsx',
    'src/components/CognitiveTrace.tsx',
    'src/components/ContextualAnchorsModal.tsx',
    'src/components/ExtensionModal.tsx',
    'src/components/FounderAdminModal.tsx',
    'src/components/GiveawayModal.tsx',
    'src/components/GlobalAnnouncementBanner.tsx',
    'src/components/KeyboardShortcutsModal.tsx',
    'src/components/MapStudioModal.tsx',
    'src/components/MarkdownRenderer.tsx',
    'src/components/PeopleSearchModal.tsx',
    'src/components/RoleModal.tsx',
    'src/components/SettingsModal.tsx',
    'src/components/ShareModal.tsx',
    'src/components/TokenIndicator.tsx',
    'src/components/TokenUsageAnalytics.tsx',
    'src/components/UserProfileModal.tsx',
  ];

  let completedCount = 0;
  for (const filePath of filesToFetch) {
    try {
      const response = await fetch(`/${filePath}`);
      if (response.ok) {
        const text = await response.text();
        zip.file(filePath, text);
      }
    } catch {
      // If fetching via relative URL fails in browser preview, zip can continue
    }
    completedCount++;
    if (onProgress) {
      const pct = 30 + Math.round((completedCount / filesToFetch.length) * 50);
      onProgress({ percent: pct, message: `Archiving ${filePath}...` });
    }
  }

  if (onProgress) onProgress({ percent: 90, message: 'Compressing archive...' });
  const blob = await zip.generateAsync({ type: 'blob' });
  if (onProgress) onProgress({ percent: 100, message: 'Ready to download!' });

  return blob;
}

export function downloadBlob(blob: Blob, filename: string = 'bolex-ai-project.zip') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
