/**
 * Returns a Mongo filter that limits what a user can see.
 * ALWAYS includes organization (tenant isolation).
 *
 * Usage:
 *   const filter = clientScope(req.user);
 *   const clients = await Client.find(filter);
 */
function clientScope(user) {
    const base = { organization: user.organization };

    switch (user.role) {
        case "Owner":
        case "Admin":
            // sees everything in the org
            return base;

        case "Manager":
            // sees clients assigned to them OR to any user they manage
            return {
                ...base,
                $or: [
                    { assignedTo: user._id },
                    { owner: user._id },
                    { assignedTo: { $in: user.teamMemberIds || [] } },
                ],
            };

        case "Technician":
        case "Finance":
            // sees only clients they're assigned to
            return {
                ...base,
                $or: [{ assignedTo: user._id }, { owner: user._id }],
            };

        case "Client":
            // sees only their own client record
            return {
                ...base,
                _id: user.clientProfile,
            };

        default:
            // fail closed — no access
            return { _id: null };
    }
}

/**
 * Same idea, but for child documents (quotes, invoices, etc.)
 * that reference a Client. We first find which clients the user
 * can see, then filter children by those client IDs.
 */
async function childScope(user, ClientModel) {
    const base = { organization: user.organization };

    if (user.role === "Owner" || user.role === "Admin") {
        return base;
    }

    const visibleClients = await ClientModel.find(clientScope(user)).select("_id").lean();
    const ids = visibleClients.map((c) => c._id);

    return { ...base, client: { $in: ids } };
}

module.exports = { clientScope, childScope };