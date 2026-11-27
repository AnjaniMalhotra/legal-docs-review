# Why we built RAG by hand (and not with LangChain)

Read this after `6_documents_and_rag.md`.

## 1. First: why RAG at all?

A contract is long. A small model running on our own laptop can only read so much at once, and the more we give it, the more mistakes it makes.

So we do **not** give it the whole contract. We:

1. **find** the few clauses that matter for the question,
2. **give only those** to the model,
3. ask it to answer **from them only**, and to **cite the page**.

That is RAG. Short answers, correct answers, and answers a lawyer can **check**.

---

## 2. "Couldn't LangChain do this for us?"

LangChain is a popular library with ready-made building blocks for RAG:

- **text splitters**, which cut text into pieces,
- **vector store wrappers**, which save and search those pieces,
- **`create_agent`**, which lets a model use a "search" tool by itself.

With those, a basic RAG fits in a few lines. So why did we write our own?

**Not to avoid LangChain.** Three parts of our app are special to **contracts**, and a ready-made block would change the results:

| Part | What we do | What a ready-made block would do |
|---|---|---|
| **Splitting** (`chunker.py`) | Cut at clause headings like `9.3 SECURITY INCIDENTS`. Keep the **page and heading**. Drop page footers. Keep a clause whole across a page break | A standard splitter cuts every so many characters. Clauses get chopped in the middle and lose their headings, so citations like `[p.5, 9.3 ...]` get worse |
| **Search** (`retriever.py`) | Search by meaning, **plus** a boost for the question's own words, **plus** synonyms ("breach" also searches "security incident"), **plus** the parties are always included | A plain vector search only looks at meaning. It can miss the clause when the contract uses different words |
| **Answer** (`answerer.py`) | One fixed path: search, prompt, **one** model call. If nothing is found, it says "Not found in the document." without even asking the model | An agent lets the **model decide** when and how to search. More model calls, slower, and different from run to run |

> We would have had to write our splitting and search rules anyway, inside LangChain's blocks. So the wrapper would not save much.

---

## 3. Where a wrapper *would* fit

**Saving and searching the numbers (vectors).** A LangChain wrapper around Chroma could replace about 30 lines of `vector_store.py`.

But it would give the **same** results only if we keep three things the same:

- the same embedding model,
- the same distance (cosine),
- the small labels the embed model needs in front of the text (`search_document:` and `search_query:`). The wrapper does not add these for us.

So the saving is small, and we would add a big library to the project.

---

## 4. Why not `create_agent`?

An **agent** is a model that can call tools by itself, for example "search the contract". It is real, and easy to set up. But it is a poor fit **here**:

1. **Small local models are shaky with tools.** Our 7B model on a 6 GB graphics card may skip the search, search twice, or answer without citing a page.
2. **A legal tool must be predictable.** The same question should give the same cited answer, every time, and "Not found" must be guaranteed. A fixed path does that. An agent does not.
3. **The results would change.** We tested our behaviour: "breach" finds clause 9.3, and an off-topic question gets an honest "Not found". An agent could break both.

```
 Our fixed path:   question -> search -> prompt -> 1 model call -> cited answer
                   (same steps every time; easy to test)

 An agent:         question -> model -> maybe search -> model -> maybe search again -> answer
                   (the model chooses the steps; harder to test)
```

---

## 5. The takeaway

| | By hand (what we did) | LangChain blocks / agent |
|---|---|---|
| Learning | You see every step of RAG | Steps are hidden inside the library |
| Contract-specific splitting and search | Built in | You still have to write them |
| Same answer every time | Yes | Not with an agent |
| Easy to test | Yes: 13 tests, no AI needed | Harder |
| Code to write | More | Less, for simple cases |

**Rule of thumb:** use ready-made blocks when the standard behaviour is good enough. When the job is special (contracts, citations, legal risk), write the important parts yourself so you can control and test them.
