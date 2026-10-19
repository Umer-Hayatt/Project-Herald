"use client";

import { useEffect, useState } from "react";

export function StoryFeedbackControls({ storyId }: { storyId: string }) {
  const [pending, setPending] = useState<"more" | "less" | null>(null);
  const [saved, setSaved] = useState<"more" | "less" | null>(null);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!storyId) return;
    let current = true;
    void fetch(`/api/feedback?story_id=${encodeURIComponent(storyId)}`)
      .then(async (response) => response.ok ? response.json() : null)
      .then((result) => {
        if (current && (result?.feedback === "more" || result?.feedback === "less")) setSaved(result.feedback);
      })
      .catch(() => {});
    return () => { current = false; };
  }, [storyId]);

  if (!storyId || storyId.startsWith("sample-")) return null;

  async function save(feedback: "more" | "less") {
    setPending(feedback);
    setMessage("");
    setFailed(false);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story_id: storyId, feedback }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Please retry.");
      setSaved(feedback);
      setMessage("Saved for a future Edition.");
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "We couldn’t save your feedback. Please retry.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="story-feedback">
      <span>Shape future Editions:</span>
      <button type="button" className="feedback-button" aria-pressed={saved === "more"} disabled={pending !== null} onClick={() => void save("more")}>
        {pending === "more" ? "Saving…" : "More like this"}
      </button>
      <button type="button" className="feedback-button" aria-pressed={saved === "less"} disabled={pending !== null} onClick={() => void save("less")}>
        {pending === "less" ? "Saving…" : "Less like this"}
      </button>
      {message && <span className={failed ? "feedback-message error" : "feedback-message"} role={failed ? "alert" : "status"}>{message}</span>}
    </div>
  );
}
