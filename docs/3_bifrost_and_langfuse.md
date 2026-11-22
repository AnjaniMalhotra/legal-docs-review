# Bifrost and Langfuse, step by step

In `2_ollama_basics.md` we talked to Ollama directly. Now we put two things in front of it:

- **Bifrost**: the gateway. The **one door** to the models. It refuses any model that is not on its list.
- **Langfuse**: the recorder. It **keeps a record** of every question and answer.

Both run in **Docker** on your own computer. Nothing goes to the internet.

```
 Notebook / App
      |
      v
 +-----------+   allowed?   +----------+
 |  Bifrost  | -----------> |  Ollama  |   (runs on Windows, port 11434)
 |  :8080    |  yes         +----------+
 +-----------+
      |  no  -> "refused"
      |
      |  sends a record of every call
      v
 +-----------+
 | Langfuse  |   (port 3000)
 +-----------+
```

All commands are for **cmd**, unless it says **Git Bash**.

---

## 1. What you need in your folder

```
your-folder/
|-- credentials.md                       the logins (Langfuse and Bifrost)
|-- docs/                                these guides
|-- notebooks/
|   |-- 00_hello_ollama.ipynb            Ollama directly
|   |-- 01_hello_llm.ipynb               through Bifrost, recorded in Langfuse
|   `-- requirements.txt                 Python packages for the notebooks
|-- infra/
|   |-- langfuse/docker-compose.yml      starts Langfuse (6 containers)
|   `-- bifrost/config.json              tells Bifrost where Ollama is and which models are allowed
`-- copilot/
    `-- scripts/create_secrets.sh        makes the passwords and keys (.env files)
```

| File | Why it exists |
|---|---|
| `docker-compose.yml` | Langfuse needs 6 containers. This one file starts all of them, in the right order, with the right settings. |
| `config.json` | Bifrost is a ready-made program. This file tells it **our** setup: where Ollama is, which models are allowed, where to send records. |
| `create_secrets.sh` | Makes fresh passwords and keys on **your** machine, so nobody shares secrets. |
| `credentials.md` | The two logins, written down. |

---

## 2. Install Docker

1. Download **Docker Desktop**: https://www.docker.com/products/docker-desktop
2. Install it and open it. Wait until it says **Engine running**.
3. Check in cmd:

```
docker --version
docker ps
```

`docker ps` shows an empty table. That is good: nothing is running yet.

---

## 3. Make the secrets (the `.env` files)

A `.env` file holds passwords and keys. **We never download it and never share it.** A script makes it on your machine.

Open **Git Bash** (it comes with Git), go to your folder, and run:

```
bash copilot/scripts/create_secrets.sh
```

It says `Secrets created`. It made three files:

| File | What is inside | Who reads it |
|---|---|---|
| `infra/langfuse/.env` | database passwords, the first login | Langfuse |
| `infra/bifrost/.env` | the key to send records to Langfuse, the admin password | Bifrost |
| `copilot/.env.local` | the Langfuse keys | the notebook (and later the app) |

**Rules:**

- Never share these files, and never put them on GitHub (`.gitignore` blocks them).
- Run the script again and it says `Secrets already exist`. It never overwrites them.
- The keys in the three files **must match**. That is why one script makes all three together.

**Want to know what is inside the script?** Read `3a_create_secrets_explained.md`.

---

## 4. Start Langfuse

```
cd infra\langfuse
docker compose up -d
```

The first time, Docker downloads the programs (a few minutes). Then check:

```
docker compose ps
```

Wait about a minute, then open **http://localhost:3000**

Log in: `admin@paynest.local` / `12345678`. You see the project **Contract Copilot**. It was made for you from the `.env` file.

### Why does Langfuse need 6 containers?

Langfuse is not one program. It is a small team, and each member has one job:

```
                 you (browser, port 3000)
                          |
                          v
  +-------------------------------------------+
  | langfuse-web       the website and the API |
  +-------------------------------------------+
        |               |                |
        |   new records |                |
        v               v                v
  +----------+    +-----------+    +-----------+
  | postgres |    |   redis   |    |   minio   |
  | users,   |    | to-do     |    | raw files |
  | projects,|    | list      |    | (the full |
  | prompts  |    |           |    |  records) |
  +----------+    +-----------+    +-----------+
                        |                ^
                        v                |
                  +----------------+     |
                  | langfuse-worker| ----+
                  | does the work  |
                  | in the back    |
                  +----------------+
                        |
                        v
                  +------------+
                  | clickhouse |
                  | the records|
                  | (fast to   |
                  |  search)   |
                  +------------+
```

| Container | Its job, in one line | Why not skip it? |
|---|---|---|
| `langfuse-web` | The website you log in to, and the door that receives records | Without it, nothing to see and nowhere to send |
| `langfuse-worker` | Processes records in the background | So the website stays fast |
| `postgres` | Remembers users, projects, keys and prompts | The "address book" |
| `clickhouse` | Stores the records themselves, fast to search | Millions of records need a fast store |
| `redis` | A to-do list between web and worker | So no record gets lost when it is busy |
| `minio` | Keeps the raw files of each record | Big data goes here, not in the databases |

One `docker compose up -d` starts all six. You never start them one by one.

---

## 5. Start Bifrost

Go to the Bifrost folder and type this as **one line**:

