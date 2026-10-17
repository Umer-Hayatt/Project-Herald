import Link from "next/link";
import { Header } from "@/components/header";
export default function Home() {
  return <><Header /><main id="main" className="landing"><div className="landing-copy"><h1>The world,<br />edited for you.</h1><p className="lede">A daily paper shaped by your interests, with important stories beyond them.</p><Link className="button" href="/login">Create my paper <span aria-hidden="true">↗</span></Link><p className="small-note">Start with Google. Make it yours in a minute.</p></div><aside className="art-space" aria-label="Herald illustration space"><div className="paper-object"><span className="paper-masthead">Herald.</span><div className="paper-rule" /><h2>A wider view.<br />A little more you.</h2><p>Your interests set the direction. A different perspective makes the paper.</p><div className="paper-rule" /><span className="small-note">Your daily reading ritual</span></div><p className="art-caption">Space reserved for human-made artwork.</p></aside></main><footer className="site-footer"><span>One daily paper. Room for perspective.</span><span>Herald · First release in progress</span></footer></>;
}

