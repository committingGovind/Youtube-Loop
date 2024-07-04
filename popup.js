function setActiveIcon() {
  chrome.action.setIcon({
    path: {
      16: "icons/active16.png",
      32: "icons/active32.png",
    },
  });
}

function setInactiveIcon() {
  chrome.action.setIcon({
    path: {
      16: "icons/inactive16.png",
      32: "icons/inactive32.png",
    },
  });
}

function saveState() {
  const startTime = document.getElementById("startTime").value;
  const endTime = document.getElementById("endTime").value;
  try {
    chrome.storage.local.set({ startTime, endTime });
    if (startTime && endTime) {
      setActiveIcon();
    } else {
      setInactiveIcon();
    }
  } catch (error) {
    console.log("Extension context invalidated, unable to save state.");
  }
}

function loadState() {
  try {
    chrome.storage.local.get(
      ["startTime", "endTime", "pageReloaded"],
      (result) => {
        if (result.pageReloaded) {
          clearState();
          chrome.storage.local.remove("pageReloaded");
        } else {
          if (result.startTime)
            document.getElementById("startTime").value = result.startTime;
          if (result.endTime)
            document.getElementById("endTime").value = result.endTime;
          updateUI(!(result.startTime && result.endTime));
          if (result.startTime && result.endTime) {
            setActiveIcon();
          } else {
            setInactiveIcon();
          }
        }
      }
    );
  } catch (error) {
    console.log("Extension context invalidated, unable to load state.");
    updateUI(true);
  }
}

function clearState() {
  document.getElementById("startTime").value = "";
  document.getElementById("endTime").value = "";
  try {
    chrome.storage.local.remove(["startTime", "endTime"]);
    setInactiveIcon();
  } catch (error) {
    console.log("Extension context invalidated, unable to clear state.");
  }
  updateUI(true);
}

function updateUI(loopCleared = false) {
  const startTimeInput = document.getElementById("startTime");
  const endTimeInput = document.getElementById("endTime");
  const setLoopButton = document.getElementById("setLoop");
  const clearLoopButton = document.getElementById("clearLoop");

  if (loopCleared) {
    setLoopButton.disabled = false;
    clearLoopButton.disabled = true;
  } else {
    setLoopButton.disabled = !startTimeInput.value || !endTimeInput.value;
    clearLoopButton.disabled = false;
  }
}

document.getElementById("setLoop").addEventListener("click", () => {
  const startTimeArray = document
    .getElementById("startTime")
    .value.split(":")
    .map(Number);
  const endTimeArray = document
    .getElementById("endTime")
    .value.split(":")
    .map(Number);

  let startTime = null;
  let endTime = null;

  if (startTimeArray.length <= 2) {
    startTime = 60 * startTimeArray[0] + startTimeArray[1];
  } else {
    startTime =
      3600 * startTimeArray[0] + 60 * startTimeArray[1] + startTimeArray[2];
  }

  console.log("startTime:" + startTime);

  if (endTimeArray.length <= 2) {
    endTime = 60 * endTimeArray[0] + endTimeArray[1];
  } else {
    endTime = 3600 * endTimeArray[0] + 60 * endTimeArray[1] + endTimeArray[2];
  }

  console.log("endTime" + endTime);

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "setLoop",
      startTime,
      endTime,
    });
  });

  saveState();
  updateUI();
});

document.getElementById("clearLoop").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "clearLoop" });
  });

  clearState();
});

try {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "loopCleared" || request.action === "pageReloaded") {
      clearState();
      setInactiveIcon();
    }
  });
} catch (error) {
  console.log("Extension context invalidated, unable to add listener.");
}

// Initialize UI
updateUI(true);

// Add input event listeners to save state when user types
document.getElementById("startTime").addEventListener("input", saveState);
document.getElementById("endTime").addEventListener("input", saveState);

// Load state when popup opens
document.addEventListener("DOMContentLoaded", loadState);
