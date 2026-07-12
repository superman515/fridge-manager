export default function AppLayout({ children }: { children: React.ReactNode }) {
  // TODO(#3): redirect to /auth/login if unauthenticated (client-side check
  // via onAuthStateChanged, or middleware-based guard).
  return <div className="app-layout">{children}</div>;
}
