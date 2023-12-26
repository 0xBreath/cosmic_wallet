// export const isExtension = window.location.protocol === "chrome-extension:";
export const isExtension = window.chrome && chrome.runtime && chrome.runtime.id;
export const isExtensionPopup = isExtension && window.opener;
