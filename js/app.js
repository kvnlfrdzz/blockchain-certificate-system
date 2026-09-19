/* ============================================
   CertChain — App Logic
   Wallet connect + Smart Contract interaction
   ============================================ */

// ---- Config ----
const CONFIG = {
  // Replace with your deployed contract address after deployment
  contractAddress: "0x398F3c91994815f70968e8b914173B84822067fE",

  // Owner wallet (Kevin)
  ownerAddress: "0x1c8F5CF7838624C9Ec7383EEBcc78A4aFc6f35fF",

  // BOT Chain Testnet
  testnet: {
    chainId: "0x3C8",          // 968 in hex
    chainName: "BOT Chain Testnet",
    rpcUrl: "https://rpc.bohr.life",
    explorer: "https://scan.bohr.life",
    symbol: "BOT",
    decimals: 18
  },

  // BOT Chain Mainnet
  mainnet: {
    chainId: "0x2A5",          // 677 in hex
    chainName: "BOT Chain Mainnet",
    rpcUrl: "https://rpc.botchain.ai",
    explorer: "https://scan.botchain.ai",
    symbol: "BOT",
    decimals: 18
  }
};

// Switch to mainnet for production, testnet for testing
const NETWORK = CONFIG.testnet;

// ---- Contract ABI ----
const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "id", "type": "uint256" },
      { "indexed": true, "name": "recipient", "type": "address" },
      { "indexed": false, "name": "recipientName", "type": "string" },
      { "indexed": false, "name": "eventName", "type": "string" },
      { "indexed": false, "name": "category", "type": "string" },
      { "indexed": false, "name": "issuedAt", "type": "uint256" }
    ],
    "name": "CertificateIssued",
    "type": "event"
  },
  {
    "inputs": [
      { "name": "_recipient", "type": "address" },
      { "name": "_recipientName", "type": "string" },
      { "name": "_eventName", "type": "string" },
      { "name": "_category", "type": "string" }
    ],
    "name": "issueCertificate",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "_id", "type": "uint256" }],
    "name": "getCertificate",
    "outputs": [
      { "name": "id", "type": "uint256" },
      { "name": "recipient", "type": "address" },
      { "name": "recipientName", "type": "string" },
      { "name": "eventName", "type": "string" },
      { "name": "category", "type": "string" },
      { "name": "issuedAt", "type": "uint256" },
      { "name": "exists", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "_wallet", "type": "address" }],
    "name": "getWalletCertificates",
    "outputs": [{ "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalCertificates",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// ---- State ----
let provider = null;
let signer = null;
let contract = null;
let connectedAddress = null;

// ---- DOM Elements ----
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ---- Init ----
document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  loadTotalCerts();
  autoConnect();
});

// Auto-connect if wallet already connected before
async function autoConnect() {
  if (!window.ethereum) return;
  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts && accounts.length > 0) {
      await switchNetwork();
      provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
      connectedAddress = await signer.getAddress();
      contract = new ethers.Contract(CONFIG.contractAddress, CONTRACT_ABI, signer);
      updateConnectedUI();
      loadMyCertificates();
      loadTotalCerts();
    }
  } catch (err) {
    // Silently fail — auto-connect is best effort
  }
}

