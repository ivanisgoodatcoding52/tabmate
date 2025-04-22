// Update the summarizeContent function in background.js to use the API key
async function summarizeContent(content, url, title) {
  // Check if in offline mode
  if (privacySettings.offlineMode) {
    // Use basic categorization instead of AI
    if (url.includes("python")) {
      return {
        summary: "Python-related page",
        intent: "Programming"
      };
    } else if (url.includes("hotel") || url.includes("flight")) {
      return {
        summary: "Travel booking page",
        intent: "Travel"
      };
    } else {
      return {
        summary: `Page about ${title.substring(0, 30)}...`,
        intent: "Research"
      };
    }
  }
  
  // Check if API key is set
  if (!aiSettings.apiKey) {
    console.log("No API key set. Using basic categorization.");
    // Return basic categorization
    if (url.includes("github")) {
      return {
        summary: "Code repository or documentation",
        intent: "Programming"
      };
    } else if (url.includes("youtube")) {
      return {
        summary: "Video content",
        intent: "Entertainment"
      };
    } else {
      return {
        summary: `Page about ${title.substring(0, 30)}...`,
        intent: "Research"
      };
    }
  }
  
  try {
    // Different API calls based on service
    if (aiSettings.service === 'openai') {
      return await summarizeWithOpenAI(content, url, title);
    } else if (aiSettings.service === 'anthropic') {
      return await summarizeWithAnthropic(content, url, title);
    } else if (aiSettings.service === 'gemini') {
      return await summarizeWithGemini(content, url, title);
    }
  } catch (error) {
    console.error("Error using AI service:", error);
    // Fallback to basic categorization
    return {
      summary: `Page about ${title.substring(0, 30)}...`,
      intent: "Research"
    };
  }
}

// Function to summarize with OpenAI
async function summarizeWithOpenAI(content, url, title) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aiSettings.apiKey}`
    },
    body: JSON.stringify({
      model: aiSettings.model,
      messages: [
        {
          role: "system", 
          content: "You are an AI that summarizes web pages and determines user intent. Respond in JSON format only."
        },
        {
          role: "user",
          content: `URL: ${url}\nTitle: ${title}\nContent: ${content}\nProvide a brief summary (max 100 chars) and guess the user's intent for opening this page in JSON format with 'summary' and 'intent' fields.`
        }
      ],
      max_tokens: 150
    })
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }
  
  const data = await response.json();
  try {
    // Some models return JSON string, others return JSON object directly
    const resultText = data.choices[0].message.content.trim();
    // Check if it's already a parsed JSON or needs parsing
    if (resultText.startsWith('{')) {
      return JSON.parse(resultText);
    } else {
      return {
        summary: resultText.substring(0, 100),
        intent: "Research"
      };
    }
  } catch (e) {
    console.error("Error parsing OpenAI response:", e);
    return {
      summary: title.substring(0, 100),
      intent: "Research"
    };
  }
}

// Similar functions for Anthropic and Gemini
async function summarizeWithAnthropic(content, url, title) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': aiSettings.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: aiSettings.model,
      system: "You are an AI that summarizes web pages and determines user intent. Respond in JSON format only.",
      messages: [
        {
          role: "user",
          content: `URL: ${url}\nTitle: ${title}\nContent: ${content}\nProvide a brief summary (max 100 chars) and guess the user's intent for opening this page in JSON format with 'summary' and 'intent' fields.`
        }
      ],
      max_tokens: 150
    })
  });
  
  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }
  
  const data = await response.json();
  try {
    const resultText = data.content[0].text.trim();
    if (resultText.startsWith('{')) {
      return JSON.parse(resultText);
    } else {
      return {
        summary: resultText.substring(0, 100),
        intent: "Research"
      };
    }
  } catch (e) {
    console.error("Error parsing Anthropic response:", e);
    return {
      summary: title.substring(0, 100),
      intent: "Research"
    };
  }
}

async function summarizeWithGemini(content, url, title) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${aiSettings.model}:generateContent?key=${aiSettings.apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `URL: ${url}\nTitle: ${title}\nContent: ${content}\nProvide a brief summary (max 100 chars) and guess the user's intent for opening this page in JSON format with 'summary' and 'intent' fields.`
        }]
      }],
      generationConfig: {
        maxOutputTokens: 150
      }
    })
  });
  
  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }
  
  const data = await response.json();
  try {
    const resultText = data.candidates[0].content.parts[0].text.trim();
    if (resultText.startsWith('{')) {
      return JSON.parse(resultText);
    } else {
      return {
        summary: resultText.substring(0, 100),
        intent: "Research"
      };
    }
  } catch (e) {
    console.error("Error parsing Gemini response:", e);
    return {
      summary: title.substring(0, 100),
      intent: "Research"
    };
  }
}