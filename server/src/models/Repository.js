const mongoose = require("mongoose");

const repositorySchema = new mongoose.Schema(
  {
    githubId: {
      type: Number,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    owner: {
      type: String,
      required: true,
      trim: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: null,
    },

    isPrivate: {
      type: Boolean,
      default: false,
    },

    defaultBranch: {
      type: String,
      required: true,
    },

    language: {
      type: String,
      default: null,
    },

    stars: {
      type: Number,
      default: 0,
    },

    forks: {
      type: Number,
      default: 0,
    },

    userId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent the same user from adding the same repository twice.
repositorySchema.index({ githubId: 1, userId: 1 }, { unique: true });

const Repository = mongoose.model("Repository", repositorySchema);

module.exports = Repository;
