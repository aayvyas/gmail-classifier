# 📧 Local Gmail Classifier with AI

> **Classify your Gmail inbox using a local LLM (Llama 3, Gemma, etc.) - 100% Privacy-Focused.**

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)

This project automates email organization by fetching unread emails from your Gmail, analyzing them with a **locally running Large Language Model (LLM)**, and applying granular labels automatically. No email data leaves your machine for classification!

## ✨ Features

*   **🔒 Privacy First**: Uses a local LLM server (e.g., via `llama.cpp` or Ollama). Your emails are not sent to OpenAI or Anthropic.
*   **🏷️ Granular Classification**: Automatically categorizes emails into:
    *   `bank-alert`, `finance`, `payments`
    *   `job-application`, `interview`, `coding-assessment`
    *   `newsletter`, `promotions`, `spam`
    *   `social`, `travel`, `shopping`
    *   ...and more!
*   **🤖 Smart & Context-Aware**: Uses the email subject, snippet, and body to determine the best label.
*   **⏱️ Automated**: Runs as a background cron job (default: every 5 minutes).
*   **🛠️ Easy Management**: Includes a CLI helper to start/stop/monitor the service.

## 🚀 Prerequisites

1.  **Node.js**: v18 or higher.
2.  **Local LLM Server**:
    *   You need an LLM running locally that accepts OpenAI-compatible requests.
    *   Default URL: `http://localhost:12434/engines/llama.cpp/v1`
    *   *Tip: You can use [Ollama](https://ollama.com/) or [LocalAI](https://localai.io/). If using Ollama, you might need a proxy or ensure it exposes the OpenAI compatible endpoint.*
3.  **Google Cloud Project**:
    *   Enable the **Gmail API**.
    *   Create **OAuth 2.0 Desktop App** credentials.
    *   Download the `credentials.json` file.

## 🛠️ Installation & Setup
### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/gmail-classifier.git
cd gmail-classifier
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables (Required)
Create a `.env` file in the project root based on the example:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```ini
# LLM Configuration
LLM_BASE_URL=http://localhost:12434/engines/llama.cpp/v1
LLM_API_KEY=sk-local-key
LLM_MODEL=ai/gemma3

# Cron Schedule (Default: Every 5 minutes)
CRON_SCHEDULE=*/5 * * * *
```

**Note:** The application will fail to start if `LLM_BASE_URL` or `LLM_MODEL` are missing.

### 4. Configure Credentials
Place your downloaded `credentials.json` file in the root directory of the project.
```bash
# It should look like this
ls -F
credentials.json  .env  package.json  src/ ...
```

## 🏃‍♂️ Usage

### First Run (Authentication)
The first time you run the app, it will open your browser to authenticate with Google.
```bash
npx ts-node src/index.ts
```

### Running as a Service (Recommended)
We provide a handy zsh helper script to manage the classifier as a background service.

1.  **Add to your shell**:
    Add the following to your `~/.zshrc` (or `~/.bashrc`):
    ```bash
    # Optional: Set custom project path if not in default location
    # export GMAIL_CLASSIFIER_DIR="/path/to/gmail-classifier"
    
    source /path/to/gmail-classifier/service.zsh
    ```

2.  **Reload shell**:
    ```bash
    source ~/.zshrc
    ```

3.  **Commands**:
    ```bash
    gmail-classifier start   # 🚀 Start the background service
    gmail-classifier status  # 🔍 Check if running
    gmail-classifier log     # 📄 View real-time logs
    gmail-classifier stop    # 🛑 Stop the service
    ```

## ⚙️ Customization

### Modifying Labels
Edit `src/prompts.ts` to add or remove categories. The system will automatically create new labels in Gmail if they don't exist.

```typescript
export const getLabels = (): string[] => {
  return [
    "urgent",
    "family",
    // ... add your own
  ];
};
```

### Adjusting the Prompt
You can tweak the system prompt in `src/prompts.ts` to better suit your specific needs or to give the LLM more context about how you like things filed.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the `package.json` file for details.