function bindEvents() {
  // Connect wallet buttons
  $("#btn-connect").addEventListener("click", () => { Audio.sfx.click(); connectWallet(); });
  $("#btn-hero-connect").addEventListener("click", () => { Audio.sfx.click(); connectWallet(); });

  // Disconnect button
  $("#btn-disconnect").addEventListener("click", () => { Audio.sfx.disconnect(); disconnectWallet(); });

  // Mute button
  $("#btn-mute").addEventListener("click", () => {
    const muted = Audio.toggleMute();
    $("#icon-sound-on").style.display = muted ? "none" : "block";
    $("#icon-sound-off").style.display = muted ? "block" : "none";
    $("#btn-mute").classList.toggle("muted", muted);
  });

  // Issue form
  $("#form-issue").addEventListener("submit", handleIssue);

  // Verify button
  $("#btn-verify").addEventListener("click", () => { Audio.sfx.click(); handleVerify(); });

  // All other buttons — generic click sound
  document.querySelectorAll(".btn--outline, .nav__link, .footer__link").forEach(el => {
    el.addEventListener("click", () => Audio.sfx.click());
  });

  // Smooth scroll for nav links
  $$(".nav__link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.getAttribute("href");
      const section = $(target);
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // Hero verify button
  $("#btn-hero-verify").addEventListener("click", (e) => {
    e.preventDefault();
    Audio.sfx.click();
    $("#verify").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // Listen for account/chain changes
  if (window.ethereum) {
    window.ethereum.on("accountsChanged", handleAccountChange);
    window.ethereum.on("chainChanged", () => window.location.reload());
  }
}

// ---- Wallet Connection ----
async function connectWallet() {
  if (!window.ethereum) {
    showToast("MetaMask not detected. Please install MetaMask.", "error");
    return;
  }

  try {
    // Request accounts
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts"
    });

    if (!accounts.length) return;

    // Switch to correct network
    await switchNetwork();

    // Setup provider + signer
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    connectedAddress = await signer.getAddress();

    // Setup contract
    contract = new ethers.Contract(
      CONFIG.contractAddress,
      CONTRACT_ABI,
      signer
    );

    // Update UI
    updateConnectedUI();
    loadMyCertificates();
    loadTotalCerts();

    if (typeof Audio !== "undefined" && Audio.sfx) Audio.sfx.connect();
    showToast("Wallet connected", "success");
  } catch (err) {
    console.error("Connect error:", err);
    if (err.code === 4001) {
      showToast("Connection rejected by user", "error");
    } else {
      showToast("Failed to connect wallet", "error");
    }
  }
}

async function switchNetwork() {
  const currentChainId = await window.ethereum.request({
    method: "eth_chainId"
  });

  if (currentChainId === NETWORK.chainId) return;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: NETWORK.chainId }]
    });
  } catch (switchErr) {
    // Chain not added — add it
    if (switchErr.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: NETWORK.chainId,
          chainName: NETWORK.chainName,
          nativeCurrency: {
            name: NETWORK.symbol,
            symbol: NETWORK.symbol,
            decimals: NETWORK.decimals
          },
          rpcUrls: [NETWORK.rpcUrl],
          blockExplorerUrls: [NETWORK.explorer]
        }]
      });
    } else {
      throw switchErr;
    }
  }
}

function handleAccountChange(accounts) {
  if (!accounts.length) {
    resetUI();
    return;
  }
  window.location.reload();
}

// ---- UI Updates ----
function updateConnectedUI() {
  const short = connectedAddress.slice(0, 6) + "..." + connectedAddress.slice(-4);

  // Update connect button
  const btnConnect = $("#btn-connect");
  btnConnect.textContent = short;
  btnConnect.classList.add("connected");

  // Show disconnect button
  $("#btn-disconnect").style.display = "inline-flex";

  const btnHero = $("#btn-hero-connect");
  btnHero.textContent = short;
  btnHero.classList.add("connected");
  btnHero.disabled = true;

  // Show issue section if owner
  const isOwner = connectedAddress.toLowerCase() === CONFIG.ownerAddress.toLowerCase();
  const issueSection = $("#issue");
  const navIssue = $("#nav-issue");

  if (isOwner) {
    issueSection.style.display = "block";
    navIssue.style.display = "inline";
  }
}

function disconnectWallet() {
  resetUI();
  showToast("Wallet disconnected", "info");
}

function resetUI() {
  connectedAddress = null;
  provider = null;
  signer = null;
  contract = null;

  const btnConnect = $("#btn-connect");
  btnConnect.textContent = "Connect Wallet";
  btnConnect.classList.remove("connected");

  // Hide disconnect button
  $("#btn-disconnect").style.display = "none";

  const btnHero = $("#btn-hero-connect");
  btnHero.textContent = "Connect Wallet";
  btnHero.classList.remove("connected");
  btnHero.disabled = false;

  $("#issue").style.display = "none";
  $("#nav-issue").style.display = "none";
  $("#cert-grid").innerHTML = "";
  $("#cert-empty").style.display = "block";
}

