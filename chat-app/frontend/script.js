const chatContainer = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

let chatHistory = [];

function updateChatHistory() {
    chatContainer.innerHTML = '';
    chatHistory.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        chatContainer.appendChild(messageElement);
    });
}

sendButton.addEventListener('click', async () => {
    const userMessage = userInput.value;
    if (userMessage.trim() === '') return;

    chatHistory.push(`You: ${userMessage}`);
    updateChatHistory();
    userInput.value = '';

    const response = await fetch('http://127.0.0.1:5000/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
    });

    const data = await response.json();
    chatHistory.push(`Bot: ${data.response}`);
    updateChatHistory();
});