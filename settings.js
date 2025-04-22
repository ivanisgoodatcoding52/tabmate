document.addEventListener('DOMLoaded', function() {
    loadSettings();
    setupEventListeners();
  });
  
  // Load saved settings
  function loadSettings() {
    chrome.storage.local.get(['aiSettings', 'privacySettings'], function(result) {
      const aiSettings = result.aiSettings || {};
      const privacySettings = result.privacySettings || {};
      
      // Set AI service settings
      if (aiSettings.service) {
        document.getElementById('ai-service').value = aiSettings.service;
        updateModelOptions(aiSettings.service);
      }
      
      if (aiSettings.apiKey) {
        document.getElementById('api-key').value = aiSettings.apiKey;
      }
      
      if (aiSettings.model) {
        document.getElementById('ai-model').value = aiSettings.model;
      }
      
      // Set privacy settings
      document.getElementById('offline-mode').checked = privacySettings.offlineMode || false;
      document.getElementById('collect-anonymous-stats').checked = privacySettings.collectStats || false;
    });
  }
  
  // Set up event listeners
  function setupEventListeners() {
    // Toggle API key visibility
    document.getElementById('toggle-visibility').addEventListener('click', function() {
      const apiKeyInput = document.getElementById('api-key');
      if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        this.textContent = '🔒';
      } else {
        apiKeyInput.type = 'password';
        this.textContent = '👁️';
      }
    });
    
    // Change AI service
    document.getElementById('ai-service').addEventListener('change', function() {
      updateModelOptions(this.value);
    });
    
    // Test API connection
    document.getElementById('test-api').addEventListener('click', function() {
      testApiConnection();
    });
    
    // Save settings
    document.getElementById('save-settings').addEventListener('click', function() {
      saveSettings();
    });
  }
  
  // Update model dropdown based on selected service
  function updateModelOptions(service) {
    const modelSelect = document.getElementById('ai-model');
    modelSelect.innerHTML = '';
    
    if (service === 'openai') {
      addOption(modelSelect, 'gpt-4', 'GPT-4 (More accurate, slower)');
      addOption(modelSelect, 'gpt-3.5-turbo', 'GPT-3.5 Turbo (Faster, less accurate)');
    } else if (service === 'anthropic') {
      addOption(modelSelect, 'claude-3-opus', 'Claude 3 Opus (Most capable)');
      addOption(modelSelect, 'claude-3-sonnet', 'Claude 3 Sonnet (Balanced)');
      addOption(modelSelect, 'claude-3-haiku', 'Claude 3 Haiku (Fastest)');
    } else if (service === 'gemini') {
      addOption(modelSelect, 'gemini-pro', 'Gemini Pro');
      addOption(modelSelect, 'gemini-ultra', 'Gemini Ultra');
    }
  }
  
  // Helper function to add options to select
  function addOption(select, value, text) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    select.appendChild(option);
  }
  
  // Test API connection
  async function testApiConnection() {
    const service = document.getElementById('ai-service').value;
    const apiKey = document.getElementById('api-key').value;
    const model = document.getElementById('ai-model').value;
    const statusMessage = document.getElementById('status-message');
    
    if (!apiKey) {
      showStatusMessage('Please enter an API key', 'error');
      return;
    }
    
    statusMessage.textContent = 'Testing connection...';
    statusMessage.className = 'status-message';
    statusMessage.style.display = 'block';
    
    try {
      // Different API endpoints based on service
      let endpoint;
      let headers = {'Content-Type': 'application/json'};
      let body;
      
      if (service === 'openai') {
        endpoint = 'https://api.openai.com/v1/chat/completions';
        headers['Authorization'] = `Bearer ${apiKey}`;
        body = JSON.stringify({
          model: model,
          messages: [{
            role: 'user',
            content: 'Test connection. Please respond with "Connected".'
          }],
          max_tokens: 5
        });
      } else if (service === 'anthropic') {
        endpoint = 'https://api.anthropic.com/v1/messages';
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
        body = JSON.stringify({
          model: model,
          messages: [{
            role: 'user',
            content: 'Test connection. Please respond with "Connected".'
          }],
          max_tokens: 5
        });
      } else if (service === 'gemini') {
        endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        body = JSON.stringify({
          contents: [{
            parts: [{
              text: 'Test connection. Please respond with "Connected".'
            }]
          }]
        });
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: body
      });
      
      if (response.ok) {
        showStatusMessage('Connection successful! API key is valid.', 'success');
      } else {
        const error = await response.json();
        showStatusMessage(`Connection failed: ${error.error?.message || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      showStatusMessage(`Connection error: ${error.message}`, 'error');
    }
  }
  
  // Show status message
  function showStatusMessage(message, type) {
    const statusMessage = document.getElementById('status-message');
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 5000);
  }
  
  // Save settings
  function saveSettings() {
    const aiSettings = {
      service: document.getElementById('ai-service').value,
      apiKey: document.getElementById('api-key').value,
      model: document.getElementById('ai-model').value
    };
    
    const privacySettings = {
      offlineMode: document.getElementById('offline-mode').checked,
      collectStats: document.getElementById('collect-anonymous-stats').checked
    };
    
    chrome.storage.local.set({
      aiSettings: aiSettings,
      privacySettings: privacySettings
    }, function() {
      showStatusMessage('Settings saved successfully!', 'success');
      
      // Notify background script that settings changed
      chrome.runtime.sendMessage({
        action: 'settingsUpdated',
        settings: {
          aiSettings: aiSettings,
          privacySettings: privacySettings
        }
      });
    });
  }
  