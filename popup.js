const url_pattern_input = document.getElementById("url_pattern");
const script_url_input = document.getElementById("script_url");
const add_button = document.getElementById("add_button");
const scripts_list = document.getElementById("scripts-list");

async function loadList() {
  const storage = await browser.storage.sync.get("list");
  const list = storage.list || [];
  
  if (list.length == 0)
    scripts_list.innerHTML = "none yet...";
  else
    scripts_list.innerHTML = "";

  list.forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = `${item.pattern} | ${item.script}`;

    const removeBtn = document.createElement("span");
    removeBtn.textContent = "✕";
    removeBtn.className = "remove-button";
    removeBtn.addEventListener("click", async () => {
      list.splice(index, 1);
      await browser.storage.sync.set({ list });
      loadList();
    });

    li.appendChild(removeBtn);
    scripts_list.appendChild(li);
  });
}

add_button.addEventListener("click", async () => {
  const url_pattern = url_pattern_input.value;
  const script_url = script_url_input.value;

  if (!url_pattern || !script_url)
    return;

  url_pattern_input.value = "";
  script_url_input.value = "";

  var storage = await browser.storage.sync.get("list");
  var list = storage.list

  list.push({pattern: url_pattern, script: script_url})

  await browser.storage.sync.set(storage);

  loadList();
});

loadList();

