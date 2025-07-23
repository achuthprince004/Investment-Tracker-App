import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const addAsset = mutation({
  args: {
    type: v.union(
      v.literal("schemes"),
      v.literal("cryptocurrency"),
      v.literal("stocks_investment"),
      v.literal("mutual_funds"),
      v.literal("commodities"),
      v.literal("commodity"),
      v.literal("fd"),
      v.literal("rd"),
      v.literal("bonds")
    ),
    name: v.string(),
    investedAmount: v.number(),
    currentGain: v.optional(v.number()),
    commodityType: v.optional(v.union(v.literal("gold"), v.literal("silver"))),
    monthlyAmount: v.optional(v.number()),
    numberOfMonths: v.optional(v.number()),
    bondType: v.optional(v.union(v.literal("government"), v.literal("corporate"))),
    returnRate: v.optional(v.number()),
    maturityDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("assets", args);
  },
});

export const updateAsset = mutation({
  args: {
    assetId: v.id("assets"),
    type: v.optional(v.union(
      v.literal("schemes"),
      v.literal("cryptocurrency"),
      v.literal("stocks_investment"),
      v.literal("mutual_funds"),
      v.literal("commodities"),
      v.literal("commodity"),
      v.literal("fd"),
      v.literal("rd"),
      v.literal("bonds")
    )),
    name: v.optional(v.string()),
    investedAmount: v.optional(v.number()),
    currentGain: v.optional(v.number()),
    commodityType: v.optional(v.union(v.literal("gold"), v.literal("silver"))),
    monthlyAmount: v.optional(v.number()),
    numberOfMonths: v.optional(v.number()),
    bondType: v.optional(v.union(v.literal("government"), v.literal("corporate"))),
    returnRate: v.optional(v.number()),
    maturityDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { assetId, ...updates } = args;
    return await ctx.db.patch(assetId, updates);
  },
});

export const deleteAsset = mutation({
  args: {
    assetId: v.id("assets"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.assetId);
  },
});

export const getAllAssets = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("assets").collect();
  },
});