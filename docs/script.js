const FINNHUB_API_KEY = "d7sjdphr01qorsvivj30d7sjdphr01qorsvivj3g";
const NEWS_API_KEY = "pub_bccbf695c23245ab90bfdbf9489cde8f";

const $ = (id) => document.getElementById(id);

const topicButtons = document.querySelectorAll(".mood-card");
const topicTitle = $("topicTitle");
const topicText = $("topicText");
const topicQuestion = $("topicQuestion");
const assetGrid = $("assetGrid");
const newsList = $("newsList");
const apiStatus = $("apiStatus");
const signalTitle = $("signalTitle");
const signalText = $("signalText");

const topics = {
  bigPicture: {
    title: "Big picture market read",
    text: "Start by comparing the assets. If SPY and QQQ are up, investors may be comfortable taking risk. If gold is up while stocks are down, investors may be looking for safety.",
    question: "Are investors taking risk, avoiding risk, or reacting to a specific headline?"
  },
  stocks: {
    title: "SPY: broad stock market",
    text: "SPY is an ETF that tracks the S&P 500, which represents large U.S. companies. When SPY rises, it usually means investors are more confident about corporate earnings, growth, or the economy.",
    question: "Is the overall market moving up, or is strength limited to one sector?"
  },
  tech: {
    title: "QQQ: tech and growth stocks",
    text: "QQQ tracks the Nasdaq-100, which is heavily influenced by large technology and growth companies. It often reacts strongly to interest rates, AI momentum, and earnings expectations.",
    question: "Is tech leading the market or dragging it down?"
  },
  safety: {
    title: "Gold: the safety signal",
    text: "Gold is often watched as a safe-haven asset. If gold rises when stocks fall, it can suggest investors are nervous, worried about inflation, or looking for protection.",
    question: "Is gold moving because of fear, inflation, or rates?"
  },
  energy: {
    title: "Oil: the energy and geopolitics signal",
    text: "Oil matters because it affects inflation, transportation costs, and global growth. Big oil moves can come from supply concerns, geopolitical conflict, or changes in demand.",
    question: "Is oil moving because of supply risk or demand expectations?"
  },
  crypto: {
    title: "Crypto: risk appetite signal",
    text: "Bitcoin and Ethereum are risk-sensitive assets. When crypto rises with stocks, investors may be more willing to speculate. When crypto falls sharply, it can show risk appetite weakening.",
    question: "Is crypto confirming the stock market mood or moving differently?"
  }
};

const equityAssets = [
  { name: "S&P 500 ETF", label: "SPY tracks the S&P 500", symbol: "SPY", topic: "stocks" },
  { name: "Nasdaq ETF", label: "QQQ tracks the Nasdaq-100", symbol: "QQQ", topic: "tech" },
  { name: "Gold ETF", label: "GLD tracks gold exposure", symbol: "GLD", topic: "safety" },
  { name: "Oil ETF", label: "USO tracks oil exposure", symbol: "USO", topic: "energy" }
];

const cryptoAssets = [
  { name: "Bitcoin", label: "BTC/USD crypto pair", id: "bitcoin", topic: "crypto" },
  { name: "Ethereum", label: "ETH/USD crypto pair", id: "ethereum", topic: "crypto" }
];

const allAssets = [...equityAssets, ...cryptoAssets];

function setTopic(topicName) {
  const selected = topics[topicName] || topics.bigPicture;

  topicButtons.forEach((button) => button.classList.remove("active"));

  const activeButton = document.querySelector(`[data-topic="${topicName}"]`);
  if (activeButton) activeButton.classList.add("active");

  topicTitle.textContent = selected.title;
  topicText.textContent = selected.text;
  topicQuestion.textContent = selected.question;
}

