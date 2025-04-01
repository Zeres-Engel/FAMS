document.addEventListener('DOMContentLoaded', () => {
  const messageDiv = document.getElementById('message');
  const fetchButton = document.getElementById('fetch-button');
  
  // Function to fetch message from backend
  const fetchMessage = async () => {
    messageDiv.textContent = 'Fetching from backend...';
    
    try {
      const response = await fetch('http://localhost:3000/');
      const data = await response.json();
      messageDiv.textContent = data.message || 'No message received';
    } catch (error) {
      messageDiv.textContent = `Error: ${error.message}`;
      console.error('Failed to fetch from backend:', error);
    }
  };
  
  // Fetch on page load
  fetchMessage();
  
  // Fetch when button is clicked
  fetchButton.addEventListener('click', fetchMessage);
}); 