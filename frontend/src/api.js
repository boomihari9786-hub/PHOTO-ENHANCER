// Client for the FastAPI Photo Enhancement backend.

export async function enhanceImage(file, opts) {
  const form = new FormData();
  form.append("file", file);
  
  for (const [key, value] of Object.entries(opts)) {
    if (value !== undefined && value !== null) {
      form.append(key, String(value));
    }
  }

  const res = await fetch("/api/enhance", { method: "POST", body: form });
  if (!res.ok) {
    let detail = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (body.detail) {
        detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
      }
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail);
  }
  return res.json();
}

export function downloadUrl(id, format = "png", quality = 95, filename = "enhanced") {
  const encodedName = encodeURIComponent(filename || "enhanced");
  return `/api/files/${id}/enhanced?format=${format}&quality=${quality}&download=true&filename=${encodedName}`;
}

export async function fetchHealth() {
  try {
    const res = await fetch("/api/health");
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
