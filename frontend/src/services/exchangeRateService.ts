export interface ExchangeRates {
  [key: string]: number;
}

let cachedRates: ExchangeRates = {};
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedRates = (): ExchangeRates | null => {
  if (
    Object.keys(cachedRates).length === 0 ||
    Date.now() - lastFetchTime > CACHE_DURATION
  ) {
    return null;
  }
  return cachedRates;
};

/**
 * Fetches exchange rates from the server
 * @returns A promise that resolves to an object with currency codes as keys and exchange rates as values
 */
export const fetchExchangeRates = async (): Promise<ExchangeRates> => {
  // Return cached rates if they exist and are not expired
  const cached = getCachedRates();
  if (cached) {
    return cached;
  }

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

    // Update cache
    cachedRates = ratesObj;
    lastFetchTime = Date.now();

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
    return {
      valid: false,
      error: `Exchange rate for ${fromCurrency} not found.`,
    };
  }

  if (!rates[toCurrency]) {
    return {
      valid: false,
      error: `Exchange rate for ${toCurrency} not found.`,
    };
  }

  return { valid: true };
};
