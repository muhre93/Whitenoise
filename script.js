document.addEventListener('DOMContentLoaded', () => {
    const audioPlayer = document.getElementById('global-audio-player');
    const playButtons = document.querySelectorAll('.play-btn');
    const stopButton = document.getElementById('stop-all');
    const timerSelect = document.getElementById('timer-select');
    
    let timerId = null;
    let currentlyPlayingBtn = null;

    // Funktion til at nulstille alle knapper til "Afspil"
    function resetAllButtons() {
        playButtons.forEach(btn => {
            btn.textContent = 'Afspil';
            btn.classList.remove('playing');
        });
    }

    // Lyt efter klik på alle "Afspil"-knapper
    playButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            const selectElement = document.getElementById(`variant-${category}`);
            const audioSrc = selectElement.value;

            // Hvis man klikker på knappen der allerede spiller, så stop lyden
            if (currentlyPlayingBtn === this && !audioPlayer.paused) {
                audioPlayer.pause();
                resetAllButtons();
                clearTimer();
                currentlyPlayingBtn = null;
                return;
            }

            // Stop tidligere lyd og opdater kilde
            resetAllButtons();
            audioPlayer.src = audioSrc;
            
            // Forsøg at afspille
            audioPlayer.play().then(() => {
                this.textContent = 'Pause';
                this.classList.add('playing');
                currentlyPlayingBtn = this;
                setupTimer(); // Start timer, hvis en er valgt
            }).catch(error => {
                console.error("Lyden kunne ikke afspilles (kræver måske filer):", error);
                alert("Lyden kunne ikke afspilles. Tjek at lydfilerne ligger i 'lyde'-mappen.");
            });
        });
    });

    // Lyt efter klik på "Stop alt"
    stopButton.addEventListener('click', () => {
        audioPlayer.pause();
        audioPlayer.currentTime = 0; // Spol tilbage
        resetAllButtons();
        clearTimer();
        currentlyPlayingBtn = null;
    });

    // Håndtering af Timer
    function setupTimer() {
        clearTimer(); // Fjern gamle timere
        
        const hours = parseFloat(timerSelect.value);
        
        // Hvis 0, så kører den bare for evigt (ingen timer sættes)
        if (hours > 0) {
            const milliseconds = hours * 60 * 60 * 1000;
            
            timerId = setTimeout(() => {
                audioPlayer.pause();
                resetAllButtons();
                currentlyPlayingBtn = null;
                console.log("Timeren slukkede for lyden.");
            }, milliseconds);
        }
    }

    function clearTimer() {
        if (timerId !== null) {
            clearTimeout(timerId);
            timerId = null;
        }
    }

    // Hvis man ændrer timeren mens lyden spiller, opdaterer vi den
    timerSelect.addEventListener('change', () => {
        if (!audioPlayer.paused) {
            setupTimer();
        }
    });
});
