"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fallbackTimeZone, interests, regions, isTimeZone, type Preferences } from "@/lib/preferences";
export function OnboardingForm({ saved }: { saved: Preferences | null }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(saved?.interests ?? []);
  const [region, setRegion] = useState(saved?.preferred_region ?? "global");
  const [length, setLength] = useState<5 | 10 | 15>(saved?.reading_length ?? 10);
  const [timeZone, setTimeZone] = useState(saved?.time_zone ?? "");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  async function save(complete: boolean) {
    setPending(true); setMessage(""); setFailed(false);
    let detectedZone = timeZone;
    if (!detectedZone) { try { detectedZone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch {} }
    if (!detectedZone || !isTimeZone(detectedZone)) detectedZone = fallbackTimeZone;
    setTimeZone(detectedZone);
    try {
      const response = await fetch("/api/preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ interests: selected, preferred_region: region, reading_length: length, time_zone: detectedZone, onboarding_complete: complete }) });
      const result = await response.json();
      if (!response.ok) { setFailed(true); setMessage(result.error || "Your preferences weren’t saved. Please retry."); if (response.status === 401) router.push("/login"); return; }
      if (complete) { router.push("/paper"); router.refresh(); }
      else setMessage("Progress saved. You can pick up here after a reload.");
    } catch { setFailed(true); setMessage("We couldn’t connect. Your choices are still here; please retry."); }
    finally { setPending(false); }
  }
  return <form className="preferences-form" onSubmit={(event) => { event.preventDefault(); void save(true); }}>
    <fieldset disabled={pending}><legend>Your interests</legend><p className="field-help">Choose at least one. You can change these later.</p><div className="interest-options">{interests.map((interest) => <label className="interest-option" key={interest}><input type="checkbox" name="interests" value={interest} checked={selected.includes(interest)} onChange={(event) => setSelected(event.target.checked ? [...selected, interest] : selected.filter((value) => value !== interest))} /><span>{interest[0].toUpperCase() + interest.slice(1)}</span></label>)}</div></fieldset>
    <fieldset className="preference-row" disabled={pending}><div><label htmlFor="region">Preferred region</label><p id="region-help" className="field-help">A local emphasis, with the world still in view.</p><select id="region" value={region} aria-describedby="region-help" onChange={(event) => setRegion(event.target.value as keyof typeof regions)}>{Object.entries(regions).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div><label htmlFor="reading-length">Reading length</label><p id="length-help" className="field-help">Choose your daily time budget.</p><select id="reading-length" value={length} aria-describedby="length-help" onChange={(event) => setLength(Number(event.target.value) as 5 | 10 | 15)}><option value={5}>5 minutes</option><option value={10}>10 minutes</option><option value={15}>15 minutes</option></select></div></fieldset>
    <div><label htmlFor="time-zone">Your time zone</label><p id="zone-help" className="field-help">We detect your browser’s time zone when you save. If detection fails, we use Asia/Karachi. You can enter another IANA zone, such as Europe/London.</p><input id="time-zone" value={timeZone} placeholder="Detect automatically" onChange={(event) => setTimeZone(event.target.value)} aria-describedby="zone-help" disabled={pending} /></div>
    {message && <p className={failed ? "notice error" : "notice"} role={failed ? "alert" : "status"}>{message}</p>}
    <div className="form-actions"><button className="button" type="submit" disabled={pending} aria-busy={pending}>{pending ? "Saving…" : "Save and continue"}</button><button className="secondary-button" type="button" disabled={pending} onClick={() => void save(false)}>Save progress</button></div>
    <p className="small-note">Your choices stay private to your account.</p>
  </form>;
}

