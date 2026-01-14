document.addEventListener("DOMContentLoaded", () => {
    const cookieInput = document.getElementById("cookieInput");
    const refreshButton = document.getElementById("refreshButton");
    const resultBox = document.getElementById("resultBox");

    // Obscure the cookie input for better privacy
    if (cookieInput) {
        cookieInput.type = "password";
    }

    refreshButton.addEventListener("click", async () => {
        const cookie = cookieInput.value.trim();
        if (!cookie) {
            showResult("Please paste a cookie first.", "error");
            return;
        }

        const originalButtonHTML = refreshButton.innerHTML;
        refreshButton.disabled = true;
        refreshButton.innerHTML = "Processing...";
        showResult("Please wait...", "normal");

        try {
            const response = await fetch(`/api/refresh?cookie=${encodeURIComponent(cookie)}`);
            const data = await response.json();

            if (!response.ok) {
                // Use a generic error message from the server if available, otherwise a default one
                throw new Error(data.error || "An error occurred during the request.");
            }
            
            // On success, show a simple, non-revealing message.
            // DO NOT log the cookie or any data to the console.
            showResult("Success. The operation was completed.", "success");

        } catch (error) {
            // On failure, show a generic error message.
            // DO NOT log the detailed error object to the console for the user to see.
            showResult(`Error: ${error.message}`, "error");
        } finally {
            refreshButton.disabled = false;
            refreshButton.innerHTML = originalButtonHTML;
        }
    });

    function showResult(message, type) {
        resultBox.style.display = "block";
        resultBox.textContent = message;
        resultBox.className = 'result-box'; // Reset classes
        if (type) {
            resultBox.classList.add(type);
        }
    }
});