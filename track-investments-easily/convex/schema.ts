import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  stocks: defineTable({
    name: v.string(),
    quantity: v.number(),
    buyPrice: v.number(),
    buyDate: v.string(),
    isActive: v.boolean(), // true for holding, false for exited
    exitPrice: v.optional(v.number()),
    exitDate: v.optional(v.string()),
    exitQuantity: v.optional(v.number()), // Allow partial exits
  }),
  
  assets: defineTable({
    type: v.union(
      v.literal("schemes"),
      v.literal("cryptocurrency"),
      v.literal("stocks_investment"), // For stock investments without individual tracking
      v.literal("mutual_funds"),
      v.literal("commodities"),
      v.literal("commodity"), // Add singular form to match existing data
      v.literal("fd"),
      v.literal("rd"),
      v.literal("bonds")
    ),
    name: v.string(),
    investedAmount: v.number(),
    currentGain: v.optional(v.number()), // Current gain/loss
    
    // Commodity specific
    commodityType: v.optional(v.union(v.literal("gold"), v.literal("silver"))),
    
    // RD specific
    monthlyAmount: v.optional(v.number()),
    numberOfMonths: v.optional(v.number()),
    
    // Bonds specific
    bondType: v.optional(v.union(v.literal("government"), v.literal("corporate"))),
    returnRate: v.optional(v.number()),
    maturityDate: v.optional(v.string()),
  }),
});