import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <Navbar />
            <Sidebar />
            <main className="flex-1 pt-24 md:pl-64">
                {children}
            </main>
        </div>
    );
}
