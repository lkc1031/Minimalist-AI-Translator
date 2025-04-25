const API_ENDPOINTS = {
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
    openai: 'https://api.openai.com/v1/chat/completions',
    anthropic: 'https://api.anthropic.com/v1/messages',
    gemini: 'https://generativelanguage.googleapis.com/v1beta/models'
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'translate') {
        chrome.storage.sync.get([
            'apiProvider', 'targetLang',
            'openrouterApiKey', 'openrouterModel',
            'openaiApiKey', 'openaiModel',
            'anthropicApiKey', 'anthropicModel',
            'geminiApiKey', 'geminiModel'
        ], async (settings) => {
            const { apiProvider = 'openrouter', targetLang } = settings;
            const textToTranslate = request.text;
            let apiKey, model, apiUrl, headers, payload;

            if (!targetLang) {
                sendResponse({ success: false, error: 'Please configure the target language in the extension settings first.' });
                return;
            }

            switch (apiProvider) {
                case 'openai':
                    apiKey = settings.openaiApiKey;
                    model = settings.openaiModel;
                    apiUrl = API_ENDPOINTS.openai;
                    break;
                case 'anthropic':
                    apiKey = settings.anthropicApiKey;
                    model = settings.anthropicModel;
                    apiUrl = API_ENDPOINTS.anthropic;
                    break;
                case 'gemini':
                    apiKey = settings.geminiApiKey;
                    model = settings.geminiModel;
                    apiUrl = `${API_ENDPOINTS.gemini}/${model}:generateContent?key=${apiKey}`;
                    break;
                case 'openrouter':
                default:
                    apiKey = settings.openrouterApiKey;
                    model = settings.openrouterModel;
                    apiUrl = API_ENDPOINTS.openrouter;
                    break;
            }

            if (!apiKey || !model) {
                sendResponse({ success: false, error: `Please configure the API key and model for ${apiProvider} in the extension settings first.` });
                return;
            }

            const basePrompt = `Translate the following text to ${targetLang}, preserving the original line breaks:\n\n"${textToTranslate}"\n\nPlease provide only the translated text, without any additional explanations or introductions.`;

            switch (apiProvider) {
                case 'openai':
                case 'openrouter':
                    headers = {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    };
                    payload = {
                        model: model,
                        messages: [{ role: 'user', content: basePrompt }]
                    };
                    if (apiProvider === 'openrouter') {
                    }
                    break;
                case 'anthropic':
                    headers = {
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01',
                        'content-type': 'application/json'
                    };
                    payload = {
                        model: model,
                        max_tokens: 1024,
                        messages: [{ role: 'user', content: basePrompt }]
                    };
                    break;
                case 'gemini':
                    headers = {
                        'Content-Type': 'application/json'
                    };
                    payload = {
                        contents: [{
                            parts: [{
                                text: basePrompt
                            }]
                        }]
                    };
                    break;
            }

            const logApiUrl = apiProvider === 'gemini' ? apiUrl.replace(/key=([^&]+)/, 'key=****') : apiUrl;

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData.error?.message || `HTTP Error: ${response.status} ${response.statusText}`;
                    sendResponse({ success: false, error: `API request failed: ${errorMessage}` });
                    return;
                }

                const data = await response.json();

                let translation = '';
                switch (apiProvider) {
                    case 'openai':
                    case 'openrouter':
                        if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
                            translation = data.choices[0].message.content.trim();
                        } else {
                           throw new Error('Invalid API response format.');
                        }
                        break;
                    case 'anthropic':
                        if (data.content && data.content.length > 0 && data.content[0].type === 'text') {
                            translation = data.content[0].text.trim();
                        } else {
                            throw new Error('Invalid API response format.');
                        }
                        break;
                    case 'gemini':
                        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
                            translation = data.candidates[0].content.parts[0].text.trim();
                        } else {
                             if (data.promptFeedback && data.promptFeedback.blockReason) {
                                 throw new Error(`Translation blocked by API: ${data.promptFeedback.blockReason}`);
                             } else {
                                 throw new Error('Invalid API response format.');
                             }
                        }
                        break;
                }

                sendResponse({ success: true, translation: translation });

            } catch (error) {
                sendResponse({ success: false, error: `Request failed: ${error.message}` });
            }
        });

        return true;
    }
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get('apiProvider', (result) => {
        if (!result.apiProvider) {
            chrome.storage.sync.set({ apiProvider: 'openrouter' });
        }
    });
});
