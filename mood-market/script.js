const moodButtons = document.querySelectorAll(".mood-card");
const moodTitle = document.getElementById("moodTitle");
const moodText = document.getElementById("moodText");
const priceGrid = document.getElementById("priceGrid");
const apiStatus = document.getElementById("apiStatus");

const moodMessages = {
  confused: {
    title: "Confused Market View",
    text: "Start simple. If prices are green, investors are taking more risk today. If prices are red, investors may be pulling back. The goal is not to predict everything, but to understand the direction."
  },
  curious: {
    title: "Curious Market View",
    text: "Look for patterns across assets. If Bitcoin, Ethereum, and Solana are all moving in the same direction, that says more about overall risk appetite than one specific coin."
  },
  anxious: {
    title: "Anxious Market View",
    text: "A sharp move does not automatically mean panic. Markets are noisy. The better question is whether the move is connected to news, interest rates, earnings, or broader investor fear."
  },
  optimistic: {
    title: "Optimistic Market View",
    text: "When investors feel confident, riskier assets often rise first. Crypto can be a useful signal for whether investors are leaning toward growth and speculation."
  },
  focused: {
    title: "Focused Market View",
    text: "Compare the percentage changes. The asset with the biggest move is showing the strongest short-term reaction, but you still need context before calling it a trend."
  },
  skeptical: {
    title: "Skeptical Market View",
    text: "Do not trust one number alone. A green day can reverse quickly, and a red day can be temporary. Good analysis asks what changed and whether the reason actually matters."
  }
};

moodButtons.forEach((button) => {
  button.addEventListener("click", () => {
    moodButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    const selectedMood = button.dataset.mood;
    moodTitle.textContent = moodMessages[selectedMood].title;
    moodText.textContent = moodMessages[selectedMood].text;
  });
});

async function getMarketData() {
  apiStatus.textContent = "Loading live prices from CoinGecko...";
  priceGrid.innerHTML = "";

  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true"
    );

    const data = await response.json();

    const coins = [
      { id: "bitcoin", name: "Bitcoin" },
      { id: "ethereum", name: "Ethereum" },
      { id: "solana", name: "Solana" }
    ];

    coins.forEach((coin) => {
      const price = data[coin.id].usd;
      const change = data[coin.id].usd_24h_change;
      const changeClass = change >= 0 ? "positive" : "negative";
      const sign = change >= 0 ? "+" : "";

      const card = document.createElement("div");
      card.className = "price-box";

      card.innerHTML = `
        <h3>${coin.name}</h3>
        <p class="price">$${price.toLocaleString()}</p>
        <p class="${changeClass}">${sign}${change.toFixed(2)}% today</p>
      `;

      priceGrid.appendChild(card);
    });

    apiStatus.textContent = "Live market data loaded successfully.";
  } catch (error) {
    apiStatus.textContent = "The live API did not load. Try refreshing the page.";
  }
}

document.querySelectorAll(".accordion-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const content = button.nextElementSibling;
    content.classList.toggle("open");
  });
});

function saveNote() {
  const input = document.getElementById("noteInput");
  const notesList = document.getElementById("notesList");

  if (input.value.trim() === "") {
    return;
  }

  const notes = JSON.parse(localStorage.getItem("marketNotes")) || [];
  notes.push(input.value.trim());

  localStorage.setItem("marketNotes", JSON.stringify(notes));
  input.value = "";

  displayNotes();
}

function displayNotes() {
  const notesList = document.getElementById("notesList");
  const notes = JSON.parse(localStorage.getItem("marketNotes")) || [];

  notesList.innerHTML = "";

  notes.forEach((note) => {
    const li = document.createElement("li");
    li.textContent = note;
    notesList.appendChild(li);
  });
}

function clearNotes() {
  localStorage.removeItem("marketNotes");
  displayNotes();
}

document.getElementById("saveNoteBtn").addEventListener("click", saveNote);
document.getElementById("clearNotesBtn").addEventListener("click", clearNotes);
document.getElementById("refreshBtn").addEventListener("click", getMarketData);

getMarketData();
displayNotes();