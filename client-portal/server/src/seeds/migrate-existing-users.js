// server/seeds/migrate-existing-users.js
// One-off: create Role + UserRole rows for all existing users.
// Run:  node seeds/migrate-existing-users.js
const mongoose = require("mongoose");
const User = require("../models/User");
const Role = require("../models/Role");
const UserRole = require("../models/UserRole");
const { seedRolesForOrg } = require("./roles");

async function main() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/client-portal";
  await mongoose.connect(uri);
  console.log("Connected:", uri);

  const users = await User.find({});
  console.log(`Found ${users.length} user(s)`);

  // Group by org
  const byOrg = new Map();
  for (const u of users) {
    const key = u.organization.toString();
    if (!byOrg.has(key)) byOrg.set(key, []);
    byOrg.get(key).push(u);
  }

  for (const [orgId, orgUsers] of byOrg) {
    console.log(`\nOrg ${orgId} — seeding roles…`);
    await seedRolesForOrg(orgId);

    for (const u of orgUsers) {
      const existing = await UserRole.findOne({ user: u._id });
      if (existing) {
        console.log(`  ✓ ${u.email} already has a role link`);
        continue;
      }
      const role = await Role.findOne({ organization: orgId, name: u.role });
      if (!role) {
        console.warn(`  ✗ No matching role "${u.role}" for ${u.email}`);
        continue;
      }
      await UserRole.create({
        organization: orgId,
        user: u._id,
        role: role._id,
        assignedBy: null,
      });
      console.log(`  ✓ Linked ${u.email} → ${u.role}`);
    }
  }

  console.log("\nDone.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});