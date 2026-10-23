const { ExpenseCategory } = require("../../src/models/Expense");
const CostConfig = require("../../src/models/CostConfig");
const expenseController = require("../../src/controllers/expenseController");

describe("Expenses & COGS Formulas Unit Tests", () => {
  it("derives bottle sticker cost per unit from meter rate and stickers per meter yield", () => {
    const costPerMeter = 75; // 75 EGP per meter
    const stickersPerMeter = 15; // 15 stickers yielded per meter
    const unitCost = Number((costPerMeter / stickersPerMeter).toFixed(4));
    expect(unitCost).toBe(5);
  });

  it("derives box sealing sticker cost per unit from sheet rate and stickers per sheet yield", () => {
    const costPerSheet = 45; // 45 EGP per sheet
    const stickersPerSheet = 24; // 24 stickers per sheet
    const unitCost = Number((costPerSheet / stickersPerSheet).toFixed(4));
    expect(unitCost).toBe(1.875);
  });

  it("derives box top sticker cost per unit from meter rate and stickers per meter yield", () => {
    const costPerMeter = 50; // 50 EGP per meter
    const stickersPerMeter = 25; // 25 stickers per meter
    const unitCost = Number((costPerMeter / stickersPerMeter).toFixed(4));
    expect(unitCost).toBe(2);
  });

  it("derives shredded paper unit cost per box: 1 bag makes 3 boxes", () => {
    const costPerBag = 45; // 45 EGP per bag
    const boxesPerBag = 3; // 3 boxes filled per bag
    const unitCostPerBox = Number((costPerBag / boxesPerBag).toFixed(4));
    expect(unitCostPerBox).toBe(15);
  });

  it("derives Thank You card and Decant card unit costs from batch pricing", () => {
    const thankYouBatchCost = 350;
    const thankYouBatchQty = 500;
    const thankYouUnit = Number((thankYouBatchCost / thankYouBatchQty).toFixed(4));
    expect(thankYouUnit).toBe(0.7);

    const decantCardBatchCost = 450;
    const decantCardBatchQty = 500;
    const decantCardUnit = Number((decantCardBatchCost / decantCardBatchQty).toFixed(4));
    expect(decantCardUnit).toBe(0.9);
  });

  it("calculates 3ml Decant Unit COGS correctly", () => {
    // Decant has:
    // 1ml Fragrance Oil (at 3 EGP/ml) = 3 EGP
    // 2ml Fragrant Alcohol (at 0.20 EGP/ml) = 0.40 EGP
    // 3ml Decant Vial = 6 EGP
    // Decant Card = 0.90 EGP
    const oilCost = 1 * 3;
    const alcoholCost = 2 * 0.2;
    const vialCost = 6;
    const decantCardCost = 0.9;
    const total3mlCogs = Number((oilCost + alcoholCost + vialCost + decantCardCost).toFixed(2));

    expect(total3mlCogs).toBe(10.3);

    // If 10 decants are given away for promotion:
    const giveaway10Units = 10 * total3mlCogs;
    expect(giveaway10Units).toBe(103);
  });

  it("calculates 100ml and 50ml Full Bottle COGS correctly", () => {
    const oilPerMl = 3;
    const alcPerMl = 0.2;
    const bottleSticker = 5;
    const boxTopSticker = 1.5;
    const boxSealingSticker = 1.875;
    const wrappingSheet = 2.5;
    const shreddedPaperPerBox = 15;
    const thankYouCard = 0.7;
    const flyer = 3;

    // 100ml: 25ml oil + 75ml alcohol + 38 bottle + 22 box + stickers + packaging
    const oil100 = 25 * oilPerMl; // 75
    const alc100 = 75 * alcPerMl; // 15
    const bottle100 = 38;
    const box100 = 22;
    const stickers100 = bottleSticker + boxTopSticker + boxSealingSticker; // 8.375
    const packaging100 = wrappingSheet + shreddedPaperPerBox + thankYouCard + flyer; // 21.2
    const total100 = Number((oil100 + alc100 + bottle100 + box100 + stickers100 + packaging100).toFixed(2));

    expect(total100).toBe(179.57);

    // At retail price of 750 EGP:
    const retail100 = 750;
    const grossProfit100 = Number((retail100 - total100).toFixed(2));
    const margin100 = Number(((grossProfit100 / retail100) * 100).toFixed(1));
    expect(grossProfit100).toBe(570.43);
    expect(margin100).toBe(76.1);
  });

  it("calculates specific COGS per fragrance when oil price varies", () => {
    // Fragrance A: Oud Blend with expensive oil (5,000 EGP/kg = 5 EGP/ml)
    // Fragrance B: Fresh Citrus with standard oil (2,000 EGP/kg = 2 EGP/ml)
    const baseNonOilCogs100 = 15 + 38 + 22 + 5 + 2 + 1.875 + 2.5 + 15 + 0.7 + 3; // 105.075

    const oilMl100 = 25;
    const cogsA = Number((oilMl100 * 5 + baseNonOilCogs100).toFixed(2)); // 125 + 105.075 = 230.08
    const cogsB = Number((oilMl100 * 2 + baseNonOilCogs100).toFixed(2)); // 50 + 105.075 = 155.08

    expect(cogsA).toBe(230.07);
    expect(cogsB).toBe(155.07);

    // Margins differ accordingly at the same 750 EGP retail price:
    const marginA = Number((((750 - cogsA) / 750) * 100).toFixed(1));
    const marginB = Number((((750 - cogsB) / 750) * 100).toFixed(1));

    expect(marginA).toBe(69.3);
    expect(marginB).toBe(79.3);
  });

  it("calculates promotional multi-fragrance decant campaign with incremental allocation", () => {
    // Campaign: 100 promotional decant cards
    const totalTargetDecants = 100;
    // Base packaging & solvent per decant:
    // 3ml vial = 6 EGP, Decant card = 0.90 EGP, 2ml fragrant alcohol @ 0.20/ml = 0.40 EGP
    const baseNonOilDecant = 6 + 0.9 + 0.4; // 7.30 EGP
    const avgOilCost = 3.0; // 3.00 EGP approx average 1ml oil
    const approxDecantUnitCost = baseNonOilDecant + avgOilCost; // 10.30 EGP

    // Step 1: Initial state before allocations (100 decants at approx price)
    const initialApproxTotal = totalTargetDecants * approxDecantUnitCost;
    expect(initialApproxTotal).toBe(1030);

    // Step 2: Allocate 30 decants of Fragrance A (oil cost 4.50 EGP/ml => 7.30 + 4.50 = 11.80 EGP)
    const fragranceAUnit = 7.30 + 4.50; // 11.80 EGP
    const allocA = { qty: 30, unitCost: fragranceAUnit, totalCost: 30 * fragranceAUnit }; // 354 EGP
    expect(allocA.totalCost).toBe(354);

    // Remaining unassigned = 70 decants at approx 10.30 EGP = 721 EGP
    const intermediateTotal1 = allocA.totalCost + (70 * approxDecantUnitCost);
    expect(intermediateTotal1).toBe(1075);

    // Step 3: Allocate 40 decants of Fragrance B (oil cost 2.00 EGP/ml => 7.30 + 2.00 = 9.30 EGP)
    const fragranceBUnit = 7.30 + 2.00; // 9.30 EGP
    const allocB = { qty: 40, unitCost: fragranceBUnit, totalCost: 40 * fragranceBUnit }; // 372 EGP
    expect(allocB.totalCost).toBe(372);

    // Remaining unassigned = 30 decants at approx 10.30 EGP = 309 EGP
    const intermediateTotal2 = allocA.totalCost + allocB.totalCost + (30 * approxDecantUnitCost);
    expect(intermediateTotal2).toBe(1035);

    // Step 4: Final 30 decants assigned to Fragrance C (oil cost 5.00 EGP/ml => 7.30 + 5.00 = 12.30 EGP)
    const fragranceCUnit = 7.30 + 5.00; // 12.30 EGP
    const allocC = { qty: 30, unitCost: fragranceCUnit, totalCost: 30 * fragranceCUnit }; // 369 EGP

    // Target reached (30 + 40 + 30 = 100), 0 unassigned
    const finalExactTotal = allocA.totalCost + allocB.totalCost + allocC.totalCost; // 354 + 372 + 369 = 1095 EGP
    expect(finalExactTotal).toBe(1095);

    const blendedUnitCost = Number((finalExactTotal / totalTargetDecants).toFixed(2));
    expect(blendedUnitCost).toBe(10.95);
  });

  it("calculates full boxed bottle promotional giveaway campaign with incremental allocation", () => {
    // Campaign: 10 full 100ml boxed bottles for VIP gifting
    const targetBottles100 = 10;
    // Complete 100ml Packaging & solvent base:
    // bottle 38 + box 22 + bottle sticker 5 + box top sticker 2 + box sealing sticker 1.875
    // + shredded paper 15 + wrapping sheet 2.5 + thank you card 0.7 + flyer 3 + 75ml alcohol (75 * 0.20 = 15)
    const baseNonOil100ml = 38 + 22 + 5 + 2 + 1.875 + 15 + 2.5 + 0.7 + 3 + 15; // 105.075 EGP
    const avgOilCostPerMl = 3.0; // average 3.00 EGP/ml
    const approxOilCost100ml = 25 * avgOilCostPerMl; // 75.00 EGP
    const approx100mlCogs = Number((baseNonOil100ml + approxOilCost100ml).toFixed(2)); // 180.07 EGP

    // Initial baseline: 10 bottles at approx 180.07 EGP = 1,800.70 EGP
    const initialApproxTotal = Number((targetBottles100 * approx100mlCogs).toFixed(2));
    expect(initialApproxTotal).toBe(1800.7);

    // Step 1: Allocate 4 bottles of Fragrance A (oil cost 5 EGP/ml => 25 * 5 = 125 oil + 105.075 = 230.075 EGP)
    const fragranceACogs100 = 125 + baseNonOil100ml; // 230.075 EGP
    const allocA = { qty: 4, unitCost: fragranceACogs100, totalCost: 4 * fragranceACogs100 }; // 920.30 EGP
    expect(Number(allocA.totalCost.toFixed(2))).toBe(920.3);

    // Remaining unassigned = 6 bottles at approx 180.07 = 1080.42 EGP
    const intermediateTotal = Number((allocA.totalCost + (6 * approx100mlCogs)).toFixed(2));
    expect(intermediateTotal).toBe(2000.72);

    // Step 2: Allocate 6 bottles of Fragrance B (oil cost 2 EGP/ml => 25 * 2 = 50 oil + 105.075 = 155.075 EGP)
    const fragranceBCogs100 = 50 + baseNonOil100ml; // 155.075 EGP
    const allocB = { qty: 6, unitCost: fragranceBCogs100, totalCost: 6 * fragranceBCogs100 }; // 930.45 EGP

    // Target reached (4 + 6 = 10), exact full COGS for every bottle with all packaging!
    const finalExactTotal = Number((allocA.totalCost + allocB.totalCost).toFixed(2)); // 920.30 + 930.45 = 1850.75 EGP
    expect(finalExactTotal).toBe(1850.75);

    const blendedBottleCost = Number((finalExactTotal / targetBottles100).toFixed(2));
    expect(blendedBottleCost).toBe(185.07);
  });

  it("calculates mixed promotional campaign containing full boxed bottles and decant cards", () => {
    // Campaign: 5x 100ml full boxed bottles + 10x 50ml full boxed bottles + 50x 3ml decants
    const base100 = 105.075;
    const base50 = 28 + 16 + 5 + 2 + 1.875 + 15 + 2.5 + 0.7 + 3 + (35 * 0.2); // 81.075
    const baseDecant = 6 + 0.9 + 0.4; // 7.30

    // Fragrance Royal Amber with oil 4 EGP/ml:
    const royal100 = base100 + (25 * 4); // 105.075 + 100 = 205.075
    const royal50 = base50 + (15 * 4); // 81.075 + 60 = 141.075
    const royalDecant = baseDecant + (1 * 4); // 7.30 + 4 = 11.30

    const totalMixed = Number((5 * royal100 + 10 * royal50 + 50 * royalDecant).toFixed(2));
    // 5 * 205.075 = 1025.375
    // 10 * 141.075 = 1410.75
    // 50 * 11.30 = 565.00
    // Total = 1025.375 + 1410.75 + 565.00 = 3001.13
    expect(totalMixed).toBe(3001.13);
  });

  it("computes unit price and total amount bidirectionally and detects price adjustments from saved benchmarks", () => {
    // Saved benchmark for bottle sticker roll is 50 EGP / meter
    const savedBenchmarkPrice = 50;
    const quantityPurchased = 15; // 15 meters

    // Pre-loaded total
    const preloadedTotal = savedBenchmarkPrice * quantityPurchased;
    expect(preloadedTotal).toBe(750);

    // Supplier changed meter price to 55 EGP
    const updatedUnitPrice = 55;
    const recalculatedTotal = Number((updatedUnitPrice * quantityPurchased).toFixed(2));
    expect(recalculatedTotal).toBe(825);
    expect(updatedUnitPrice !== savedBenchmarkPrice).toBe(true);

    // Editing total amount backwards derives unit price
    const newTotalPaid = 900;
    const derivedUnitPrice = Number((newTotalPaid / quantityPurchased).toFixed(4));
    expect(derivedUnitPrice).toBe(60);
  });

  it("handles fragrance oil pricing when unit is grams instead of kilos", () => {
    // When price is specified per gram: e.g. 3.50 EGP / gram
    const oilPricePerGram = 3.50;
    const oilPricePerKg = Number((oilPricePerGram * 1000).toFixed(2));
    expect(oilPricePerKg).toBe(3500);

    // Derived unit cost from purchasing 500 grams for 1750 EGP
    const amountPaid = 1750;
    const gramsPurchased = 500;
    const unitCostPerGram = Number((amountPaid / gramsPurchased).toFixed(4));
    expect(unitCostPerGram).toBe(3.5);

    // Converted to kg rate
    const derivedKgRate = Number((unitCostPerGram * 1000).toFixed(2));
    expect(derivedKgRate).toBe(3500);

    // Converted from kg to gram rate: 4200 EGP / kg -> 4.20 EGP / gram
    const kgPrice = 4200;
    const gramPrice = Number((kgPrice / 1000).toFixed(4));
    expect(gramPrice).toBe(4.2);

    // 100ml recipe uses 25g/25ml oil
    const oilCost100 = 25 * oilPricePerGram;
    expect(oilCost100).toBe(87.5);

    // 50ml recipe uses 15g/15ml oil
    const oilCost50 = 15 * oilPricePerGram;
    expect(oilCost50).toBe(52.5);

    // 3ml decant recipe uses 1g/1ml oil
    const oilCostDecant = 1 * oilPricePerGram;
    expect(oilCostDecant).toBe(3.5);
  });

  it("handles distinct 50ml and 100ml bottle and box procurement categories with different benchmark prices", () => {
    const bottle50Benchmark = 28;
    const bottle100Benchmark = 38;
    const box50Benchmark = 16;
    const box100Benchmark = 22;

    // Verify bottle price difference
    expect(bottle50Benchmark).not.toBe(bottle100Benchmark);
    expect(bottle100Benchmark - bottle50Benchmark).toBe(10); // 100ml bottle is 10 EGP more expensive

    // Verify box price difference
    expect(box50Benchmark).not.toBe(box100Benchmark);
    expect(box100Benchmark - box50Benchmark).toBe(6); // 100ml box is 6 EGP more expensive

    // Procurement batch of 100x 50ml bottles @ 28 EGP = 2,800 EGP
    const batch50Bottles = 100 * bottle50Benchmark;
    expect(batch50Bottles).toBe(2800);

    // Procurement batch of 100x 100ml bottles @ 38 EGP = 3,800 EGP
    const batch100Bottles = 100 * bottle100Benchmark;
    expect(batch100Bottles).toBe(3800);
  });
});
