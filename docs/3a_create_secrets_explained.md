# The secrets script, line by line

`copilot/scripts/create_secrets.sh` makes all our passwords and keys.
We **never download them and never share them**. Every laptop makes its own.

Read this together with step 3 of `3_bifrost_and_langfuse.md`.

```
create_secrets.sh
      |
      |-- infra/langfuse/.env    -> read by Langfuse
      |-- infra/bifrost/.env     -> read by Bifrost
      `-- copilot/.env.local     -> read by the notebook (and later the app)

   All three hold the SAME Langfuse keys, so all the parts trust each other.
```

---

## 1. Be careful and private

```bash
set -euo pipefail
cd "$(dirname "$0")/../.."
umask 077
```

- `set -euo pipefail`: **stop at the first error**, instead of carrying on half-done.
- `cd ...`: go to the project's main folder, wherever you ran the script from.
- `umask 077`: the files it makes can be **read only by you**.

## 2. Never overwrite

```bash
FILES=(infra/langfuse/.env infra/bifrost/.env copilot/.env.local)
```

- If **all three** files already exist, it says `Secrets already exist` and stops. Your keys are safe.
- If **only some** exist, it stops with an error. Why? The keys in all three must match, and a half set cannot match.

So running it twice does no harm.

## 3. Make random secrets

```bash
rnd() { openssl rand -hex "$1"; }
PG=$(rnd 16); CH=$(rnd 16); RD=$(rnd 16); MN=$(rnd 16)
PK="pk-lf-$(rnd 16)"; SK="sk-lf-$(rnd 16)"
PW=12345678
```

- `rnd` asks `openssl` for **random letters and numbers** that nobody can guess.
- One password for each of Langfuse's databases:

| Name | Password for |
|---|---|
| `PG` | Postgres (users, projects) |
| `CH` | ClickHouse (the records) |
| `RD` | Redis (the to-do list) |
| `MN` | MinIO (the raw files) |

- One **pair of keys**, like a username and password for programs:
  - `PK`, the public key, starts with `pk-lf-`
  - `SK`, the secret key, starts with `sk-lf-`
- `PW=12345678` is the **login** for Langfuse and Bifrost.
  It is simple **only because this is a class**. A real company would never do this.

## 4. File 1: `infra/langfuse/.env`

```bash
TELEMETRY_ENABLED=false
NEXTAUTH_SECRET=...   SALT=...   ENCRYPTION_KEY=...
POSTGRES_PASSWORD=...   CLICKHOUSE_PASSWORD=...   REDIS_AUTH=...   MINIO_ROOT_PASSWORD=...
LANGFUSE_INIT_ORG_NAME=PayNest
LANGFUSE_INIT_PROJECT_NAME=Contract Copilot
LANGFUSE_INIT_PROJECT_PUBLIC_KEY=$PK
LANGFUSE_INIT_PROJECT_SECRET_KEY=$SK
LANGFUSE_INIT_USER_EMAIL=admin@paynest.local
LANGFUSE_INIT_USER_PASSWORD=$PW
```

- `TELEMETRY_ENABLED=false`: Langfuse **sends nothing home**. Everything stays on this laptop.
- `NEXTAUTH_SECRET`, `SALT`, `ENCRYPTION_KEY`: protect logins and stored data.
- The four database passwords from step 3.
- The `LANGFUSE_INIT_` lines: the **first time** Langfuse starts, it creates the company, the project, the keys and the admin user **by itself**. We click nothing.

## 5. File 2: `infra/bifrost/.env`

```bash
LANGFUSE_OTEL_AUTH=Basic <PK and SK joined together>
BIFROST_ADMIN_PASSWORD=$PW
```

- `LANGFUSE_OTEL_AUTH`: the **same two keys**, joined together. Bifrost shows them to Langfuse to be allowed to send records.
- `BIFROST_ADMIN_PASSWORD`: the dashboard login. `config.json` asks for it with `"env.BIFROST_ADMIN_PASSWORD"`.

## 6. File 3: `copilot/.env.local`

```bash
GATEWAY_API_KEY=local
LANGFUSE_PUBLIC_KEY=$PK
LANGFUSE_SECRET_KEY=$SK
```

- The **same keys again**, so the notebook (and later the app) can write to Langfuse.
- `GATEWAY_API_KEY=local`: Bifrost on this laptop needs no real key, but the code wants a value.

---

## The big idea

| | |
|---|---|
| **One script** | runs once, before Docker |
| **Three files** | one for Langfuse, one for Bifrost, one for our code |
| **Same keys** | so Langfuse, Bifrost and the notebook trust each other |
| **Never shared** | `.gitignore` keeps them off GitHub |

## Ask the class

1. Why does the script refuse to run when only some of the files exist?
   *Because the keys must match, and a half set cannot.*
2. Why `TELEMETRY_ENABLED=false`?
   *So Langfuse sends nothing out of the laptop.*
3. Which value appears in all three files?
   *The Langfuse keys, `pk-lf-...` and `sk-lf-...`.*
4. What would go wrong if we shared one `.env` with the whole class?
   *Everyone would have the same passwords, and anyone could read anyone's records.*
