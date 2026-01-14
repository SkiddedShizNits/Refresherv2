document.addEventListener("DOMContentLoaded", () => {
    const cookieInput = document.getElementById("cookieInput");
    const refreshButton = document.getElementById("refreshButton");
    const resultElement = document.getElementById("result");

    refreshButton.addEventListener("click", async () => {
        const cookie = cookieInput.value.trim();
        if (!cookie) {
            resultElement.className = 'result error';
            resultElement.textContent = "Please paste a cookie first.";
            resultElement.style.display = 'block';
            return;
        }

        refreshButton.disabled = true;
        refreshButton.textContent = "Processing...";
        resultElement.className = 'result';
        resultElement.textContent = "Please wait...";
        resultElement.style.display = 'block';

        try {
            const response = await fetch(`/api/refresh?cookie=${encodeURIComponent(cookie)}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "An unknown error occurred.");
            }
            
            if (data && data.refreshedCookie) {
                resultElement.className = 'result success';
                resultElement.textContent = `Success! New cookie: ${data.refreshedCookie}`;
            } else {
                throw new Error("Operation succeeded, but no new cookie was returned.");
            }

        } catch (error) {
            resultElement.className = 'result error';
            resultElement.textContent = `Error: ${error.message}`;
        } finally {
            refreshButton.disabled = false;
            refreshButton.textContent = "Refresh";
        }
    });
});
