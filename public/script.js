document.addEventListener("DOMContentLoaded", () => {
    const cookieInput = document.getElementById("cookieInput");
    const refreshButton = document.getElementById("refreshButton");
    const resultElement = document.getElementById("result");

    refreshButton.addEventListener("click", async () => {
        const cookie = cookieInput.value.trim();
        if (!cookie) {
            showResult("Please paste a cookie first.", "error");
            return;
        }

        const originalButtonText = refreshButton.textContent;
        refreshButton.disabled = true;
        refreshButton.textContent = "Processing...";
        showResult("Please wait, contacting server...", "normal");

        // Create a controller to handle timeouts
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort(); // Abort the fetch request after 15 seconds
        }, 15000); // 15 second timeout

        try {
            const response = await fetch(`/api/refresh?cookie=${encodeURIComponent(cookie)}`, {
                signal: controller.signal // Link the controller to the fetch request
            });

            // Clear the timeout timer as soon as we get a response
            clearTimeout(timeoutId);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "An unknown error occurred on the server.");
            }
            
            if (data && data.refreshedCookie) {
                showResult(`Success! New cookie: ${data.refreshedCookie}`, "success");
            } else {
                throw new Error("Server responded successfully, but no new cookie was found.");
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                // This specifically catches our timeout error
                showResult("Error: The server took too long to respond. Please try again later.", "error");
            } else {
                // This catches other errors like network issues or server crashes
                showResult(`Error: ${error.message}`, "error");
            }
        } finally {
            clearTimeout(timeoutId); // Ensure timer is always cleared
            refreshButton.disabled = false;
            refreshButton.textContent = originalButtonText;
        }
    });

    function showResult(message, type) {
        resultElement.className = 'result'; // Reset class
        if (type) {
            resultElement.classList.add(type);
        }
        resultElement.textContent = message;
        resultElement.style.display = 'block';
    }
});