function formatMoney(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return "Not loaded";

  return `$${number.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function formatPercent(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return "Change unavailable";

  const sign = number > 0 ? "+" : "";
  return `${sign}${number.toFixed(2)}% today`;
}

function renderLoadingCards() {
  assetGrid.innerHTML = allAssets.map((asset) => `
    <div class="asset-card">
      <div class="asset-label">${asset.label}</div>
      <h3>${asset.name}</h3>
      <div class="asset-value">Loading...</div>
      <div class="asset-change">pulling live data</div>
    </div>
  `).join("");
}

function renderAssets(assetData) {
  assetGrid.innerHTML = assetData.map((asset) => {
    const changeNumber = Number(asset.percentChange);
    const changeClass = changeNumber > 0 ? "positive" : changeNumber < 0 ? "negative" : "";

    return `
      <div class="asset-card" data-topic="${asset.topic}">
        <div class="asset-label">${asset.label}</div>
        <h3>${asset.name}</h3>
        <div class="asset-value">${asset.price}</div>
        <div class="asset-change ${changeClass}">${asset.changeText}</div>
      </div>
    `;
  }).join("");

  document.querySelectorAll(".asset-card").forEach((card) => {
    card.addEventListener("click", () => {
      setTopic(card.dataset.topic);
    });
  });
}

async function fetchFinnhubAsset(asset) {
  const url = `https://finnhub.io/api/v1/quote?symbol=${asset.symbol}&token=${FINNHUB_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok || !data || data.c === 0) {
    throw new Error(`Finnhub did not return ${asset.symbol}`);
  }

  return {
    name: asset.name,
    label: asset.label,
    symbol: asset.symbol,
    topic: asset.topic,
    price: formatMoney(data.c),
    percentChange: Number(data.dp),
    changeText: formatPercent(data.dp)
  };
}

async function fetchCryptoData() {
  const response = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true"
  );

  const data = await response.json();

  return cryptoAssets.map((asset) => {
    const coin = data[asset.id];

    return {
      name: asset.name,
      label: asset.label,
      topic: asset.topic,
      price: formatMoney(coin.usd),
      percentChange: Number(coin.usd_24h_change),
      changeText: formatPercent(coin.usd_24h_change)
    };
  });
}

function readMarketSignal(assetData) {
  const spy = assetData.find((asset) => asset.symbol === "SPY");
  const qqq = assetData.find((asset) => asset.symbol === "QQQ");
  const gld = assetData.find((asset) => asset.symbol === "GLD");
  const uso = assetData.find((asset) => asset.symbol === "USO");

  if (!spy || !qqq || !gld || !uso) {
    signalTitle.textContent = "Signal unavailable";
    signalText.textContent = "The signal detector needs SPY, QQQ, GLD, and USO to load.";
    return;
  }

  const stocksUp = spy.percentChange > 0 && qqq.percentChange > 0;
  const goldUp = gld.percentChange > 0;
  const oilUp = uso.percentChange > 0;

  if (stocksUp && !goldUp) {
    signalTitle.textContent = "Risk-on signal";
    signalText.textContent = "Stocks and tech are leading while gold is not. That usually suggests investors are more comfortable taking risk today.";
  } else if (!stocksUp && goldUp) {
    signalTitle.textContent = "Risk-off signal";
    signalText.textContent = "Gold is stronger while stocks are weaker. That can suggest investors are looking for safety.";
  } else if (oilUp && !stocksUp) {
    signalTitle.textContent = "Energy pressure signal";
    signalText.textContent = "Oil is moving up while stocks are not broadly strong. That can point to inflation pressure, supply concerns, or geopolitical risk.";
  } else {
    signalTitle.textContent = "Mixed market signal";
    signalText.textContent = "The assets are not all telling the same story. This is when comparing headlines with price moves matters most.";
  }
}