// ---- Issue Certificate ----
async function handleIssue(e) {
  e.preventDefault();

  if (!contract || !signer) {
    showToast("Connect your wallet first", "error");
    return;
  }

  const recipient = $("#input-recipient").value.trim();
  const name = $("#input-name").value.trim();
  const eventName = $("#input-event").value.trim();
  const category = $("#input-category").value;

  if (!recipient || !name || !eventName || !category) {
    showToast("Fill in all fields", "error");
    return;
  }

  // Validate address
  if (!ethers.isAddress(recipient)) {
    showToast("Invalid wallet address", "error");
    return;
  }

  const btnIssue = $("#btn-issue");
  btnIssue.textContent = "Issuing...";
  btnIssue.classList.add("btn--loading");

  try {
    const tx = await contract.issueCertificate(
      recipient,
      name,
      eventName,
      category
    );

    showToast("Transaction submitted. Waiting for confirmation...", "info");

    const receipt = await tx.wait();

    // Extract certificate ID from event
    let certId = "N/A";
    if (receipt.logs && receipt.logs.length > 0) {
      try {
        const iface = new ethers.Interface(CONTRACT_ABI);
        for (const log of receipt.logs) {
          try {
            const parsed = iface.parseLog({ topics: log.topics, data: log.data });
            if (parsed && parsed.name === "CertificateIssued") {
              certId = parsed.args.id.toString();
              break;
            }
          } catch (_) { /* skip logs we can't parse */ }
        }
      } catch (_) { /* fallback */ }
    }

    // Show success feedback
    const feedback = $("#issue-feedback");
    feedback.style.display = "block";
    feedback.className = "feedback feedback--success";
    feedback.innerHTML = `Certificate #${certId} issued successfully.<br>
      <a href="${NETWORK.explorer}/tx/${receipt.hash}" target="_blank" style="color: inherit; text-decoration: underline;">
        View transaction
      </a>`;

    // Reset form
    $("#form-issue").reset();

    // Reload stats + certificates real time
    loadTotalCerts();
    await loadMyCertificates();
    showToast("Certificate issued", "success");
  } catch (err) {
    console.error("Issue error:", err);
    const feedback = $("#issue-feedback");
    feedback.style.display = "block";
    feedback.className = "feedback feedback--error";

    if (err.code === "ACTION_REJECTED" || err.code === 4001) {
      feedback.textContent = "Transaction rejected by user.";
    } else if (err.reason) {
      feedback.textContent = err.reason;
    } else {
      feedback.textContent = "Failed to issue certificate. Check console for details.";
    }
  } finally {
    btnIssue.textContent = "Issue Certificate";
    btnIssue.classList.remove("btn--loading");
  }
}

// ---- Load My Certificates ----
async function loadMyCertificates() {
  if (!contract || !connectedAddress) return;

  const grid = $("#cert-grid");
  const empty = $("#cert-empty");

  grid.innerHTML = "";

  try {
    const certIds = await contract.getWalletCertificates(connectedAddress);

    if (!certIds.length) {
      empty.style.display = "block";
      return;
    }

    empty.style.display = "none";

    for (const id of certIds) {
      const cert = await contract.getCertificate(id);
      if (cert.exists) {
        grid.appendChild(createCertCard(cert));
      }
    }
  } catch (err) {
    console.error("Load certs error:", err);
    empty.style.display = "block";
  }
}

function createCertCard(cert) {
  const card = document.createElement("div");
  card.className = "cert-card";

  const date = new Date(Number(cert.issuedAt) * 1000);
  const dateStr = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  const shortAddr = cert.recipient.slice(0, 6) + "..." + cert.recipient.slice(-4);

  card.innerHTML = `
    <div class="cert-card__header">
      <span class="cert-card__id">#${cert.id.toString()}</span>
      <span class="cert-card__badge">${cert.category}</span>
    </div>
    <div class="cert-card__event">${escapeHtml(cert.eventName)}</div>
    <div class="cert-card__name">${escapeHtml(cert.recipientName)}</div>
    <div class="cert-card__meta">
      <div class="cert-card__row">
        <span class="cert-card__row-label">Issued</span>
        <span class="cert-card__row-value">${dateStr}</span>
      </div>
      <div class="cert-card__row">
        <span class="cert-card__row-label">Recipient</span>
        <span class="cert-card__row-value">${shortAddr}</span>
      </div>
      <div class="cert-card__row">
        <span class="cert-card__row-label">Status</span>
        <span class="status-badge status-badge--valid">
          <span class="status-dot status-dot--valid"></span>
          Valid
        </span>
      </div>
    </div>
  `;

  return card;
}

