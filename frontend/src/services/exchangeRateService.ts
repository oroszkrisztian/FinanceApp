import { CurrencyType } from "../interfaces/enums";

export interface ExchangeRates {
  [key: string]: number;
}

/**
 * Fetches exchange rates from the server
 * @returns A promise that resolves to an object with currency codes as keys and exchange rates as values
 */
export const fetchExchangeRates = async (): Promise<ExchangeRates> => {
  try {
    const response = await fetch("http://localhost:3000/exchange-rates");
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    const ratesObj: ExchangeRates = {};
    const rateElements = xmlDoc.getElementsByTagName("Rate");
    
    for (let i = 0; i < rateElements.length; i++) {
      const element = rateElements[i];
      const currency = element.getAttribute("currency") || "";
      const multiplier = element.getAttribute("multiplier")
        ? parseInt(element.getAttribute("multiplier") || "1")
        : 1;
      const value = parseFloat(element.textContent || "0") / multiplier;
      if (currency && value) ratesObj[currency] = value;
    }

    ratesObj["RON"] = 1;

    Object.values(CurrencyType).forEach((curr) => {
      if (!ratesObj[curr]) ratesObj[curr] = 1;
    });

    return ratesObj;
  } catch (err) {
    console.error("Error fetching exchange rates:", err);
    throw new Error("Could not fetch exchange rates. Please try again later.");
  }
};

/**
 * Converts an amount from one currency to another
 * @param amount The amount to convert
 * @param fromCurrency The currency to convert from
 * @param toCurrency The currency to convert to
 * @param rates The exchange rates object
 * @returns The converted amount
 */
export const convertAmount = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates
): number => {
  if (fromCurrency === toCurrency) return amount;
  if (!rates[fromCurrency] || !rates[toCurrency]) return amount;

  if (fromCurrency === "RON") {
    return amount / rates[toCurrency];
  } else if (toCurrency === "RON") {
    return amount * rates[fromCurrency];
  } else {
    const amountInRON = amount * rates[fromCurrency];
    return amountInRON / rates[toCurrency];
  }
};

/**
 * Calculates the exchange rate between two currencies
 * @param fromCurrency The currency to convert from
 * @param toCurrency The currency to convert to 
 * @param rates The exchange rates object
 * @returns The exchange rate as a number
 */
export const getExchangeRate = (
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates
): number => {
  if (fromCurrency === toCurrency) return 1;
  if (!rates[fromCurrency] || !rates[toCurrency]) return 0;
  
  return rates[fromCurrency] / rates[toCurrency];
};

/**
 * Validates if conversion between two currencies is possible
 * @param fromCurrency The currency to convert from
 * @param toCurrency The currency to convert to
 * @param rates The exchange rates object
 * @returns An object with validity status and error message if invalid
 */
export const validateCurrencyConversion = (
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates
): { valid: boolean; error?: string } => {
  if (!fromCurrency || !toCurrency) {
    return { valid: false, error: "Currency not specified" };
  }

  if (!rates[fromCurrency]) {
    return { valid: false, error: `Exchange rate for ${fromCurrency} not found.` };
  }

  if (!rates[toCurrency]) {
    return { valid: false, error: `Exchange rate for ${toCurrency} not found.` };
  }

  return { valid: true };
};