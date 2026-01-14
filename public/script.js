document.addEventListener("DOMContentLoaded", () => {
    // Main page elements
    const cookieInput = document.getElementById("cookieInput");
    const refreshButton = document.getElementById("refreshButton");
    const resultElement = document.getElementById("result");

    // Modal elements
    const cookieModal = document.getElementById("cookieModal");
    const newCookieOutput = document.getElementById("newCookieOutput");
    const copyCookieBtn = document.getElementById("copyCookieBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");

    refreshButton.addEventListener("click", async () => {
        const cookie = cookieInput.value.trim();
        if (!cookie) {
            showError("Please paste a cookie first.");
            return;
        }

        const originalButtonHTML = refreshButton.innerHTML;
        refreshButton.disabled = true;
        refreshButton.innerHTML = "Processing...";
        resultElement.style.display = "none";

        try {
            const response = await fetch(`/api/refresh?cookie=${encodeURIComponent(cookie)}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "An unknown server error occurred.");
            }
            
            showSuccessModal(data.refreshedCookie);

        } catch (error) {
            showError(error.message);
        } finally {
            refreshButton.disabled = false;
            refreshButton.innerHTML = originalButtonHTML;
        }
    });

    function showSuccessModal(newCookie) {
        newCookieOutput.value = newCookie;
        cookieModal.classList.add("visible");
    }

    function showError(message) {
        resultElement.className = 'result error';
        resultElement.textContent = `Error: ${message}`;
        resultElement.style.display = 'block';
    }
    
    copyCookieBtn.addEventListener("click", () => {
        newCookieOutput.select();
        document.execCommand("copy");
        copyCookieBtn.textContent = "Copied!";
        setTimeout(() => {
            copyCookieBtn.textContent = "Copy Cookie";
        }, 2000);
    });

    const closeModal = () => {
        cookieModal.classList.remove("visible");
    };

    closeModalBtn.addEventListener("click", closeModal);
    cookieModal.addEventListener("click", (e) => {
        if (e.target === cookieModal) {
            closeModal();
        }
    });
});
