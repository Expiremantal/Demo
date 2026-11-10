const Category = require("../models/Category");
const Product  = require("../models/Product");
const ApiError = require("../utils/ApiError");
const { can }  = require("../utils/permissions");

// GET /api/categories
exports.list = async (req, res, next) => {
  try {
    if (!can(req.user, "product:read") && !can(req.user, "product:*")) {
      throw new ApiError(403, "Forbidden");
    }
    const categories = await Category.find({
      organization: req.user.organization,
      isActive: true,
    }).sort({ name: 1 }).lean();

    // attach live product counts
    const counts = await Product.aggregate([
      { $match: { organization: req.user.organization, deletedAt: null } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    const map = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
    res.json({ data: categories.map((c) => ({ ...c, productCount: map[c._id.toString()] || 0 })) });
  } catch (err) { next(err); }
};

// GET /api/categories/:id
exports.get = async (req, res, next) => {
  try {
    if (!can(req.user, "product:read") && !can(req.user, "product:*")) {
      throw new ApiError(403, "Forbidden");
    }
    const cat = await Category.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    }).lean();
    if (!cat) throw new ApiError(404, "Category not found");
    res.json({ data: cat });
  } catch (err) { next(err); }
};

// POST /api/categories
exports.create = async (req, res, next) => {
  try {
    if (!can(req.user, "product:*") && !can(req.user, "product:create")) {
      throw new ApiError(403, "Forbidden");
    }
    const { name, description, parent } = req.body;
    if (!name || !name.trim()) throw new ApiError(400, "name is required");

    const exists = await Category.findOne({
      organization: req.user.organization,
      name: name.trim(),
    });
    if (exists) throw new ApiError(409, "Category name already exists");

    const cat = await Category.create({
      organization: req.user.organization,
      name: name.trim(),
      description: description || null,
      parent: parent || null,
    });
    res.status(201).json({ data: cat });
  } catch (err) { next(err); }
};

// PATCH /api/categories/:id
exports.update = async (req, res, next) => {
  try {
    if (!can(req.user, "product:*") && !can(req.user, "product:update")) {
      throw new ApiError(403, "Forbidden");
    }
    const cat = await Category.findOneAndUpdate(
      { _id: req.params.id, organization: req.user.organization },
      { $set: pick(req.body, ["name", "description", "parent", "isActive"]) },
      { new: true, runValidators: true }
    );
    if (!cat) throw new ApiError(404, "Category not found");
    res.json({ data: cat });
  } catch (err) { next(err); }
};

// DELETE /api/categories/:id  (soft delete; blocks if it has products)
exports.remove = async (req, res, next) => {
  try {
    if (!can(req.user, "product:*") && !can(req.user, "product:delete")) {
      throw new ApiError(403, "Forbidden");
    }
    const cat = await Category.findOne({ _id: req.params.id, organization: req.user.organization });
    if (!cat) throw new ApiError(404, "Category not found");

    const productCount = await Product.countDocuments({
      organization: req.user.organization,
      category: cat._id,
      deletedAt: null,
    });
    if (productCount > 0) {
      throw new ApiError(409, `Cannot delete: ${productCount} product(s) still reference this category`);
    }

    cat.isActive = false;
    await cat.save();
    res.json({ success: true });
  } catch (err) { next(err); }
};

function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}