interface Window {
  cosmic: any;
}

function initExtensionScript() {
  console.debug('Cosmic Wallet extension: script loaded');

  window.cosmic = {
    postMessage: (message): void => {
      const listener = (event) => {
        if (event.detail.id === message.id) {
          window.removeEventListener(
            "cosmic_wallet_contentscript_message",
            listener,
          );
          window.postMessage(event.detail);
        }
      };
      window.addEventListener("cosmic_wallet_contentscript_message", listener);

      window.dispatchEvent(
        new CustomEvent("cosmic_wallet_injected_script_message", {
          detail: message,
        }),
      );
    },
  };
}
initExtensionScript();