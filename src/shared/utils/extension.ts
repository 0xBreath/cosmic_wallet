export const isExtension = window.location.protocol === "chrome-extension:";
export const isExtensionPopup = isExtension && window.opener;