```
cd ..\bifrost
docker run -d --name paynest-bifrost --restart unless-stopped --network langfuse_default -p 127.0.0.1:8080:8080 --add-host=host.docker.internal:host-gateway --env-file .env -v "%cd%:/app/data" maximhq/bifrost:latest
```

What each part means:

| Part | Meaning |
|---|---|
| `docker run -d` | Start a container and keep it running in the background |
| `--name paynest-bifrost` | Give it a name, so we can stop and start it later |
| `--restart unless-stopped` | Start it again after a reboot, unless we stopped it ourselves |
| `--network langfuse_default` | Join Langfuse's network, so Bifrost can send it records |
| `-p 127.0.0.1:8080:8080` | Open port 8080, **on this computer only** |
| `--add-host=host.docker.internal:host-gateway` | Lets Bifrost reach Ollama, which runs on Windows, outside Docker |
| `--env-file .env` | Load the secrets |
| `-v "%cd%:/app/data"` | Share **this folder** with the container, so Bifrost finds `config.json` |
| `maximhq/bifrost:latest` | The ready-made Bifrost program, from Docker Hub |

Open **http://localhost:8080** and log in: `admin` / `12345678`.

### Why is there no Dockerfile for Bifrost?

A **Dockerfile** is a recipe to **build your own** program into a container.
We do not build Bifrost: its makers already built it and put it on **Docker Hub** as `maximhq/bifrost`.
We just **download and run** it, and give it our settings. The same is true for Langfuse.

> Later, our **own app** is different: nobody else built it, so it needs its own Dockerfile.

### How does `config.json` power Bifrost?

1. `-v "%cd%:/app/data"` shares the `infra\bifrost` folder with the container, as `/app/data`.
2. When Bifrost starts, it looks for `/app/data/config.json` and reads it.
3. The file tells it:

| In `config.json` | What it means |
|---|---|
| `providers` -> `ollama` -> `url` | Where Ollama is: `http://host.docker.internal:11434` |
| `models` | The **allowlist**. Only these models can run |
| `plugins` -> `otel` | Send a record of every call to Langfuse |
| `auth_config` | Turn on the login for the dashboard |
| `"env.BIFROST_ADMIN_PASSWORD"` | Means: take this value from the `.env` file, not from here |

**Changed `config.json`?** Make Bifrost read it again: remove the container and run the `docker run` line again.

```
docker rm -f paynest-bifrost
```

---

## 6. Check that it works

**An allowed model gets an answer** (one line):

```
curl http://127.0.0.1:8080/v1/embeddings -H "Content-Type: application/json" -d "{\"model\":\"ollama/nomic-embed-text\",\"input\":\"hello\"}"
```

You get a long list of numbers. That is the answer.

**A model not on the list is refused** (one line):

```
curl http://127.0.0.1:8080/v1/embeddings -H "Content-Type: application/json" -d "{\"model\":\"ollama/llama3.2:1b\",\"input\":\"hello\"}"
```

You get `no keys found that support model`. Bifrost said no.

---

## 7. Run the notebook

```
paynestenv\Scripts\activate
pip install -r notebooks\requirements.txt
```

Open `notebooks\01_hello_llm.ipynb` and run all cells. The last cell prints a link to the record in Langfuse.

## 8. See everything

**In Bifrost** (http://localhost:8080) -> **Logs**

- Every request: which model, how long it took, success or error.
- The refused ones show as **errors**. That is the allowlist working.

**In Langfuse** (http://localhost:3000) -> **Tracing**

- Every call from the notebook: the question, the answer, the tokens, the time.
- Click a record to see its steps: `hello-llm` (the whole cell) and `chat: analyst` (the model call inside it).

---

## 9. Stop and start later

**Stop** (frees memory):

```
cd infra\langfuse
docker compose stop
docker stop paynest-bifrost
```

**Start again:**

```
cd infra\langfuse
docker compose start
docker start paynest-bifrost
```

---

## If something goes wrong

| Problem | Fix |
|---|---|
| `ports are not available` | Another program uses that port. Stop it, or stop old containers: `docker ps`, then `docker stop <name>` |
| Langfuse page does not open | Wait one more minute. Check `docker compose ps`: all should say `Up` |
| `Langfuse: NOT connected` in the notebook | The `.env` files do not match this Langfuse. Reset it: `docker compose down -v`, then `docker compose up -d` (this deletes all records) |
| Bifrost gives an error about reaching Ollama | Ollama is off. Wake it (see `2_ollama_basics.md`), then try again |
| `The container name "/paynest-bifrost" is already in use` | It already exists. Just start it: `docker start paynest-bifrost` |

---

## Cheat sheet

| I want to... | Command |
|---|---|
| Make the secrets (Git Bash) | `bash copilot/scripts/create_secrets.sh` |
| Start Langfuse | `cd infra\langfuse` then `docker compose up -d` |
| See Langfuse's containers | `docker compose ps` |
| Start Bifrost (first time) | the long `docker run` line in step 5 |
| Start Bifrost (later) | `docker start paynest-bifrost` |
| See all running containers | `docker ps` |
| Stop everything | `docker compose stop` and `docker stop paynest-bifrost` |
| Langfuse | http://localhost:3000 (`admin@paynest.local` / `12345678`) |
| Bifrost | http://localhost:8080 (`admin` / `12345678`) |
