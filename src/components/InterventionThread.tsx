import { useEffect, useRef, useState } from "react";
import api from "../api";
import { IconPaperclip, IconDownload, IconTrash, IconSend } from "@tabler/icons-react";

interface Attachment {
  attachmentID: number;
  interventionID: number;
  replyID: number | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  sentToStudent: boolean;
  uploadedBy: number;
  uploadedAt: string;
}

interface Reply {
  replyID: number;
  authorID: number;
  authorName: string;
  message: string;
  channel: string | null;
  createdAt: string;
  attachments: Attachment[];
}

interface Thread {
  lecturerName: string;
  canReply: boolean;
  attachments: Attachment[];
  replies: Reply[];
}

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 5;
const ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".txt", ".csv", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"];

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const errorText = (err: any, fallback: string) => {
  const detail = err?.response?.data?.detail;
  return typeof detail === "string" ? detail : fallback;
};

const checkFiles = (files: File[]): string => {
  if (files.length > MAX_FILES) return `You can attach at most ${MAX_FILES} files at a time`;
  for (const f of files) {
    const ext = f.name.includes(".") ? f.name.slice(f.name.lastIndexOf(".")).toLowerCase() : "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) return `File type '${ext || "unknown"}' is not allowed (${f.name})`;
    if (f.size > MAX_FILE_BYTES) return `${f.name} is larger than 5 MB`;
    if (f.size === 0) return `${f.name} is empty`;
  }
  return "";
};

