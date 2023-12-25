function initContentScript() {
  console.debug('extension content script loaded');

  window.addEventListener(
    "cosmic_wallet_injected_script_message",
    (event) => {
      chrome.runtime.sendMessage(
        {
          channel: "cosmic_wallet_contentscript_background_channel",
          // @ts-ignore
          data: event.detail,
        },
        (response) => {
          // Can return null response if window is killed
          if (!response) {
            return;
          }
          window.dispatchEvent(
            new CustomEvent("cosmic_wallet_contentscript_message", {
              detail: response,
            }),
          );
        },
      );
    },
  );
}
initContentScript();