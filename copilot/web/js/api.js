// Thin client for the local copilot API. Same-origin only: nothing leaves this machine.

async function request(path, options = {}) {
  const res = await fetch(path, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = Array.isArray(body.detail) ? body.detail.map((d) => d.msg).join("; ") : body.detail;
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return body;
}

const post = (data) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

export function uploadPdf(file) {
  const form = new FormData();
  form.append("file", file);
  return request("/api/documents", { method: "POST", body: form });
}

export const getDocument = (docId) => request(`/api/documents/${docId}`);
export const getSummary = (docId) => request(`/api/documents/${docId}/summary`);
export const getStandards = () => request("/api/policy/standards");
export const getHealth = () => request("/api/health");
export const ask = (docId, question) => request("/api/ask", post({ doc_id: docId, question }));
export const startReview = (docId, reviewer, matter) =>
  request("/api/policy/reviews", post({ doc_id: docId, reviewer, matter }));
export const submitDecisions = (reviewId, decisions) =>
  request(`/api/policy/reviews/${reviewId}/decisions`, post({ decisions }));
