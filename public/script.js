document.addEventListener("DOMContentLoaded", () => {
    // --- DOM Element Selection ---
    const cookieInput = document.getElementById("cookieInput");
    const refreshButton = document.getElementById("refreshButton");
    const resultElement = document.getElementById("result");
    const cookieModal = document.getElementById("cookieModal");
    const newCookieOutput = document.getElementById("newCookieOutput");
    const copyCookieBtn = document.getElementById("copyCookieBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");

    // --- Main Refresh Button Logic ---
    refreshButton.addEventListener("click", async () => {
        const cookie = cookieInput.value.trim();
        if (!cookie) {
            showError("Please paste a cookie first.");
            return;
        }

        // --- UI State: Processing ---
        const originalButtonHTML = refreshButton.innerHTML;
        refreshButton.disabled = true;
        refreshButton.innerHTML = "Processing...";
        resultElement.style.display = "none"; // Hide previous errors

        // --- API Call ---
        try {
            const response = await fetch(`/api/refresh?cookie=${encodeURIComponent(cookie)}`);
            const data = await response.json();

            // Handle API errors (like 400 or 500 status codes)
            if (!response.ok) {
                throw new Error(data.error || "An unknown server error occurred.");
            }
            
            // On success, show the modal
            showSuccessModal(data.refreshedCookie);

        } catch (error) {
            // Handle network errors or errors thrown above
            showError(error.message);
        } finally {
            // --- UI State: Restore ---
            refreshButton.disabled = false;
            refreshButton.innerHTML = originalButtonHTML;
        }
    });

    // --- Helper Functions ---
    function showSuccessModal(newCookie) {
        newCookieOutput.value = newCookie;
        cookieModal.classList.add("visible");
    }

    function showError(message) {
        resultElement.className = 'result error';
        resultElement.textContent = `Error: ${message}`;
        resultElement.style.display = 'block';
    }
    
    // --- Modal Interactivity ---
    copyCookieBtn.addEventListener("click", () => {
        newCookieOutput.select();
        document.execCommand("copy");
        copyCookieBtn.textContent = "Copied!";
        setTimeout(() => {
            copyCookieBtn.textContent = "Copy Cookie";
        }, 2000); // Reset text after 2 seconds
    });

    function closeModal() {
        cookieModal.classList.remove("visible");
    }

    closeModalBtn.addEventListener("click", closeModal);
    
    // Allow closing the modal by clicking on the dark overlay
    cookieModal.addEventListener("click", (event) => {
        if (event.target === cookieModal) {
            closeModal();
        }
    });
});
