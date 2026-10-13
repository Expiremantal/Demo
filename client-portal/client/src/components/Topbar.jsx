import { useAuth } from "../hooks/useAuth";

export default function Topbar() {
    const { user, logout } = useAuth();
    const initials = user
        ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
        : "?";

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-4 px-6">
            <input
                type="text"
                placeholder="Search clients, requests, quotes, invoices"
                className="flex-1 max-w-xl h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            />

            <button className="h-10 px-4 rounded-md border border-slate-300 text-sm hover:bg-slate-50">
                Notifications <span className="ml-1 font-semibold">3</span>
            </button>

            <div className="relative group">
                <button
                    className="h-10 w-10 rounded-full bg-slate-200 text-slate-700 font-semibold flex items-center justify-center"
                    title={`${user?.firstName} ${user?.lastName}`}
                >
                    {initials}
                </button>

                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-md shadow-lg hidden group-hover:block">
                    <div className="px-3 py-2 text-xs text-slate-500 border-b">
                        {user?.email}
                    </div>
                    <button
                        onClick={logout}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                    >
                        Log out
                    </button>
                </div>
            </div>
        </header>
    );
}