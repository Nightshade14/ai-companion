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

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let botMessage = '';
    let buffer = '';

    // Add a placeholder for the bot message
    chatHistory.push('Companion: ');
    updateChatHistory();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); // Keep the last incomplete line in the buffer

        lines.forEach(line => {
            if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6);
                try {
                    // Log the JSON string before parsing
                    console.log('Attempting to parse JSON:', jsonStr);

                    // Check for the [DONE] token
                    if (jsonStr.trim() === '[DONE]') {
                        return;
                    }

                    // Find the index of the opening curly brace
                    const startIndex = jsonStr.indexOf('{');

                    // If an opening curly brace is found
                    if (startIndex !== -1) {
                        // Extract the JSON string, starting from the opening curly brace
                        const jsonString = jsonStr.substring(startIndex);

                        // Attempt to parse the extracted JSON string
                        const json = JSON.parse(jsonString);

                        if (json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content) {
                            botMessage += json.choices[0].delta.content;
                            // Update the last bot message in the chat history
                            chatHistory[chatHistory.length - 1] = `Companion: ${botMessage}`;
                            updateChatHistory();
                        }
                    } else {
                        console.error('Error: No valid JSON object found in the string.');
                    }
                } catch (e) {
                    console.error('Error parsing JSON:', e, jsonStr); // Include the problematic string in the error log
                }
            }
        });
    }

    // Handle any remaining buffer content at the end of the stream
    if (buffer.trim() && buffer.trim() !== '[DONE]') {
        try {
            const jsonStr = buffer.slice(6); // Remove the "data: " prefix
            console.log('Attempting to parse remaining buffer JSON:', jsonStr);
            const startIndex = jsonStr.indexOf('{');
            if (startIndex !== -1) {
                const jsonString = jsonStr.substring(startIndex);
                const json = JSON.parse(jsonString);
                if (json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content) {
                    botMessage += json.choices[0].delta.content;
                    chatHistory[chatHistory.length - 1] = `Companion: ${botMessage}`;
                    updateChatHistory();
                }
            } else {
                console.error('Error: No valid JSON object found in the remaining buffer.');
            }
        } catch (e) {
            console.error('Error parsing remaining buffer:', e, buffer);
        }
    }
});