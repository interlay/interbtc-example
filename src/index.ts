import { BitcoinCoreClient, createInterBtcApi, CurrencyIdLiteral, issueSingle, newAccountId, newMonetaryAmount, newVaultId } from "@interlay/interbtc-api";
import { KBtc, Kusama } from "@interlay/monetary-js";
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

    // Connect to Parachain
    const interbtcApi = await createInterBtcApi(
        PARACHAIN_URL,
        "testnet",
        account
    );

    // Connect to Bitcoin node
    const bitcoinCoreClient = new BitcoinCoreClient(
        "testnet", // network
        "188.166.54.236", // bitcoin node host
        "rpcuser", // bitcoin rpc user
        "rpcpassword", // bitcoin rpc pass
        "18332", // bitcoin node port
        "0x90b21007e68badf303c047ae076eb0e2f4448cbf50c3667345d51b5d96fc146b-KSM-KBTC" // bitcoin wallet
    );

    // Query Parachain
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

    // request to issue 0.01% of the vault's capacity
    const amountToIssue = vaultIssuableAmount.div(10000);
    console.log(`Issuing ${amountToIssue.str.BTC()} with ${vaultAccountId.toHuman()}...`);


    // Send Parachain extrinsic and Bitcoin tx
    try {
        // Use this to call `interbtcApi` directly, but then need to send btc tx separately
        // await interbtcApi.issue.request(amountToIssue, vaultAccountId, CurrencyIdLiteral.KSM);

        // `issueSingle` creates an issue request on the parachain
        // and then sends a BTC tx to the Vault.
        const issueRequest = await issueSingle(
            interbtcApi,
            bitcoinCoreClient,
            account,
            amountToIssue,
            vaultId
        );
        console.log(`Executed issue: ${issueRequest.request.id}`);
    } catch (error) {
        console.log(error);        
    } finally {
        // disconnect when finished
        interbtcApi.api.disconnect();
    }
}

main().catch(console.error);

