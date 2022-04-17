import { createInterBtcApi, CurrencyIdLiteral, newAccountId, newMonetaryAmount, newVaultId } from "@interlay/interbtc-api";
import { KBtc, KBtcAmount, Kusama } from "@interlay/monetary-js";
import { Keyring } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";

const PARACHAIN_URL="wss://api-testnet.interlay.io/parachain"


async function main() {
    await cryptoWaitReady();

    const keyring = new Keyring({ type: "sr25519" });
    const account = keyring.addFromUri("//Eve");
    // Alternatively, use a mnemonic
    // const account = keyring.addFromMnemonic("multiple word seed phrase used as private key etc");
    console.log(`Loaded account is: ${account.address}`);

    const interbtcApi = await createInterBtcApi(
        PARACHAIN_URL,
        "testnet",
        account
    );

    const totalIssuableAmount = await interbtcApi.vaults.getTotalIssuableAmount();
    console.log(`Total issuable kBTC: ${totalIssuableAmount.toHuman()}`);

    const vaultAccountIdString = "5FLReYpCt1L9XWEUWDDmpiJuCUaeeidbApEtMf23N2dquadw";
    const vaultAccountId = newAccountId(interbtcApi.api, vaultAccountIdString);
    const vaultId = newVaultId(interbtcApi.api, vaultAccountIdString, Kusama, KBtc);
    const vaultIssuableAmount = await interbtcApi.issue.getVaultIssuableAmount(
        vaultAccountId,
        CurrencyIdLiteral.KSM
    );
    console.log(`Issuable amount for vault ${vaultAccountIdString}: ${vaultIssuableAmount.toHuman()}`);

    // request to issue 0.1% of the vault's capacity
    const amountToIssue = vaultIssuableAmount.div(1000);
    console.log(`Issuing ${amountToIssue.str.BTC()} with ${vaultAccountId.toHuman()}...`);

    try {
        await interbtcApi.issue.request(amountToIssue, vaultAccountId, CurrencyIdLiteral.KSM);
    } catch (error) {
        console.log(error);        
    } finally {
        // disconnect when finished
        interbtcApi.api.disconnect();
    }
}

main().catch(console.error);

