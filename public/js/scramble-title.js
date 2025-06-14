window.scrambleTitle = function ({
  selector = "h1[data-scramble]",
  letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-",
  interval = 40,
  fixInterval = 130,
} = {}) {
  const els = document.querySelectorAll(selector);

  els.forEach((el) => {
    const finalText = el.dataset.scrambleText || el.textContent;
    let display = Array.from(finalText);
    let fixed = Array(finalText.length).fill(false);
    let currentStep = 0;
    let scrambleTimer, fixTimer;

    // Start randomizing all unfixed letters
    scrambleTimer = setInterval(() => {
      for (let i = 0; i < finalText.length; i++) {
        if (!fixed[i] && finalText[i] !== " ") {
          display[i] = letters[Math.floor(Math.random() * letters.length)];
        } else {
          display[i] = finalText[i];
        }
      }
      el.textContent = display.join("");
    }, interval);

    // Fix left-to-right
    fixTimer = setInterval(() => {
      if (currentStep < finalText.length) {
        while (
          finalText[currentStep] === " " &&
          currentStep < finalText.length
        ) {
          fixed[currentStep] = true;
          currentStep++;
        }
        fixed[currentStep] = true;
        currentStep++;
      } else {
        clearInterval(scrambleTimer);
        clearInterval(fixTimer);
        el.textContent = finalText;
      }
    }, fixInterval);
  });
};

document.addEventListener("DOMContentLoaded", () => {
  window.scrambleTitle();
});
