import { Outlet, Link, useLocation } from "react-router";
import { FileText, FilePlus, FolderOpen, User, Building2 } from "lucide-react";

export function Layout() {
  const location = useLocation();

  const navItems = [
    { path: "/create-review", label: "Create a Review", icon: FilePlus },
    { path: "/past-reviews", label: "View Past Reviews", icon: FileText },
    { path: "/my-documents", label: "View My Documents", icon: FolderOpen },
    { path: "/my-details", label: "My Details", icon: User },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <Link to="/" className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="font-semibold text-lg">Hospital Review</h1>
              <p className="text-xs text-gray-500">Transparent Healthcare</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <p className="font-medium mb-1">Healthcare Transparency</p>
            <p>Empowering informed decisions for everyone</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
