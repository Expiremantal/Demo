const ROLE_CAPS = {
    Owner:      ["*"],
    Admin:      ["client:*", "quote:*", "invoice:*", "payment:*", "report:*", "user:*"],
    Manager:    ["client:read", "client:create", "client:assign", "quote:*", "invoice:*", "payment:read", "report:*"],
    Technician: ["client:read", "request:*", "quote:read", "report:read"],
    Finance:    ["client:read", "invoice:*", "payment:*", "report:read"],
    Client:     ["client:read:self", "quote:read:self", "invoice:read:self", "payment:read:self"],
};

function can(user, capability) {
    const caps = ROLE_CAPS[user.role] || [];
    if (caps.includes("*")) return true;
    return caps.some((c) => {
        if (c === capability) return true;
        if (c.endsWith(":*")) return capability.startsWith(c.slice(0, -1));
        return false;
    });
}

module.exports = { can, ROLE_CAPS };