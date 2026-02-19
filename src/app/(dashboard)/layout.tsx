import Sidebar from "@/components/shared/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen noise-bg">
      <Sidebar />
      <main
        className="flex-1 overflow-auto"
        style={{ marginLeft: "var(--sidebar-width)" }}
      >
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 40px" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
