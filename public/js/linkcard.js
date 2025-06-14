document.addEventListener("DOMContentLoaded", async () => {
  const cards = document.querySelectorAll(".link-card");
  for (const card of cards) {
    const url = card.dataset.url;
    try {
      const res = await fetch(
        `https://api.microlink.io/?url=${encodeURIComponent(url)}`
      );
      const data = await res.json();
      if (data.status === "success") {
        const { title, description, image } = data.data;
        card.innerHTML = `
            <div class="border rounded-lg shadow p-4 flex">
              <img src="${image.url}" alt="${title}" class="w-20 h-20 object-cover mr-4" />
              <div>
                <div class="font-bold text-lg">${title}</div>
                <div class="text-sm text-gray-600">${description}</div>
                <div class="text-xs text-gray-400 mt-2">${url}</div>
              </div>
            </div>
          `;
      }
    } catch (err) {
      console.error("LinkCard Error:", err);
    }
  }
});
