// server/seeds/roles.js
const Role = require("../src/models/Role");

const BUILT_IN_ROLES = [
  { name: "Owner",      description: "Full access — organization creator",                permissions: ["*"] },
  { name: "Admin",      description: "Full operational access except billing/org delete", permissions: ["client:*","request:*","quote:*","invoice:*","payment:*","report:*","user:*","product:*","document:*"] },
  { name: "Manager",    description: "Owns delivery: clients, quotes, invoices",          permissions: ["client:read","client:create","client:assign","request:*","quote:*","invoice:*","payment:read","report:*","product:read","document:*"] },
  { name: "Technician", description: "Handles requests on assigned clients",              permissions: ["client:read","request:*","quote:read","report:read","product:read","document:read"] },
  { name: "Finance",    description: "Invoices and payments only",                        permissions: ["client:read","invoice:*","payment:*","report:read","document:read"] },
  { name: "Client",     description: "External portal user — sees own data only",         permissions: ["client:read:self","quote:read:self","invoice:read:self","payment:read:self","request:read:self","document:read:self"] },
];

async function seedRolesForOrg(organizationId) {
  const created = [];
  for (const r of BUILT_IN_ROLES) {
    const doc = await Role.findOneAndUpdate(
      { organization: organizationId, name: r.name },
      {
        $setOnInsert: {
          organization: organizationId,
          name: r.name,
          description: r.description,
          permissions: r.permissions,
          isSystem: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    created.push(doc);
  }
  return created;
}

module.exports = { seedRolesForOrg, BUILT_IN_ROLES };