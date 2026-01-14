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

        const originalButtonText = "Refresh";
        refreshButton.disabled = true;
        refreshButton.innerHTML = "Processing...";
        showResult("Please wait, contacting server...", "normal");

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            const response = await fetch(`/api/refresh?cookie=${encodeURIComponent(cookie)}`, {
                signal: controller.signal
            });
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
                showResult("Error: The server took too long to respond. Please try again later.", "error");
            } else {
                showResult(`Error: ${error.message}`, "error");
            }
        } finally {
            clearTimeout(timeoutId);
            refreshButton.disabled = false;
            refreshButton.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 7.5v9l8-4.5-8-4.5z" stroke-width="1.8" stroke-linejoin="round"/></svg> ${originalButtonText}`;
        }
    });

    function showResult(message, type) {
        resultElement.className = 'result';
        if (type) {
            resultElement.classList.add(type);
        }
        resultElement.textContent = message;
        resultElement.style.display = 'block';
    }
});
