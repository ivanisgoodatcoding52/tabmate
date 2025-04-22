document.getElementById('open-settings').addEventListener('click', function() {
  // Open settings page
  chrome.runtime.openOptionsPage();
});

// Update background.js to include settings support
// Add at the top of background.js
let aiSettings = {
  service: 'openai',
  apiKey: '',
  model: 'gpt-3.5-turbo'
};

let privacySettings = {
  offlineMode: false,
  collectStats: false
};

// Load settings when extension starts
function loadSettings() {
  chrome.storage.local.get(['aiSettings', 'privacySettings'], function(result) {
    if (result.aiSettings) {
      aiSettings = result.aiSettings;
    }
    
    if (result.privacySettings) {
      privacySettings = result.privacySettings;
    }
  });
}

// Call this at extension init
loadSettings();

// Add this to handle settings updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'settingsUpdated') {
    aiSettings = request.settings.aiSettings;
    privacySettings = request.settings.privacySettings;
    sendResponse({status: 'Settings updated'});
  }
});
