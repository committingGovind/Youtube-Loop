let loopStart = null;
let loopEnd = null;
let videoElement = null;

function setupLoopListener() {
  videoElement = document.querySelector("video");
  if (videoElement) {
    videoElement.addEventListener("timeupdate", checkAndLoop);
    videoElement.addEventListener("loadedmetadata", clearLoop);
  }
}

function checkAndLoop() {
  if (
    loopStart !== null &&
    loopEnd !== null &&
    videoElement.currentTime >= loopEnd
  ) {
    videoElement.currentTime = loopStart;
  }
}

function clearLoop() {
  loopStart = null;
  loopEnd = null;

  try {
    chrome.runtime.sendMessage({ action: "loopCleared" });
  } catch (err) {
    console.log("Extension context invalidated, unable to send message.");
  }
}

function sendMessageToExtension(message) {
  try {
    chrome.runtime.sendMessage(message);
  } catch (error) {
    console.log("Extension context invalidated, unable to send message.");
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "setLoop") {
    loopStart = parseFloat(request.startTime);
    loopEnd = parseFloat(request.endTime);
    if (videoElement) {
      videoElement.currentTime = loopStart;
    }
  } else if (request.action === "clearLoop") {
    clearLoop();
  }
});

// Wait for the video element to be added to the page
const observer = new MutationObserver(() => {
  if (document.querySelector("video")) {
    setupLoopListener();
    observer.disconnect();
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Listen for page unload to clear the loop
window.addEventListener("beforeunload", clearLoop);

// Send message when page is loaded (which includes reloads)

window.addEventListener("load", () => {
  try {
    chrome.storage.local.set({ pageReloaded: true });
    chrome.runtime.sendMessage({ action: "pageReloaded" });
  } catch (error) {
    console.log(
      "Extension context invalidated, unable to set storage or send message."
    );
  }
});
