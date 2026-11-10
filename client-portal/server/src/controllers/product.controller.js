const Product  = require("../models/Product");
const ApiError = require("../utils/ApiError");
const { can }  = require("../utils/permissions");

// GET /api/products?category=&q=&active=
exports.list = async (req, res, next) => {
  try {
    if (!can(req.user, "product:read") && !can(req.user, "product:*")) {
      throw new ApiError(403, "Forbidden");
    }
    const { category, q, active } = req.query;
    const filter = { organization: req.user.organization, deletedAt: null };
    if (category) filter.category = category;
    if (active !== undefined) filter.isActive = active === "true";
    if (q) filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { sku:  { $regex: q, $options: "i" } },
    ];

    const products = await Product.find(filter)
      .populate("category", "name")
      .sort({ name: 1 })
      .lean();
    res.json({ data: products });
  } catch (err) { next(err); }
};

// GET /api/products/:id
exports.get = async (req, res, next) => {
  try {
    if (!can(req.user, "product:read") && !can(req.user, "product:*")) {
      throw new ApiError(403, "Forbidden");
    }
    const product = await Product.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    }).populate("category", "name").lean();
    if (!product) throw new ApiError(404, "Product not found");
    res.json({ data: product });
  } catch (err) { next(err); }
};

// POST /api/products
exports.create = async (req, res, next) => {
  try {
    if (!can(req.user, "product:*") && !can(req.user, "product:create")) {
      throw new ApiError(403, "Forbidden");
    }
    const body = req.body;
    if (!body.sku || !body.name || body.price == null) {
      throw new ApiError(400, "sku, name, and price are required");
    }
    const dup = await Product.findOne({
      organization: req.user.organization,
      sku: body.sku.trim(),
      deletedAt: null,
    });
    if (dup) throw new ApiError(409, "A product with this SKU already exists");

    const product = await Product.create({
      organization: req.user.organization,
      category:     body.category || null,
      sku:          body.sku.trim(),
      name:         body.name.trim(),
      description:  body.description || null,
      unit:         body.unit || "each",
      price:        Number(body.price),
      costPrice:    Number(body.costPrice || 0),
      taxRate:      Number(body.taxRate ?? 15),
      manageStock:  !!body.manageStock,
      stockQuantity:Number(body.stockQuantity || 0),
      reorderLevel: Number(body.reorderLevel || 0),
      isActive:     body.isActive !== false,
    });
    res.status(201).json({ data: product });
  } catch (err) { next(err); }
};

// PATCH /api/products/:id
exports.update = async (req, res, next) => {
  try {
    if (!can(req.user, "product:*") && !can(req.user, "product:update")) {
      throw new ApiError(403, "Forbidden");
    }
    const allowed = [
      "category", "sku", "name", "description", "unit",
      "price", "costPrice", "taxRate",
      "manageStock", "stockQuantity", "reorderLevel", "isActive",
    ];
    const update = {};
    for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, organization: req.user.organization, deletedAt: null },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!product) throw new ApiError(404, "Product not found");
    res.json({ data: product });
  } catch (err) { next(err); }
};

// DELETE /api/products/:id  (soft delete)
exports.remove = async (req, res, next) => {
  try {
    if (!can(req.user, "product:*") && !can(req.user, "product:delete")) {
      throw new ApiError(403, "Forbidden");
    }
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, organization: req.user.organization, deletedAt: null },
      { $set: { deletedAt: new Date(), isActive: false } },
      { new: true }
    );
    if (!product) throw new ApiError(404, "Product not found");
    res.json({ success: true });
  } catch (err) { next(err); }
};