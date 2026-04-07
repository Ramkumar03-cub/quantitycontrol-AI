import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, History, Settings, LogOut, Menu, Brain, BarChart2, Activity } from 'lucide-react';

const Layout = ({ children }) => {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/maintenance', icon: Activity, label: 'AI Predictive' },
        { path: '/analytics', icon: BarChart2, label: 'Analytics' },
        { path: '/training', icon: Brain, label: 'AI Training' },
        { path: '/history', icon: History, label: 'History' },
        { path: '/settings', icon: Settings, label: 'Settings' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = '/login';
    };

    return (
        <div className="flex h-screen bg-transparent text-white overflow-hidden">
            {/* Sidebar */}
            <aside
                className={`${isSidebarOpen ? 'w-64' : 'w-20'
                    } glass-panel border-r border-white/10 transition-all duration-300 flex flex-col z-20 relative`}
            >
                {/* Decorative gradient line at top */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-60" />

                <div className="p-4 flex items-center justify-between border-b border-white/5 h-16">
                    {isSidebarOpen && (
                        <div className="flex items-center gap-2.5">
                            <img src="/logo.png" alt="QC AI" className="w-9 h-9 rounded-lg shadow-lg shadow-blue-500/20 object-contain" />
                            <span className="font-bold text-xl gradient-text">
                                QC AI
                            </span>
                        </div>
                    )}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:bg-white/5 rounded-lg transition-all duration-200 group"
                    >
                        <Menu className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                    </button>
                </div>

                <nav className="flex-1 p-3 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'sidebar-link-active bg-blue-500/10 text-blue-300 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent'
                                    }`}
                            >
                                <div className={`p-1.5 rounded-lg transition-all duration-200 ${isActive ? 'bg-blue-500/20' : 'group-hover:bg-white/5'}`}>
                                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-blue-400' : 'group-hover:text-white'}`} />
                                </div>
                                {isSidebarOpen && (
                                    <span className="font-medium whitespace-nowrap text-sm">
                                        {item.label}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-3 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
                    >
                        <div className="p-1.5 rounded-lg group-hover:bg-red-500/10 transition-all">
                            <LogOut className="w-4 h-4 shrink-0" />
                        </div>
                        {isSidebarOpen && <span className="font-medium text-sm">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-transparent relative z-10">
                <div className="p-6 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