// ---- Verify Certificate ----
async function handleVerify() {
  const input = $("#input-verify-id");
  const certId = input.value.trim();

  if (!certId || certId < 1) {
    showToast("Enter a valid certificate ID", "error");
    return;
  }

  const btnVerify = $("#btn-verify");
  btnVerify.textContent = "Verifying...";
  btnVerify.classList.add("btn--loading");

  try {
    // Use read-only provider if wallet not connected
    let readContract;
    if (contract) {
      readContract = contract;
    } else {
      const readProvider = new ethers.JsonRpcProvider(NETWORK.rpcUrl);
      readContract = new ethers.Contract(
        CONFIG.contractAddress,
        CONTRACT_ABI,
        readProvider
      );
    }

    const cert = await readContract.getCertificate(certId);
    const resultDiv = $("#verify-result");
    const feedbackDiv = $("#verify-feedback");
    const cardDiv = $("#verify-card");

    if (cert.exists) {
      feedbackDiv.style.display = "none";
      resultDiv.style.display = "block";

      const date = new Date(Number(cert.issuedAt) * 1000);
      const dateStr = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });

      const shortAddr = cert.recipient.slice(0, 6) + "..." + cert.recipient.slice(-4);

      cardDiv.innerHTML = `
        <div class="cert-card__header">
          <span class="cert-card__id">#${cert.id.toString()}</span>
          <span class="cert-card__badge">${cert.category}</span>
        </div>
        <div class="cert-card__event">${escapeHtml(cert.eventName)}</div>
        <div class="cert-card__name">${escapeHtml(cert.recipientName)}</div>
        <div class="cert-card__meta">
          <div class="cert-card__row">
            <span class="cert-card__row-label">Issued</span>
            <span class="cert-card__row-value">${dateStr}</span>
          </div>
          <div class="cert-card__row">
            <span class="cert-card__row-label">Recipient</span>
            <span class="cert-card__row-value">${shortAddr}</span>
          </div>
          <div class="cert-card__row">
            <span class="cert-card__row-label">Status</span>
            <span class="status-badge status-badge--valid">
              <span class="status-dot status-dot--valid"></span>
              Verified &mdash; Authentic
            </span>
          </div>
        </div>
      `;

      showToast("Certificate verified", "success");
    } else {
      resultDiv.style.display = "none";
      feedbackDiv.style.display = "block";
      feedbackDiv.className = "feedback feedback--error";
      feedbackDiv.innerHTML = `
        <span class="status-badge status-badge--invalid">
          <span class="status-dot status-dot--invalid"></span>
          Certificate #${certId} not found on the blockchain.
        </span>
      `;
    }
  } catch (err) {
    console.error("Verify error:", err);
    const feedbackDiv = $("#verify-feedback");
    feedbackDiv.style.display = "block";
    feedbackDiv.className = "feedback feedback--error";
    feedbackDiv.textContent = "Failed to verify. Make sure the contract is deployed and the ID is correct.";
    $("#verify-result").style.display = "none";
  } finally {
    btnVerify.textContent = "Verify";
    btnVerify.classList.remove("btn--loading");
  }
}

// ---- Load Total Certs (Stats) ----
async function loadTotalCerts() {
  try {
    let readContract;
    if (contract) {
      readContract = contract;
    } else {
      const readProvider = new ethers.JsonRpcProvider(NETWORK.rpcUrl);
      readContract = new ethers.Contract(
        CONFIG.contractAddress,
        CONTRACT_ABI,
        readProvider
      );
    }

    const total = await readContract.getTotalCertificates();
    $("#stat-total").textContent = total.toString();
  } catch (err) {
    // Silently fail — stats are non-critical
    $("#stat-total").textContent = "0";
  }
}

// ---- Toast Notifications ----
function showToast(message, type = "info") {
  // Play sound based on type
  if (typeof Audio !== "undefined" && Audio.sfx) {
    if (type === "success") Audio.sfx.success();
    else if (type === "error") Audio.sfx.error();
    else Audio.sfx.notify();
  }

  const container = $("#toast-container");
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(12px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ---- Helpers ----
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
