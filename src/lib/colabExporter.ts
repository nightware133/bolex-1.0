/**
 * Google Colab & Jupyter Notebook Generator
 * Converts chat code blocks and AI pipelines into production-grade .ipynb notebooks
 * ready for execution on Google Colab with free T4 GPUs and TPUs.
 */

export interface NotebookCell {
  type: 'code' | 'markdown';
  content: string;
}

export interface ColabTemplate {
  id: string;
  title: string;
  category: 'ml_gpu' | 'genai' | 'data_viz' | 'automation';
  description: string;
  hardware: 'T4 GPU' | 'TPU' | 'Standard CPU';
  packages: string[];
  cells: NotebookCell[];
}

export const COLAB_TEMPLATES: ColabTemplate[] = [
  {
    id: 'gemini-agent',
    title: 'Gemini 3.8 & Bolex Cloud Agent',
    category: 'genai',
    description: 'Connect to Google GenAI SDK with streaming, multimodal vision, and function calling on Google Colab.',
    hardware: 'Standard CPU',
    packages: ['google-genai', 'pillow', 'requests'],
    cells: [
      {
        type: 'markdown',
        content: `# 🚀 Bolex AI Cloud Agent (Gemini 3.8 Flash)
This notebook runs the official **@google/genai** SDK on Google Colab.
Get your free API key from [Google AI Studio](https://aistudio.google.com/).`,
      },
      {
        type: 'code',
        content: `!pip install -q -U google-genai pillow requests`,
      },
      {
        type: 'code',
        content: `import os
from google import genai
from google.colab import userdata

# Retrieve your key securely from Colab Secrets (Left sidebar > Key icon)
# Or set it directly: os.environ["GEMINI_API_KEY"] = "your_key_here"
api_key = userdata.get('GEMINI_API_KEY') if 'GEMINI_API_KEY' in userdata else os.environ.get("GEMINI_API_KEY")

client = genai.Client(api_key=api_key)

# Generate high-speed streaming response
response = client.models.generate_content_stream(
    model="gemini-3.8-flash",
    contents="Explain how quantum entanglement enables quantum key distribution (QKD) cryptography.",
)

print("⚡ Streaming response from Gemini 3.8:")
for chunk in response:
    print(chunk.text, end="")`,
      },
    ],
  },
  {
    id: 'pytorch-gpu',
    title: 'PyTorch Deep Learning & GPU Benchmark',
    category: 'ml_gpu',
    description: 'Harness free NVIDIA Tesla T4/A100 GPUs on Google Colab to train neural networks and benchmark tensor speed.',
    hardware: 'T4 GPU',
    packages: ['torch', 'torchvision', 'matplotlib', 'numpy'],
    cells: [
      {
        type: 'markdown',
        content: `# ⚡ PyTorch GPU Acceleration & Deep Learning on Google Colab
Make sure hardware acceleration is set to **GPU**:
*Runtime > Change runtime type > Hardware accelerator > T4 GPU*`,
      },
      {
        type: 'code',
        content: `import torch
import time

print(f"PyTorch Version: {torch.__version__}")
gpu_available = torch.cuda.is_available()
print(f"CUDA Available: {gpu_available}")

if gpu_available:
    device_name = torch.cuda.get_device_name(0)
    print(f"GPU Device: {device_name}")
    print(f"Memory Allocated: {torch.cuda.memory_allocated(0)/(1024**2):.2f} MB")
else:
    print("Running on CPU. Switch to GPU under Runtime > Change runtime type!")`,
      },
      {
        type: 'code',
        content: `# Tensor Multiplication Benchmark (CPU vs GPU)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
size = 6000

print(f"Creating {size}x{size} matrices on {device}...")
A = torch.randn(size, size, device=device)
B = torch.randn(size, size, device=device)

start = time.time()
C = torch.matmul(A, B)
if torch.cuda.is_available():
    torch.cuda.synchronize()
elapsed = time.time() - start

print(f"Matrix multiplication completed in {elapsed:.4f} seconds on {device}!")`,
      },
    ],
  },
  {
    id: 'data-science',
    title: 'Data Science & Interactive Seaborn Visuals',
    category: 'data_viz',
    description: 'Clean datasets, compute statistical summaries, and render publication-quality visual plots.',
    hardware: 'Standard CPU',
    packages: ['pandas', 'numpy', 'matplotlib', 'seaborn'],
    cells: [
      {
        type: 'markdown',
        content: `# 📊 High-Performance Data Analysis & Visualization
Analyze distributions, correlations, and statistical modeling with Pandas and Seaborn.`,
      },
      {
        type: 'code',
        content: `!pip install -q pandas numpy matplotlib seaborn`,
      },
      {
        type: 'code',
        content: `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Generate rich simulated dataset
np.random.seed(42)
n_samples = 500

df = pd.DataFrame({
    'latency_ms': np.random.exponential(scale=45, size=n_samples) + 15,
    'throughput_qps': np.random.normal(loc=120, scale=25, size=n_samples).clip(10, 200),
    'accuracy_score': np.random.beta(a=8, b=2, size=n_samples),
    'model_tier': np.random.choice(['Bolex Free', 'Bolex Plus', 'Bolex Ultra', 'Bolex Quantum'], size=n_samples, p=[0.4, 0.3, 0.2, 0.1])
})

print("Dataset Summary:")
print(df.describe())

# Plot Correlation Matrix and Distribution
plt.figure(figsize=(10, 4))
plt.subplot(1, 2, 1)
sns.boxplot(x='model_tier', y='latency_ms', data=df, palette='viridis')
plt.title('Latency Distribution by Model Tier')

plt.subplot(1, 2, 2)
sns.scatterplot(x='throughput_qps', y='accuracy_score', hue='model_tier', data=df, palette='magma')
plt.title('Throughput vs Accuracy')

plt.tight_layout()
plt.show()`,
      },
    ],
  },
  {
    id: 'web-scraping',
    title: 'Web Scraping & Real-Time Data Pipeline',
    category: 'automation',
    description: 'Scrape, parse, and export structured live internet data to Google Drive or CSV.',
    hardware: 'Standard CPU',
    packages: ['requests', 'beautifulsoup4', 'pandas'],
    cells: [
      {
        type: 'markdown',
        content: `# 🌐 Live Web Scraping & Structured Extraction Pipeline
Extract real-time web content and save results cleanly to Google Drive or CSV.`,
      },
      {
        type: 'code',
        content: `!pip install -q requests beautifulsoup4 pandas`,
      },
      {
        type: 'code',
        content: `import requests
from bs4 import BeautifulSoup
import pandas as pd

url = "https://news.ycombinator.com/"
headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

response = requests.get(url, headers=headers)
soup = BeautifulSoup(response.text, "html.parser")

articles = []
for item in soup.select(".athing"):
    title_elem = item.select_one(".titleline a")
    if title_elem:
        title = title_elem.text
        link = title_elem.get("href", "")
        articles.append({"title": title, "url": link})

df_news = pd.DataFrame(articles)
print(f"Extracted {len(df_news)} stories:")
print(df_news.head(10))

# Export to CSV
df_news.to_csv("extracted_stories.csv", index=False)
print("Saved to extracted_stories.csv!")`,
      },
    ],
  },
];

