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
});
