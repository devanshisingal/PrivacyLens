chrome.tabs.onUpdated.addListener(
  async (tabId, changeInfo, tab) => {

    if (changeInfo.status !== "complete")
      return;

    if (!tab.url)
      return;

    if (
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://") ||
      tab.url.startsWith("edge://") ||
      tab.url.startsWith("about:")
    ) {
      return;
    }

    try {

      const url = new URL(tab.url);

      const domain = url.hostname;

      if (
        !domain ||
        domain === "localhost" ||
        domain === "newtab"
      ) {
        return;
      }

      const response = await fetch(
        "http://localhost:3000/api/history",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            domain
          })
        }
      );

      if (!response.ok) {
        console.error(
          "Backend returned:",
          response.status
        );
      }

    } catch (err) {
      console.error(
        "PrivacyLens tracking error:",
        err
      );
    }
  }
);