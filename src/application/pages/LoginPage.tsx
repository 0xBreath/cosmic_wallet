import React from "react";
import { useEffect, useState } from "react";

import { WalletSeedManager } from "../../core";
import {
  DialogForm,
  LoadingIndicator,
  useExtension,
  useIsExtensionWidth,
} from "..";
import { validateMnemonic } from "bip39";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Container,
  DialogActions,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Link,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { Keypair } from "@solana/web3.js";
import {
  copyToClipboard,
  customTheme,
  LockedMnemonicAndSeed,
  MnemonicAndSeed,
} from "../../shared";
import { observer } from "mobx-react";

export const LoginPage = observer(() => {
  const seedModel = WalletSeedManager.instance;

  const [restore, setRestore] = useState(false);

  if (
    !seedModel.hasLockedMnemonicAndSeed ||
    (seedModel.hasLockedMnemonicAndSeed &&
      seedModel.hasLockedMnemonicAndSeed.loading)
  ) {
    return null;
  }

  // const extension = useIsExtensionWidth();

  return (
    <Container
      maxWidth="sm"
      // style={{
      //   marginBottom: extension ? "30px" : 0,
      // }}
    >
      {restore ? (
        <RestoreWalletForm goBack={() => setRestore(false)} />
      ) : (
        <>
          {seedModel.hasLockedMnemonicAndSeed.hasLockedMnemonic ? (
            <LoginForm />
          ) : (
            <CreateWalletForm />
          )}
          <br />
          <Link style={{ cursor: "pointer" }} onClick={() => setRestore(true)}>
            Restore existing wallet
          </Link>
        </>
      )}
    </Container>
  );
});

const CreateWalletForm = observer(() => {
  const seedModel = WalletSeedManager.instance;
  const [_newMAndS, _setNewMAndS] = useState<MnemonicAndSeed | null>(null);

  useEffect(() => {
    seedModel.generateMnemonicAndSeed().then((res) => {
      _setNewMAndS(res);
    });
  }, []);
  const [savedWords, setSavedWords] = useState(false);

  function submit(password: string) {
    if (!_newMAndS) {
      console.error("No mnemonic and seed in CreateWalletForm");
      return;
    }
    const { mnemonic, seed } = _newMAndS;
    if (!mnemonic || !seed) {
      console.error("No mnemonic or seed in CreateWalletForm");
      return;
    }
    seedModel.storeMnemonicAndSeed(
      mnemonic,
      seed,
      password,
      WalletSeedManager.DERIVATION_PATHS.bip44Change,
    );
  }

  if (!savedWords && _newMAndS) {
    return (
      <SeedWordsForm
        newMnemonicAndSeed={_newMAndS}
        goForward={() => setSavedWords(true)}
      />
    );
  }

  return (
    <ChoosePasswordForm goBack={() => setSavedWords(false)} onSubmit={submit} />
  );
});

