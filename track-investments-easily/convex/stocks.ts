import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const addStock = mutation({
  args: {
    name: v.string(),
    quantity: v.number(),
    buyPrice: v.number(),
    buyDate: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("stocks", {
      ...args,
      isActive: true,
    });
  },
});

export const updateStock = mutation({
  args: {
    stockId: v.id("stocks"),
    name: v.optional(v.string()),
    quantity: v.optional(v.number()),
    buyPrice: v.optional(v.number()),
    buyDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { stockId, ...updates } = args;
    return await ctx.db.patch(stockId, updates);
  },
});

export const deleteStock = mutation({
  args: {
    stockId: v.id("stocks"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.stockId);
  },
});

export const exitStock = mutation({
  args: {
    stockId: v.id("stocks"),
    exitPrice: v.number(),
    exitDate: v.string(),
    exitQuantity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const stock = await ctx.db.get(args.stockId);
    if (!stock) throw new Error("Stock not found");

    const exitQuantity = args.exitQuantity || stock.quantity;
    
    if (exitQuantity >= stock.quantity) {
      // Full exit
      return await ctx.db.patch(args.stockId, {
        isActive: false,
        exitPrice: args.exitPrice,
        exitDate: args.exitDate,
        exitQuantity,
      });
    } else {
      // Partial exit - create new exited stock entry and update original
      await ctx.db.insert("stocks", {
        name: stock.name,
        quantity: exitQuantity,
        buyPrice: stock.buyPrice,
        buyDate: stock.buyDate,
        isActive: false,
        exitPrice: args.exitPrice,
        exitDate: args.exitDate,
        exitQuantity,
      });

      // Update original stock with reduced quantity
      return await ctx.db.patch(args.stockId, {
        quantity: stock.quantity - exitQuantity,
      });
    }
  },
});

export const getActiveStocks = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("stocks")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const getExitedStocks = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("stocks")
      .filter((q) => q.eq(q.field("isActive"), false))
      .collect();
  },
});

export const getAllStocks = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("stocks").collect();
  },
});

export const getPortfolioSummary = query({
  args: {},
  handler: async (ctx) => {
    try {
      const activeStocks = await ctx.db
        .query("stocks")
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
      
      const exitedStocks = await ctx.db
        .query("stocks")
        .filter((q) => q.eq(q.field("isActive"), false))
        .collect();

      const assets = await ctx.db.query("assets").collect();

      const stocksHoldingValue = activeStocks.reduce(
        (sum, stock) => sum + (stock.quantity * stock.buyPrice), 0
      );

      const stocksExitedValue = exitedStocks.reduce(
        (sum, stock) => {
          const quantity = stock.exitQuantity || stock.quantity;
          return sum + (quantity * (stock.exitPrice || 0));
        }, 0
      );

      const assetsValue = assets.reduce(
        (sum, asset) => sum + asset.investedAmount + (asset.currentGain || 0), 0
      );

      const totalPortfolioCapital = stocksHoldingValue + assetsValue;

      return {
        totalPortfolioCapital,
        stocksHoldingValue,
        stocksExitedValue,
        assetsValue,
        activeStocksCount: activeStocks.length,
        exitedStocksCount: exitedStocks.length,
        assetsCount: assets.length,
      };
    } catch (error) {
      console.error("Error in getPortfolioSummary:", error);
      return {
        totalPortfolioCapital: 0,
        stocksHoldingValue: 0,
        stocksExitedValue: 0,
        assetsValue: 0,
        activeStocksCount: 0,
        exitedStocksCount: 0,
        assetsCount: 0,
      };
    }
  },
});

export const getPNLAnalytics = query({
  args: {},
  handler: async (ctx) => {
    try {
      const exitedStocks = await ctx.db
        .query("stocks")
        .filter((q) => q.eq(q.field("isActive"), false))
        .collect();

      if (exitedStocks.length === 0) {
        return {
          totalInvested: 0,
          totalRealized: 0,
          netProfitLoss: 0,
          netProfitLossPercentage: 0,
          averageHoldingDays: 0,
          bestTrade: null,
          worstTrade: null,
          winningTrades: 0,
          losingTrades: 0,
          totalTrades: 0,
        };
      }

      let totalInvested = 0;
      let totalRealized = 0;
      let totalHoldingDays = 0;
      let bestTrade = null;
      let worstTrade = null;
      let winningTrades = 0;
      let losingTrades = 0;
      let bestProfitPercentage = -Infinity;
      let worstLossPercentage = Infinity;

      for (const stock of exitedStocks) {
        const quantity = stock.exitQuantity || stock.quantity;
        const invested = quantity * stock.buyPrice;
        const realized = quantity * (stock.exitPrice || 0);
        const profitLoss = realized - invested;
        const profitLossPercentage = invested > 0 ? (profitLoss / invested) * 100 : 0;

        totalInvested += invested;
        totalRealized += realized;

        // Calculate holding period
        const buyDate = new Date(stock.buyDate);
        const exitDate = new Date(stock.exitDate || new Date());
        const holdingDays = Math.floor((exitDate.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
        totalHoldingDays += holdingDays;

        // Track winning/losing trades
        if (profitLoss > 0) {
          winningTrades++;
        } else if (profitLoss < 0) {
          losingTrades++;
        }

        // Track best trade
        if (profitLossPercentage > bestProfitPercentage) {
          bestProfitPercentage = profitLossPercentage;
          bestTrade = {
            name: stock.name,
            profitLossPercentage,
            profitLoss,
            holdingDays,
          };
        }

        // Track worst trade
        if (profitLossPercentage < worstLossPercentage) {
          worstLossPercentage = profitLossPercentage;
          worstTrade = {
            name: stock.name,
            profitLossPercentage,
            profitLoss,
            holdingDays,
          };
        }
      }

      const netProfitLoss = totalRealized - totalInvested;
      const netProfitLossPercentage = totalInvested > 0 ? (netProfitLoss / totalInvested) * 100 : 0;
      const averageHoldingDays = exitedStocks.length > 0 ? Math.floor(totalHoldingDays / exitedStocks.length) : 0;

      return {
        totalInvested,
        totalRealized,
        netProfitLoss,
        netProfitLossPercentage,
        averageHoldingDays,
        bestTrade,
        worstTrade,
        winningTrades,
        losingTrades,
        totalTrades: exitedStocks.length,
      };
    } catch (error) {
      console.error("Error in getPNLAnalytics:", error);
      return {
        totalInvested: 0,
        totalRealized: 0,
        netProfitLoss: 0,
        netProfitLossPercentage: 0,
        averageHoldingDays: 0,
        bestTrade: null,
        worstTrade: null,
        winningTrades: 0,
        losingTrades: 0,
        totalTrades: 0,
      };
    }
  },
});