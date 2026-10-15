import { useAuth } from "../context/AuthContext.jsx";

const ROLE_CAPS = {
    Owner:      ["*"],
    Admin:      ["client:*", "quote:*", "invoice:*", "payment:*", "report:*", "user:*"],
    Manager:    ["client:read", "client:create", "client:assign", "quote:*", "invoice:*", "payment:read", "report:*"],
    Technician: ["client:read", "request:*", "quote:read", "report:read"],
    Finance:    ["client:read", "invoice:*", "payment:*", "report:read"],
    Client:     ["client:read:self", "quote:read:self", "invoice:read:self", "payment:read:self"],
};

function userCan(user, cap) {
    if (!user) return false;
    const caps = ROLE_CAPS[user.role] || [];
    if (caps.includes("*")) return true;
    return caps.some((c) => c === cap || (c.endsWith(":*") && cap.startsWith(c.slice(0, -1))));
}

export default function Can({ permission, children, fallback = null }) {
    const { user } = useAuth();
    return userCan(user, permission) ? children : fallback;
}