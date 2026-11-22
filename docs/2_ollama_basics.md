# Ollama basics

Ollama runs AI models **on your own computer**. Nothing goes to the internet, except when you download a model.

All commands below are for **cmd** (Command Prompt) on Windows. Type them one at a time.

---

## 1. Install Ollama

**Option A: from the website**

1. Go to **https://ollama.com/download**
2. Click **Download for Windows**
3. Run `OllamaSetup.exe` and click through

**Option B: from cmd**

```
winget install Ollama.Ollama
```

Close cmd and open a new one, then check it worked:

```
ollama -v
```

You should see something like `ollama version is 0.40.16`.

---

## 2. Is Ollama running?

```
curl http://localhost:11434
```

- `Ollama is running` means all good.
- An error means it is off. Wake it up (next step).

## 3. Wake Ollama up

Pick **one**:

- **Easiest:** open the Start menu, type **Ollama**, press Enter. A llama icon appears near the clock.
- **From cmd:**
  ```
  start "" "%LOCALAPPDATA%\Programs\Ollama\ollama app.exe"
  ```
- **Run it in this window:** `ollama serve` (keep this window open; use a second cmd window for everything else).

> If `ollama serve` says *Only one usage of each socket address*, Ollama is **already running**. That is fine.
>
> Tip: most `ollama` commands also wake it up by themselves.

---

## 4. Download the models

### 4a. The models our app uses (keep these)

The app and the notebooks need these. Download them once and **never remove them**.

| Model | Its job in the app | Size | Needed from |
|---|---|---|---|
| `qwen2.5:7b-instruct` | **Analyst**: reads the contract, answers questions | 4.7 GB | Step 1 |
| `nomic-embed-text` | **Embed**: turns text into numbers so we can search by meaning | 274 MB | Step 1 |
| `llama3.1:8b` | **Judge**: grades the analyst's answers | 4.9 GB | Step 4 (evals) |

```
ollama pull qwen2.5:7b-instruct
ollama pull nomic-embed-text
ollama pull llama3.1:8b
```

About 10 GB in total, so use good Wi-Fi. If a model is already downloaded, `pull` just checks it and finishes quickly.

### 4b. A small model for practice (remove it later)

```
ollama pull qwen2.5:0.5b
```

It ends with `success`. It is small (about 400 MB) and fast, so it is good for trying commands. In step 9 we remove it.

Find more models at **https://ollama.com/search**.

## 5. See your models

```
ollama list
```

---

## 6. Ask a question

**One question, one answer:**

```
ollama run qwen2.5:0.5b "In one sentence, what is a contract?"
```

**Chat with it:**

```
ollama run qwen2.5:0.5b
```

Now type your questions and press Enter. Inside the chat:

| Type | What it does |
|---|---|
| `/bye` | Leave the chat |
| `/?` | Show all chat commands |
| `/clear` | Forget the conversation so far |
| `"""` | Start and end a question that is several lines long |

**See how fast it is:** add `--verbose`

```
ollama run qwen2.5:0.5b "Say hello in five words." --verbose
```

Look at `eval rate`: that is the tokens per second.

---

## 7. What is loaded right now?

```
ollama ps
```

- `PROCESSOR` shows `GPU` or `CPU`. GPU is much faster.
- `UNTIL` shows when the model goes to sleep. After **5 minutes** with no questions, Ollama unloads it to free memory. The next question wakes it up, and is a bit slower.

**Put a model to sleep now:**

```
ollama stop qwen2.5:0.5b
```

**Keep a model awake longer** (here, 1 hour):

```
ollama run qwen2.5:0.5b --keepalive 1h
```

---

## 8. Details about a model

```
ollama show qwen2.5:0.5b
```

Shows its size (`parameters`), how much text it can read at once (`context length`) and its licence.

## 9. Remove the practice model

```
ollama rm qwen2.5:0.5b
```

It says `deleted 'qwen2.5:0.5b'`. Now check:

```
ollama list
```

You should still see the three app models: `qwen2.5:7b-instruct`, `nomic-embed-text` and `llama3.1:8b`.
**Do not remove those.** The app and the notebooks stop working without them.

---

## 10. Ask from code, not chat

Apps talk to Ollama over a local web address. This is what our app does behind the scenes.

**List models:**

```
curl http://localhost:11434/api/tags
```

**Ask a question** (type it as **one line** in cmd):

```
curl http://localhost:11434/api/generate -d "{\"model\":\"qwen2.5:0.5b\",\"prompt\":\"Say hi in three words\",\"stream\":false}"
```

The answer is in `"response"`. The `\"` is how cmd puts a `"` inside the text.

---

## 11. Where are the models saved?

```
dir %USERPROFILE%\.ollama\models
```

They are big (several GB each), so remove the ones you do not use.

---

## Cheat sheet

| I want to... | Command |
|---|---|
| Check the version | `ollama -v` |
| Check it is running | `curl http://localhost:11434` |
| Start it | `ollama serve` |
| Download the app's models | `ollama pull qwen2.5:7b-instruct`, `ollama pull nomic-embed-text`, `ollama pull llama3.1:8b` |
| Download the practice model | `ollama pull qwen2.5:0.5b` |
| List my models | `ollama list` |
| Ask one question | `ollama run qwen2.5:0.5b "your question"` |
| Chat | `ollama run qwen2.5:0.5b` (leave with `/bye`) |
| See the speed | add `--verbose` |
| See what is loaded | `ollama ps` |
| Unload a model | `ollama stop qwen2.5:0.5b` |
| Model details | `ollama show qwen2.5:0.5b` |
| Remove the practice model | `ollama rm qwen2.5:0.5b` |
| All commands | `ollama --help` |

---

**Next:** `3_bifrost_and_langfuse.md`, where we put a gateway and a recorder in front of Ollama.
