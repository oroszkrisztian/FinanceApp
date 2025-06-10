export interface ExchangeRates {
  [key: string]: number;
}

let cachedRates: ExchangeRates = {};
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; 

export const getCachedRates = (): ExchangeRates | null => {
  if (
    Object.keys(cachedRates).length === 0 ||
    Date.now() - lastFetchTime > CACHE_DURATION
  ) {
    return null;
  }
  return cachedRates;
};


export const fetchExchangeRates = async (): Promise<ExchangeRates> => {
  const cached = getCachedRates();
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch("https://financeapp-bg0k.onrender.com/exchange-rates");
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

    cachedRates = ratesObj;
    lastFetchTime = Date.now();

    return ratesObj;
  } catch (err) {
    console.error("Error fetching exchange rates:", err);
    throw new Error("Could not fetch exchange rates. Please try again later.");
  }
};


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


export const getExchangeRate = (
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates
): number => {
  if (fromCurrency === toCurrency) return 1;
  if (!rates[fromCurrency] || !rates[toCurrency]) return 0;

  return rates[fromCurrency] / rates[toCurrency];
};


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
