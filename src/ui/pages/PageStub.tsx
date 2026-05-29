/**
 * PageStub - placeholder for screens not yet built.
 *
 * Shows the screen name, its purpose (from the wireframes), and which
 * milestone will build it. Keeps the app navigable during M1 while the
 * real screens land in M2+.
 */

export function PageStub({
  title,
  purpose,
  milestone,
}: {
  title: string;
  purpose: string;
  milestone: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-8 py-12">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-muted-fg">{purpose}</p>
      <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/20 p-6">
        <p className="text-sm text-muted-fg">
          This screen is a placeholder. It will be built in{' '}
          <span className="font-medium text-foreground">{milestone}</span>. The
          navigation, chrome, and scenario switching around it are live now —
          try switching scenarios in the top rail and watch the KPIs update.
        </p>
      </div>
    </div>
  );
}
