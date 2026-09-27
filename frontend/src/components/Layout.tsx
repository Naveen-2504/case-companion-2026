import { ClipboardList, Plus } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import { Button } from "./ui";

export function Layout() {
  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-30 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/cases" className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><ClipboardList className="size-4" /></span>
            Case Register
          </Link>
          <Button asChild size="sm"><Link to="/cases/add"><Plus /> New case</Link></Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6"><Outlet /></main>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
      <p className="font-medium">Couldn't load</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      {onRetry && <Button variant="outline" className="mt-4" onClick={onRetry}>Try again</Button>}
    </div>
  );
}