function InterventionThread({ interventionID, refreshKey = 0 }: { interventionID: number; refreshKey?: number }) {
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [message, setMessage] = useState("");
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);

  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [attaching, setAttaching] = useState(false);

  const replyFileInput = useRef<HTMLInputElement>(null);
  const extraFileInput = useRef<HTMLInputElement>(null);

  const loadThread = async () => {
    try {
      const res = await api.get(`/interventions/${interventionID}/thread`);
      setThread(res.data);
      setError("");
    } catch (err: any) {
      setError(errorText(err, "Failed to load the thread"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interventionID, refreshKey]);

  const pickReplyFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const problem = checkFiles(files);
    if (problem) {
      setError(problem);
      setReplyFiles([]);
      e.target.value = "";
      return;
    }
    setError("");
    setReplyFiles(files);
  };

  const pickExtraFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const problem = checkFiles(files);
    if (problem) {
      setError(problem);
      setExtraFiles([]);
      e.target.value = "";
      return;
    }
    setError("");
    setExtraFiles(files);
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    setError("");
    try {
      const form = new FormData();
      form.append("message", message.trim());
      replyFiles.forEach((f) => form.append("files", f));
      await api.post(`/interventions/${interventionID}/replies`, form);
      setMessage("");
      setReplyFiles([]);
      if (replyFileInput.current) replyFileInput.current.value = "";
      await loadThread();
    } catch (err: any) {
      setError(errorText(err, "Failed to add the follow-up"));
    } finally {
      setSending(false);
    }
  };

  const handleAttachOnly = async () => {
    if (extraFiles.length === 0) return;
    setAttaching(true);
    setError("");
    try {
      const form = new FormData();
      extraFiles.forEach((f) => form.append("files", f));
      await api.post(`/interventions/${interventionID}/attachments`, form);
      setExtraFiles([]);
      if (extraFileInput.current) extraFileInput.current.value = "";
      await loadThread();
    } catch (err: any) {
      setError(errorText(err, "Failed to attach the files"));
    } finally {
      setAttaching(false);
    }
  };

  const handleDownload = async (a: Attachment) => {
    try {
      const res = await api.get(`/interventions/attachments/${a.attachmentID}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = a.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Failed to download the file");
    }
  };

  const handleDelete = async (a: Attachment) => {
    if (!window.confirm(`Remove "${a.fileName}"?`)) return;
    try {
      await api.delete(`/interventions/attachments/${a.attachmentID}`);
      await loadThread();
    } catch (err: any) {
      setError(errorText(err, "Failed to remove the file"));
    }
  };

  const renderAttachments = (items: Attachment[], canDelete: boolean) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
      {items.map((a) => (
        <div
          key={a.attachmentID}
          style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f7f7fa", border: "1px solid #eee", borderRadius: "6px", padding: "6px 10px", fontSize: "13px", color: "#1a1a1a" }}
        >
          <IconPaperclip size={14} color="#666" />
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.fileName}</span>
          {a.sentToStudent && (
            <span style={{ background: "#e6f6ea", color: "#1e8e3e", fontSize: "11px", padding: "2px 8px", borderRadius: "10px", whiteSpace: "nowrap" }}>
              Sent to student
            </span>
          )}
          <span style={{ color: "#888", fontSize: "12px" }}>{formatSize(a.fileSize)}</span>
          <button
            onClick={() => handleDownload(a)}
            title="Download"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#4338ca", display: "flex", padding: "2px" }}
          >
            <IconDownload size={16} />
          </button>
          {canDelete && (
            <button
              onClick={() => handleDelete(a)}
              title="Remove"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#c0392b", display: "flex", padding: "2px" }}
            >
              <IconTrash size={16} />
            </button>
          )}
        </div>
      ))}
    </div>
  );

  const smallButton = {
    padding: "6px 12px",
    background: "#fff",
    color: "#4338ca",
    border: "1px solid #4338ca",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
  } as const;

  return (
    <div style={{ marginTop: "14px", padding: "14px 16px", background: "#fcfcfe", border: "1px solid #e8e8f0", borderRadius: "8px" }}>
      <div style={{ fontWeight: 600, fontSize: "13px", color: "#1a1a1a", marginBottom: "10px" }}>Follow-up thread</div>

      {error && (
        <div style={{ padding: "8px 10px", background: "#fde8e8", color: "#c0392b", borderRadius: "6px", fontSize: "13px", marginBottom: "10px" }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ fontSize: "13px", color: "#666", margin: 0 }}>Loading thread...</p>
      ) : thread ? (
        <>
          {thread.attachments.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "12px", color: "#888" }}>Files on this intervention</div>
              {renderAttachments(thread.attachments, thread.canReply)}
            </div>
          )}

          {thread.replies.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#888", margin: "0 0 10px" }}>No follow-ups yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" }}>
              {thread.replies.map((r) => (
                <div key={r.replyID} style={{ background: "#fff", border: "1px solid #eee", borderRadius: "8px", padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#888", gap: "8px" }}>
                    <span style={{ fontWeight: 600, color: "#1a1a1a" }}>
                      {r.authorName}
                      {r.channel && (
                        <span style={{ marginLeft: "8px", background: "#eef0ff", color: "#4338ca", fontSize: "11px", padding: "2px 8px", borderRadius: "10px", fontWeight: 500 }}>
                          Sent to student by {r.channel}
                        </span>
                      )}
                    </span>
                    <span style={{ whiteSpace: "nowrap" }}>{new Date(r.createdAt).toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: "13px", color: "#1a1a1a", marginTop: "6px", whiteSpace: "pre-wrap" }}>{r.message}</div>
                  {r.attachments.length > 0 && renderAttachments(r.attachments, thread.canReply)}
                </div>
              ))}
            </div>
          )}

          {thread.canReply ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Add a follow-up note..."
                style={{ padding: "8px 10px", borderRadius: "6px", border: "1.5px solid #d0d0d8", fontSize: "13px", color: "#1a1a1a", background: "#fff", fontFamily: "inherit" }}
              />

              <input
                ref={replyFileInput}
                type="file"
                multiple
                accept={ALLOWED_EXTENSIONS.join(",")}
                onChange={pickReplyFiles}
                style={{ fontSize: "13px", color: "#1a1a1a" }}
              />
              {replyFiles.length > 0 && (
                <div style={{ fontSize: "12px", color: "#666" }}>
                  {replyFiles.length} file(s) selected: {replyFiles.map((f) => f.name).join(", ")}
                </div>
              )}

              <div>
                <button
                  onClick={handleSend}
                  disabled={sending || !message.trim()}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "7px 14px", background: "#4338ca", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", opacity: sending || !message.trim() ? 0.6 : 1 }}
                >
                  <IconSend size={14} />
                  {sending ? "Sending..." : "Add follow-up"}
                </button>
              </div>

              <div style={{ borderTop: "1px solid #eee", paddingTop: "10px", marginTop: "4px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "12px", color: "#888" }}>Or attach files to the intervention itself (no note)</div>
                <input
                  ref={extraFileInput}
                  type="file"
                  multiple
                  accept={ALLOWED_EXTENSIONS.join(",")}
                  onChange={pickExtraFiles}
                  style={{ fontSize: "13px", color: "#1a1a1a" }}
                />
                <div>
                  <button
                    onClick={handleAttachOnly}
                    disabled={attaching || extraFiles.length === 0}
                    style={{ ...smallButton, opacity: attaching || extraFiles.length === 0 ? 0.6 : 1 }}
                  >
                    {attaching ? "Uploading..." : "Upload files"}
                  </button>
                </div>
              </div>

              <div style={{ fontSize: "11px", color: "#999" }}>
                Up to {MAX_FILES} files, 5 MB each: PDF, images, Word, Excel, PowerPoint, TXT or CSV.
              </div>
            </div>
          ) : (
            <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>
              Only {thread.lecturerName}, the lecturer who recorded this intervention, can add follow-ups.
            </p>
          )}
        </>
      ) : null}
    </div>
  );
}

export default InterventionThread;