const SeedWordsForm = observer(
  ({
    newMnemonicAndSeed,
    goForward,
  }: {
    newMnemonicAndSeed: MnemonicAndSeed;
    goForward: () => void;
  }) => {
    const { mnemonic, seed } = newMnemonicAndSeed;
    if (!mnemonic || !seed) {
      console.error("No mnemonic or seed in SeedWordsForm");
      return null;
    }

    const seedModel = WalletSeedManager.instance;
    const [confirmed, setConfirmed] = useState(false);
    const [downloaded, setDownloaded] = useState(false);
    const [showDialog, setShowDialog] = useState(false);
    const [seedCheck, setSeedCheck] = useState("");

    const downloadMnemonic = (mnemonic?: string): void => {
      if (!mnemonic) return;
      const url = window.URL.createObjectURL(new Blob([mnemonic]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "cosmic.txt");
      document.body.appendChild(link);
      link.click();
      copyToClipboard(mnemonic);
    };

    return (
      <>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Create New Wallet
            </Typography>
            <Typography paragraph>
              Create a new wallet to hold Solana and SPL tokens.
            </Typography>
            <Typography>
              Please write down the following twenty four words and keep them in
              a safe place:
            </Typography>
            {newMnemonicAndSeed ? (
              <TextField
                variant="outlined"
                fullWidth
                multiline
                margin="normal"
                value={newMnemonicAndSeed.mnemonic}
                label="Seed Words"
                onFocus={(e) => e.currentTarget.select()}
              />
            ) : (
              <LoadingIndicator />
            )}
            <Typography paragraph>
              Your private keys are only stored on your current computer or
              device. You will need these words to restore your wallet if your
              browser's storage is cleared or your device is damaged or lost.
            </Typography>
            <Typography paragraph>
              By default, Cosmic will use <code>m/44'/501'/0'/0'</code>{" "}
              (Bip44Change) as the derivation path for the main wallet. To use
              an alternative path, try restoring an existing wallet.
            </Typography>
            <Typography paragraph>
              <b>Note:</b> For certain users, Cosmic may <b>NOT</b> be secure.
              See{" "}
              <a
                style={{ color: "inherit" }}
                href="https://medium.com/metamask/security-notice-extension-disk-encryption-issue-d437d4250863"
                target="__blank"
              >
                this article
              </a>{" "}
              to understand if you are at risk.
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={confirmed}
                  disabled={!newMnemonicAndSeed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
              }
              label="I have saved these words in a safe place."
            />
            <Typography paragraph>
              <Button
                variant="contained"
                color="primary"
                style={{ marginTop: 20 }}
                onClick={() => {
                  downloadMnemonic(newMnemonicAndSeed.mnemonic);
                  setDownloaded(true);
                }}
              >
                Download Backup Mnemonic File (Required)
              </Button>
            </Typography>
          </CardContent>
          <CardActions style={{ justifyContent: "flex-end" }}>
            <Button
              color="primary"
              disabled={!confirmed || !downloaded}
              onClick={() => setShowDialog(true)}
            >
              Continue
            </Button>
          </CardActions>
        </Card>
        <DialogForm
          open={showDialog}
          onClose={() => setShowDialog(false)}
          onSubmit={goForward}
          fullWidth
        >
          <div
            style={{ backgroundColor: customTheme.dark, padding: "10px 20px" }}
          >
            <Typography variant="h2">Confirm Mnemonic</Typography>
            <Typography variant="body1">
              Please re-enter your seed phrase to confirm that you have saved
              it.
            </Typography>
            <TextField
              label={`Please type your seed phrase to confirm`}
              fullWidth
              variant="outlined"
              margin="normal"
              value={seedCheck}
              onChange={(e) => setSeedCheck(e.target.value)}
            />
          </div>
          <DialogActions>
            <Button onClick={() => setShowDialog(false)}>Close</Button>
            <Button
              type="submit"
              color="secondary"
              disabled={
                seedModel.normalizeMnemonic(seedCheck) !==
                newMnemonicAndSeed.mnemonic
              }
            >
              Continue
            </Button>
          </DialogActions>
        </DialogForm>
      </>
    );
  },
);

function ChoosePasswordForm({
  goBack,
  onSubmit,
}: {
  goBack: () => void;
  onSubmit: (password: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Choose a Password (Optional)
        </Typography>
        <Typography>
          Optionally pick a password to protect your wallet.
        </Typography>
        <TextField
          variant="outlined"
          fullWidth
          margin="normal"
          label="New Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TextField
          variant="outlined"
          fullWidth
          margin="normal"
          label="Confirm Password"
          type="password"
          autoComplete="new-password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
        />
        <Typography>
          If you forget your password you will need to restore your wallet using
          your seed words.
        </Typography>
      </CardContent>
      <CardActions style={{ justifyContent: "space-between" }}>
        <Button onClick={goBack}>Back</Button>
        <Button
          color="primary"
          disabled={password !== passwordConfirm}
          onClick={() => onSubmit(password)}
        >
          Create Wallet
        </Button>
      </CardActions>
    </Card>
  );
}

const LoginForm = observer(() => {
  const seedModel = WalletSeedManager.instance;
  const [password, setPassword] = useState("");
  const [stayLoggedIn, setStayLoggedIn] = useState(false);

  const submit = () => {
    seedModel.loadMnemonicAndSeed(password, stayLoggedIn);
  };
  const submitOnEnter = (e: any) => {
    if (e.code === "Enter" || e.code === "NumpadEnter") {
      e.preventDefault();
      e.stopPropagation();
      submit();
    }
  };
  const setPasswordOnChange = (e: any) => setPassword(e.target.value);
  const toggleStayLoggedIn = (e: any) => setStayLoggedIn(e.target.checked);

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Unlock Wallet
        </Typography>
        <TextField
          variant="outlined"
          fullWidth
          margin="normal"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPasswordOnChange}
          onKeyDown={submitOnEnter}
        />
        <FormControlLabel
          control={
            <Checkbox checked={stayLoggedIn} onChange={toggleStayLoggedIn} />
          }
          label="Keep wallet unlocked"
        />
      </CardContent>
      <CardActions style={{ justifyContent: "flex-end" }}>
        <Button color="primary" onClick={submit}>
          Unlock
        </Button>
      </CardActions>
    </Card>
  );
});

