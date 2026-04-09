const Collection = require("../models/Collection");

const findAll = () => Collection.find({}).sort({ createdAt: -1 });
const findBySlug = (slug) => Collection.findOne({ slug });
const findById = (id) => Collection.findById(id);

module.exports = {
  findAll,
  findBySlug,
  findById,
};
