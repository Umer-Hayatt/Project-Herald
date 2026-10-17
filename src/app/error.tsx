"use client";
export default function ErrorState({ reset }: { reset: () => void }) { return <main id="main" className="paper-entry"><h1>A brief interruption.</h1><p role="alert">We couldn’t load your account. Your saved preferences are safe. Please try again.</p><button className="button" onClick={reset}>Try again</button></main>; }