const RestoreWalletForm = observer(({ goBack }: { goBack: () => void }) => {
  const seedModel = WalletSeedManager.instance;
  const [rawMnemonic, setRawMnemonic] = useState("");
  const [seed, setSeed] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [next, setNext] = useState(false);

  const mnemonic = seedModel.normalizeMnemonic(rawMnemonic);
  const isNextBtnEnabled =
    password === passwordConfirm && validateMnemonic(mnemonic);
  const displayInvalidMnemonic =
    validateMnemonic(mnemonic) === false && mnemonic.length > 0;
  return (
    <>
      {next ? (
        <DerivedAccounts
          goBack={() => setNext(false)}
          mnemonic={mnemonic}
          password={password}
          seed={seed}
        />
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Restore Existing Wallet
            </Typography>
            <Typography>
              Restore your wallet using your twelve or twenty-four seed words.
              Note that this will delete any existing wallet on this device.
            </Typography>
            <br />
            <Typography fontWeight="fontWeightBold">
              <b>Do not enter your hardware wallet seedphrase here.</b> Hardware
              wallets can be optionally connected after a web wallet is created.
            </Typography>
            {displayInvalidMnemonic && (
              <Typography fontWeight="fontWeightBold" style={{ color: "red" }}>
                Mnemonic validation failed. Please enter a valid BIP 39 seed
                phrase.
              </Typography>
            )}
            <TextField
              variant="outlined"
              fullWidth
              multiline
              rows={3}
              margin="normal"
              label="Seed Words"
              value={rawMnemonic}
              onChange={(e: any) => setRawMnemonic(e.target.value)}
            />
            <TextField
              variant="outlined"
              fullWidth
              margin="normal"
              label="New Password (Optional)"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
            />
            <TextField
              variant="outlined"
              fullWidth
              margin="normal"
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
          </CardContent>
          <CardActions style={{ justifyContent: "space-between" }}>
            <Button onClick={goBack}>Cancel</Button>
            <Button
              color="primary"
              disabled={!isNextBtnEnabled}
              onClick={() => {
                seedModel.mnemonicToSeed(mnemonic).then((seed) => {
                  setSeed(seed);
                  setNext(true);
                });
              }}
            >
              Next
            </Button>
          </CardActions>
        </Card>
      )}
    </>
  );
});

const DerivedAccounts = observer(
  ({
    goBack,
    mnemonic,
    seed,
    password,
  }: {
    goBack: () => void;
    mnemonic: string;
    seed: string;
    password: string;
  }) => {
    const seedModel = WalletSeedManager.instance;
    const [dPathMenuItem, setDPathMenuItem] = useState(
      DerivationPathMenuItem.Bip44Change,
    );
    const accounts = [...Array(10)].map((_, idx) => {
      return seedModel.seedToKeypair(
        seed,
        idx,
        toDerivationPath(dPathMenuItem),
      );
    });

    function submit() {
      const dpath = toDerivationPath(dPathMenuItem);
      if (!dpath) {
        console.error("Invalid derivation path");
        return;
      }
      seedModel.storeMnemonicAndSeed(mnemonic, seed, password, dpath);
    }

    return (
      <Card>
        <AccountsSelector
          showDeprecated={true}
          accounts={accounts}
          dPathMenuItem={dPathMenuItem}
          setDPathMenuItem={setDPathMenuItem}
        />
        <CardActions style={{ justifyContent: "space-between" }}>
          <Button onClick={goBack}>Back</Button>
          <Button color="primary" onClick={submit}>
            Restore
          </Button>
        </CardActions>
      </Card>
    );
  },
);

export const AccountsSelector = observer(
  ({
    showRoot,
    showDeprecated,
    accounts,
    dPathMenuItem,
    setDPathMenuItem,
    onClick,
  }: {
    showRoot?: boolean;
    showDeprecated?: boolean;
    accounts: Keypair[];
    dPathMenuItem: number;
    setDPathMenuItem: (dPathMenuItem: number) => void;
    onClick?: (acc: any) => void;
  }) => {
    return (
      <CardContent>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h5" gutterBottom>
            Derivable Accounts
          </Typography>
          <FormControl variant="outlined">
            <Select
              value={dPathMenuItem}
              onChange={(e: any) => {
                setDPathMenuItem(e.target.value);
              }}
            >
              {showRoot && (
                <MenuItem value={DerivationPathMenuItem.Bip44Root}>
                  {`m/44'/501'`}
                </MenuItem>
              )}
              <MenuItem value={DerivationPathMenuItem.Bip44}>
                {`m/44'/501'/0'`}
              </MenuItem>
              <MenuItem value={DerivationPathMenuItem.Bip44Change}>
                {`m/44'/501'/0'/0'`}
              </MenuItem>
              {showDeprecated && (
                <MenuItem value={DerivationPathMenuItem.Deprecated}>
                  {`m/501'/0'/0/0 (deprecated)`}
                </MenuItem>
              )}
            </Select>
          </FormControl>
        </div>
      </CardContent>
    );
  },
);

// Material UI's Select doesn't render properly when using an `undefined` value,
// so we define this type and the subsequent `toDerivationPath` translator as a
// workaround.
//
// DERIVATION_PATH.deprecated is always undefined.
export const DerivationPathMenuItem = {
  Deprecated: 0,
  Bip44: 1,
  Bip44Change: 2,
  Bip44Root: 3, // Ledger only.
};

export function toDerivationPath(dPathMenuItem: number): string | undefined {
  switch (dPathMenuItem) {
    case DerivationPathMenuItem.Deprecated:
      return WalletSeedManager.DERIVATION_PATHS.deprecated;
    case DerivationPathMenuItem.Bip44:
      return WalletSeedManager.DERIVATION_PATHS.bip44;
    case DerivationPathMenuItem.Bip44Change:
      return WalletSeedManager.DERIVATION_PATHS.bip44Change;
    case DerivationPathMenuItem.Bip44Root:
      return WalletSeedManager.DERIVATION_PATHS.bip44Root;
    default:
      throw new Error(`invalid derivation path: ${dPathMenuItem}`);
  }
}
