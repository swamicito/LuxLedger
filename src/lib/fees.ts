export type Category =
  | "jewelry"
  | "cars"
  | "re_whole"
  | "re_fractional_primary"
  | "re_fractional_secondary";

export type PayMethod = "crypto" | "fiat";

export interface FeeQuoteInput {
  category: Category;
  priceUSD: number;
  payMethod: PayMethod;
  auction?: boolean;
}

export interface FeeQuote {
  buyerFeeUSD: number;
  sellerFeeUSD: number;
  platformFeeUSD: number;
  notes: string[];
}

const cfg = {
  defaultSplit: { buyer: 0.015, seller: 0.015 },
  min: { jewelry: 300, cars: 1500 },
  reWhole: { total: 0.01, capUSD: 50000 },
  reFrac: { primaryTotal: 0.005, secondaryTotal: 0.0025 },
  cryptoDiscountTotal: -0.005,
  fiatRailSurchargeTotal: 0.004,
  auctionBuyerPremium: 0.01,
};

export function quoteFees({ category, priceUSD, payMethod, auction }: FeeQuoteInput): FeeQuote {
  let buyerRate = cfg.defaultSplit.buyer;
  let sellerRate = cfg.defaultSplit.seller;
  const notes: string[] = [];

  if (category === "re_whole") {
    const total = Math.min(cfg.reWhole.total, cfg.reWhole.capUSD / priceUSD);
    buyerRate = total / 2; 
    sellerRate = total / 2;
    notes.push("Whole-property real estate cap applied where relevant.");
  } else if (category === "re_fractional_primary") {
    buyerRate = sellerRate = cfg.reFrac.primaryTotal / 2;
    notes.push("Fractional real estate (primary offering).");
  } else if (category === "re_fractional_secondary") {
    buyerRate = sellerRate = cfg.reFrac.secondaryTotal / 2;
    notes.push("Fractional real estate (secondary trade).");
  }

  if (payMethod === "crypto") {
    buyerRate += cfg.cryptoDiscountTotal / 2;
    sellerRate += cfg.cryptoDiscountTotal / 2;
    notes.push("Crypto discount applied (-0.5% total).");
  } else {
    buyerRate += cfg.fiatRailSurchargeTotal / 2;
    sellerRate += cfg.fiatRailSurchargeTotal / 2;
    notes.push("Fiat rail surcharge applied (+0.4% total).");
  }

  if (auction) {
    buyerRate += cfg.auctionBuyerPremium;
    notes.push("Auction buyer premium (+1%).");
  }

  let buyerFeeUSD = priceUSD * buyerRate;
  let sellerFeeUSD = priceUSD * sellerRate;

  if (category === "jewelry" && buyerFeeUSD + sellerFeeUSD < cfg.min.jewelry) {
    buyerFeeUSD = Math.max(buyerFeeUSD, cfg.min.jewelry / 2);
    sellerFeeUSD = Math.max(sellerFeeUSD, cfg.min.jewelry / 2);
    notes.push("Jewelry minimum fee applied ($300 total).");
  }
  if (category === "cars" && buyerFeeUSD + sellerFeeUSD < cfg.min.cars) {
    buyerFeeUSD = Math.max(buyerFeeUSD, cfg.min.cars / 2);
    sellerFeeUSD = Math.max(sellerFeeUSD, cfg.min.cars / 2);
    notes.push("Vehicle minimum fee applied ($1,500 total).");
  }

  const platformFeeUSD = buyerFeeUSD + sellerFeeUSD;
  return {
    buyerFeeUSD: +buyerFeeUSD.toFixed(2),
    sellerFeeUSD: +sellerFeeUSD.toFixed(2),
    platformFeeUSD: +platformFeeUSD.toFixed(2),
    notes,
  };
}
