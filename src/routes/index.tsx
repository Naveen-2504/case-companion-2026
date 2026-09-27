import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Case Register — Patient Case Management" },
      { name: "description", content: "Patient case management app: React frontend and Express + Firebase backend, ready to deploy." },
      { property: "og:title", content: "Case Register — Patient Case Management" },
      { property: "og:description", content: "Patient records, prescriptions and documents on Firebase." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-xl space-y-4">
        <h1 className="text-3xl font-semibold text-foreground">Case Register</h1>
        <p className="text-muted-foreground">
          The patient case app lives in the <code>frontend/</code> and <code>backend/</code> folders and runs on your
          Firebase project <code>case-documentation-kb</code>. Follow the README to run it locally or deploy it with
          <code> firebase deploy</code>.
        </p>
      </div>
    </main>
  );
}