async function getMarketData() {
  if (FINNHUB_API_KEY === "PASTE_YOUR_FINNHUB_KEY_HERE" || FINNHUB_API_KEY.trim() === "") {
    apiStatus.textContent = "Finnhub key needed";
    assetGrid.innerHTML = `
      <div class="asset-card">
        <h3>API key needed</h3>
        <div class="asset-value">No live data yet</div>
        <div class="asset-change negative">Paste your Finnhub API key at the top of script.js.</div>
      </div>
    `;
    return;
  }

  apiStatus.textContent = "loading live prices...";
  renderLoadingCards();

  try {
    const equityResults = await Promise.allSettled(
      equityAssets.map((asset) => fetchFinnhubAsset(asset))
    );

    const successfulEquities = equityResults
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);

    const failedEquities = equityResults
      .filter((result) => result.status === "rejected")
      .map((result, index) => ({
        name: equityAssets[index].name,
        label: equityAssets[index].label,
        symbol: equityAssets[index].symbol,
        topic: equityAssets[index].topic,
        price: "Not loaded",
        percentChange: 0,
        changeText: "Finnhub did not return this asset"
      }));

    const cryptoResults = await fetchCryptoData();

    const finalData = [...successfulEquities, ...failedEquities, ...cryptoResults];

    renderAssets(finalData);
    readMarketSignal(finalData);

    const now = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });

    apiStatus.textContent = `live prices updated ${now}`;
  } catch (error) {
    console.error("Market data error:", error);
    apiStatus.textContent = "data issue";
  }
}

async function getGeopoliticalNews() {
  newsList.innerHTML = "<p>Loading global headlines...</p>";

  if (NEWS_API_KEY === "PASTE_YOUR_NEWSDATA_KEY_HERE" || NEWS_API_KEY.trim() === "") {
    newsList.innerHTML = `
      <div class="news-item">
        <strong>News API key needed</strong>
        <p class="news-source">Paste your NewsData.io API key at the top of script.js.</p>
      </div>
    `;
    return;
  }

  try {
    const query = encodeURIComponent("geopolitics OR oil OR inflation OR central bank OR trade");
    const url = `https://newsdata.io/api/1/latest?apikey=${NEWS_API_KEY}&q=${query}&language=en&category=business,world`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "success" || !data.results || data.results.length === 0) {
      throw new Error(data.results?.message || "No articles returned");
    }

    newsList.innerHTML = data.results.slice(0, 6).map((article) => `
      <div class="news-item">
        <a href="${article.link}" target="_blank" rel="noopener noreferrer">
          ${article.title}
        </a>
        <div class="news-source">
          ${article.source_name || "news source"}
        </div>
      </div>
    `).join("");

  } catch (error) {
    console.error("NewsData error:", error);

    newsList.innerHTML = `
      <div class="news-item">
        <strong>News is temporarily unavailable.</strong>
        <p class="news-source">Check your NewsData API key or refresh in a minute.</p>
      </div>
    `;
  }
}

function saveNote() {
  const input = $("noteInput");
  const note = input.value.trim();

  if (!note) return;

  const notes = JSON.parse(localStorage.getItem("marketDecoderNotes")) || [];
  notes.unshift(note);

  localStorage.setItem("marketDecoderNotes", JSON.stringify(notes));
  input.value = "";
  displayNotes();
}

function displayNotes() {
  const notes = JSON.parse(localStorage.getItem("marketDecoderNotes")) || [];

  $("notesList").innerHTML = notes.map((note) => `
    <li>${note}</li>
  `).join("");
}

function clearNotes() {
  localStorage.removeItem("marketDecoderNotes");
  displayNotes();
}

topicButtons.forEach((button) => {
  button.addEventListener("click", () => setTopic(button.dataset.topic));
});

document.querySelectorAll(".accordion-btn").forEach((button) => {
  button.addEventListener("click", () => {
    button.nextElementSibling.classList.toggle("open");
  });
});

$("saveNoteBtn").addEventListener("click", saveNote);
$("clearNotesBtn").addEventListener("click", clearNotes);

$("refreshBtn").addEventListener("click", () => {
  getMarketData();
  getGeopoliticalNews();
});

setTopic("bigPicture");
getMarketData();
getGeopoliticalNews();
displayNotes();
