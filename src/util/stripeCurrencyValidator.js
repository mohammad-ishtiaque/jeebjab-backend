import httpStatus from "http-status";
import ApiError from "../error/ApiError.js";

// List of Stripe-supported currencies
const stripeCurrencies = new Set([
  "usd", "eur", "gbp", "bdt", "inr", "aud", "cad", "jpy", // ... (বাকিগুলো থাকবে)
]);

const stripeCurrencyValidator = (currency) => {
  const lowerCurrency = currency?.toLowerCase();
  
  if (!stripeCurrencies.has(lowerCurrency)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Unsupported currency: ${currency}. Stripe does not support this currency yet.`
    );
  }
  return true;
};

export default stripeCurrencyValidator;