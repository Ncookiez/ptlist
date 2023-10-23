import { VaultList } from '@generationsoftware/hyperstructure-client-js'
import { Address } from 'viem'

export const cacheVaultList = async (
  event: FetchEvent,
  vaultList: VaultList,
  walletAddress: Address
) => {
  event.waitUntil(VAULT_LISTS.put(walletAddress, JSON.stringify(vaultList)))
}
