import React, { useEffect } from "react";
import { CardContent, Divider, Tooltip, Typography } from "@mui/material";
import { WarningOutlined } from "@mui/icons-material";
import { CosmicWallet } from "../../wallet";

function toHex(buffer: any): any {
  return Array.prototype.map
    .call(buffer, (x) => ("00" + x.toString(16)).slice(-2))
    .join("");
}

export function SignFormContent({
  origin,
  message,
  messageDisplay,
  buttonRef,
}: {
  origin: string;
  message: any;
  messageDisplay: string;
  buttonRef: any;
}) {
  useEffect(() => {
    // brings window to front when we receive new instructions
    // this needs to be executed from wallet instead of adapter
    // to ensure chrome brings window to front
    window.focus();

    // Scroll to approve button and focus it to enable approve with enter.
    // Keep currentButtonRef in local variable, so the reference can't become
    // invalid until the timeout is over. this was happening to all
    // auto-approvals for unknown reasons.
    let currentButtonRef = buttonRef.current;
    if (currentButtonRef) {
      currentButtonRef.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => currentButtonRef.focus(), 50);
    }
  }, [buttonRef]);

  const wallet = CosmicWallet.instance;

  let messageTxt;
  switch (messageDisplay) {
    case "utf8":
      messageTxt = new TextDecoder().decode(message);
      break;
    case "hex":
      messageTxt = "0x" + toHex(message);
      break;
    case "diffieHellman":
      messageTxt = "Create Diffie-Hellman keys";
      break;
    default:
      throw new Error("Unexpected message type: " + messageDisplay);
  }

  const renderAction = () => {
    switch (messageDisplay) {
      case "utf8":
        return `Sign message with account ${wallet.publicKey}`;
      case "hex":
        return (
          <>
            <Tooltip
              title="Be especially cautious when signing arbitrary data, you must trust the requester."
              arrow
            >
              <WarningOutlined style={{ marginBottom: "-7px" }} />
            </Tooltip>{" "}
            {`Sign data with account ${wallet.publicKey}`}
          </>
        );
      case "diffieHellman":
        return `Create Diffie-Hellman keys`;
      default:
        throw new Error("Unexpected message display type: " + messageDisplay);
    }
  };

  return (
    <CardContent>
      <Typography variant="h6" gutterBottom>
        {`${origin} wants to:`}
      </Typography>
      <Typography
        variant="subtitle1"
        style={{ fontWeight: "bold" }}
        gutterBottom
      >
        {renderAction()}
      </Typography>
      <Divider style={{ margin: 20 }} />
      <Typography style={{ wordBreak: "break-all" }}>{messageTxt}</Typography>
      <Divider style={{ margin: 20 }} />
    </CardContent>
  );
}