/**
 * Builds valid Jupyter Notebook format (.ipynb) compatible with Google Colab.
 */
export function createJupyterNotebook(
  cells: NotebookCell[],
  notebookName = 'Bolex_Notebook'
): string {
  const nbCells = cells.map((cell) => {
    const rawLines = cell.content.split('\n');
    const formattedLines = rawLines.map((line, idx) =>
      idx < rawLines.length - 1 ? line + '\n' : line
    );

    if (cell.type === 'markdown') {
      return {
        cell_type: 'markdown',
        metadata: {},
        source: formattedLines,
      };
    }

    return {
      cell_type: 'code',
      execution_count: null,
      metadata: {},
      outputs: [],
      source: formattedLines,
    };
  });

  return JSON.stringify(
    {
      cells: nbCells,
      metadata: {
        colab: {
          name: `${notebookName}.ipynb`,
          provenance: [],
          toc_visible: true,
          gpuType: 'T4',
        },
        kernelspec: {
          display_name: 'Python 3',
          name: 'python3',
        },
        language_info: {
          name: 'python',
        },
        accelerator: 'GPU',
      },
      nbformat: 4,
      nbformat_minor: 0,
    },
    null,
    2
  );
}

/**
 * Downloads a generated .ipynb notebook file directly to the user's computer.
 */
export function downloadNotebook(
  content: string,
  filename = 'bolex_colab_notebook.ipynb'
): void {
  const cleanFilename = filename.endsWith('.ipynb') ? filename : `${filename}.ipynb`;
  const blob = new Blob([content], { type: 'application/x-ipynb+json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = cleanFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Packages a raw code string into a ready-to-run Google Colab Notebook and downloads it.
 */
export function exportCodeToColab(
  code: string,
  language = 'python',
  title = 'Bolex_Colab_Notebook'
): void {
  const isPython = ['python', 'py', ''].includes(language.toLowerCase());

  const cells: NotebookCell[] = [
    {
      type: 'markdown',
      content: `# 🚀 ${title}
Generated by **Bolex AI Assistant**.
Ready to run on **Google Colab** with hardware acceleration (GPU / TPU).

### Quick Steps:
1. Connect a runtime (Click **Connect** in the top right).
2. For GPU acceleration: **Runtime > Change runtime type > T4 GPU**.
3. Press **Shift + Enter** on each cell to execute.`,
    },
  ];

  // If shell/bash script, prepend ! or %%bash
  if (['bash', 'sh', 'shell'].includes(language.toLowerCase())) {
    cells.push({
      type: 'code',
      content: `%%bash\n${code}`,
    });
  } else if (!isPython) {
    cells.push({
      type: 'markdown',
      content: `### Source Code (${language})\n\`\`\`${language}\n${code}\n\`\`\``,
    });
  } else {
    // Detect common pip packages from imports
    const detectedPackages: string[] = [];
    if (/import (torch|torchvision)/.test(code)) detectedPackages.push('torch torchvision');
    if (/import (numpy|np)/.test(code)) detectedPackages.push('numpy');
    if (/import (pandas|pd)/.test(code)) detectedPackages.push('pandas');
    if (/import (matplotlib|plt)/.test(code)) detectedPackages.push('matplotlib');
    if (/import (seaborn|sns)/.test(code)) detectedPackages.push('seaborn');
    if (/from google import genai|import google\.genai/.test(code)) detectedPackages.push('google-genai');
    if (/import requests/.test(code)) detectedPackages.push('requests');
    if (/from bs4 import BeautifulSoup/.test(code)) detectedPackages.push('beautifulsoup4');
    if (/import (sklearn|scipy)/.test(code)) detectedPackages.push('scikit-learn scipy');
    if (/import transformers/.test(code)) detectedPackages.push('transformers accelerate');

    if (detectedPackages.length > 0) {
      cells.push({
        type: 'code',
        content: `!pip install -q ${detectedPackages.join(' ')}`,
      });
    }

    cells.push({
      type: 'code',
      content: code,
    });
  }

  const notebookJson = createJupyterNotebook(cells, title);
  downloadNotebook(notebookJson, `${title.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.ipynb`);
}
