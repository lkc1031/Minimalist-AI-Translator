const apiProviderSelect = document.getElementById('apiProvider');

const openrouterKeyInput = document.getElementById('openrouterApiKey');
const openrouterModelInput = document.getElementById('openrouterModel');
const openrouterKeyGroup = document.getElementById('openrouter-key-group');

const openaiKeyInput = document.getElementById('openaiApiKey');
const openaiModelInput = document.getElementById('openaiModel');
const openaiKeyGroup = document.getElementById('openai-key-group');

const anthropicKeyInput = document.getElementById('anthropicApiKey');
const anthropicModelInput = document.getElementById('anthropicModel');
const anthropicKeyGroup = document.getElementById('anthropic-key-group');

const geminiKeyInput = document.getElementById('geminiApiKey');
const geminiModelInput = document.getElementById('geminiModel');
const geminiKeyGroup = document.getElementById('gemini-key-group');

const targetLangSelect = document.getElementById('targetLang');
const saveButton = document.getElementById('saveButton');
const statusDiv = document.getElementById('status');
const textColorInput = document.getElementById('textColor');

function updateApiKeyFields() {
    const selectedProvider = apiProviderSelect.value;
    [openrouterKeyGroup, openaiKeyGroup, anthropicKeyGroup, geminiKeyGroup].forEach(group => {
        group.classList.remove('active');
    });
    document.getElementById(`${selectedProvider}-key-group`).classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(['apiProvider', 'openrouterApiKey', 'openrouterModel', 'openaiApiKey', 'openaiModel', 'anthropicApiKey', 'anthropicModel', 'geminiApiKey', 'geminiModel', 'targetLang', 'textColor'], (result) => {
        if (result.apiProvider) {
            apiProviderSelect.value = result.apiProvider;
        }
        if (result.openrouterApiKey) openrouterKeyInput.value = result.openrouterApiKey;
        if (result.openrouterModel) openrouterModelInput.value = result.openrouterModel;
        if (result.openaiApiKey) openaiKeyInput.value = result.openaiApiKey;
        if (result.openaiModel) openaiModelInput.value = result.openaiModel;
        if (result.anthropicApiKey) anthropicKeyInput.value = result.anthropicApiKey;
        if (result.anthropicModel) anthropicModelInput.value = result.anthropicModel;
        if (result.geminiApiKey) geminiKeyInput.value = result.geminiApiKey;
        if (result.geminiModel) geminiModelInput.value = result.geminiModel;

        if (result.targetLang) {
            targetLangSelect.value = result.targetLang;
        }
        if (result.textColor) {
            textColorInput.value = result.textColor;
        }
        updateApiKeyFields();
    });
});

apiProviderSelect.addEventListener('change', updateApiKeyFields);

saveButton.addEventListener('click', () => {
    const apiProvider = apiProviderSelect.value;
    const openrouterApiKey = openrouterKeyInput.value.trim();
    const openrouterModel = openrouterModelInput.value.trim();
    const openaiApiKey = openaiKeyInput.value.trim();
    const openaiModel = openaiModelInput.value.trim();
    const anthropicApiKey = anthropicKeyInput.value.trim();
    const anthropicModel = anthropicModelInput.value.trim();
    const geminiApiKey = geminiKeyInput.value.trim();
    const geminiModel = geminiModelInput.value.trim();
    const targetLang = targetLangSelect.value;
    const textColor = textColorInput.value;

    let apiKey = '';
    let model = '';
    let validationError = '';

    switch (apiProvider) {
        case 'openrouter':
            apiKey = openrouterApiKey;
            model = openrouterModel;
            if (!apiKey) validationError = 'Please enter OpenRouter API key.';
            if (!model) validationError = 'Please enter OpenRouter LLM model.';
            break;
        case 'openai':
            apiKey = openaiApiKey;
            model = openaiModel;
            if (!apiKey) validationError = 'Please enter OpenAI API key.';
            if (!model) validationError = 'Please enter OpenAI LLM model.';
            break;
        case 'anthropic':
            apiKey = anthropicApiKey;
            model = anthropicModel;
            if (!apiKey) validationError = 'Please enter Anthropic API key.';
            if (!model) validationError = 'Please enter Anthropic LLM model.';
            break;
        case 'gemini':
            apiKey = geminiApiKey;
            model = geminiModel;
            if (!apiKey) validationError = 'Please enter Google Gemini API key.';
            if (!model) validationError = 'Please enter Google Gemini LLM model.';
            break;
    }

    if (validationError) {
        statusDiv.textContent = validationError;
        statusDiv.style.color = 'red';
        return;
    }

    chrome.storage.sync.set({
        apiProvider: apiProvider,
        openrouterApiKey: openrouterApiKey,
        openrouterModel: openrouterModel,
        openaiApiKey: openaiApiKey,
        openaiModel: openaiModel,
        anthropicApiKey: anthropicApiKey,
        anthropicModel: anthropicModel,
        geminiApiKey: geminiApiKey,
        geminiModel: geminiModel,
        targetLang: targetLang,
        textColor: textColor
    }, () => {
        statusDiv.textContent = 'Settings saved!';
        statusDiv.style.color = 'green';
        setTimeout(() => {
            statusDiv.textContent = '';
        }, 2000);
    });
});
