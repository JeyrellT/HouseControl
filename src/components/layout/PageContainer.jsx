export function PageContainer({ children }) {
  return (
    <main className="page-container" aria-live="polite">
      {children}
    </main>
  );
}
