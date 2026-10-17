import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { SubmitButton } from "./submit-button";
import { ReaderNavigation } from "./reader-navigation";
export function Header({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <header className="masthead">
      <Link className="wordmark" href="/" aria-label="Herald home">
        Herald<span aria-hidden="true">.</span>
      </Link>
      <span className="masthead-note">A little perspective, daily.</span>
      {signedIn ? (
        <div className="masthead-user-nav">
          <ReaderNavigation />
          <form action={signOut}>
            <SubmitButton pendingText="Signing out…">Sign out</SubmitButton>
          </form>
        </div>
      ) : (
        <Link className="text-link" href="/login">
          Sign in
        </Link>
      )}
    </header>
  );
}
