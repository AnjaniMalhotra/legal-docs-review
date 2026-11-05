# Logins for the local services

This is a teaching project that runs only on your own machine, so the logins are simple on purpose.
Nothing here is a real secret, and none of these services is reachable from outside your computer.

| Service | Address | ID | Password |
|---|---|---|---|
| Langfuse (traces of every step) | http://localhost:3000 | `admin@paynest.local` | `12345678` |
| Bifrost (model gateway and call log) | http://localhost:8080 | `admin` | `12345678` |

The Contract Copilot (http://localhost:8000), the website (http://localhost:5500) and the presentation
(http://localhost:5600) have no login.

## Where these come from

`copilot/scripts/create_secrets.sh` writes them into `infra/langfuse/.env` and `infra/bifrost/.env` the first
time it runs. It never overwrites existing files, so a machine that was set up earlier keeps the passwords it
already has. A fresh setup (a new machine, or after removing the Docker volumes) uses the table above.

The API keys, database passwords and other internal secrets that script creates are still random.
You never type them: the services read them from the `.env` files.

## Change a login

Edit `PW=` in `copilot/scripts/create_secrets.sh` before the first run. After that, change the password inside the
service itself (Langfuse: Settings, Bifrost: Config).
