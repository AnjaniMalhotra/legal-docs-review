# Docs: read them in this order

| # | File | What you learn | Then do |
|---|---|---|---|
| 1 | `1_company_and_clients.md` | Who PayNest is, its clients, and why contracts matter | Nothing to run |
| 2 | `2_ollama_basics.md` | Install Ollama, download models, ask questions in cmd | `notebooks/00_hello_ollama.ipynb` |
| 3 | `3_bifrost_and_langfuse.md` | Put a gateway (Bifrost) and a recorder (Langfuse) in front of the models | `notebooks/01_hello_llm.ipynb` |
| 3a | `3a_create_secrets_explained.md` | What the secrets script does, line by line | Read with step 3 of the guide above |
| 4 | `4_app_core_explained.md` | The app's first files: settings, gateway, tracing, errors, and the flow between them | Unit tests and the smoke test |
| 5 | `5_pytest_and_decorators.md` | What unit tests are, how pytest works, and every `@` decorator we use | Read the tests in `copilot/tests/` |
| 6 | `6_documents_and_rag.md` | Step 2: read a contract, search it, answer with the page (RAG), and run the web app | `notebooks/02_rag.ipynb`, http://127.0.0.1:8000/api/docs |
| 6a | `6a_why_rag_by_hand.md` | Why RAG, and why we built it ourselves instead of using LangChain blocks or an agent | Read with doc 6 |
| - | `glossary.md` | Every word explained in one line | Open it whenever a word is new |

Logins for Langfuse and Bifrost are in `../credentials.md`.

**For the teacher:** `teaching_script_step1.md` (step 1, the app code) and `teaching_script_step2.md` (step 2, documents and RAG) are the step-by-step class scripts: which file to open, what to say, what to run.
