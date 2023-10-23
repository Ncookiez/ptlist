import { cacheVaultList } from './cacheVaultList'
import {
  getDerivedVersionFromTime,
  getVaultList,
  getVaultListTimestamp,
  isDifferentList
} from './utils'
import {
  getSecondsSinceEpoch,
  isNewerVersion,
  SECONDS_PER_HOUR,
  VaultList
} from '@generationsoftware/hyperstructure-client-js'
import { Address } from 'viem'

export const fetchVaultList = async (
  event: FetchEvent,
  walletAddress: Address
): Promise<VaultList | null> => {
  try {
    const { value: rawCachedVaultList } = await VAULT_LISTS.getWithMetadata(walletAddress)

    if (!!rawCachedVaultList) {
      const cachedVaultList = JSON.parse(rawCachedVaultList) as VaultList

      const derivedVersion = getDerivedVersionFromTime()
      if (
        isNewerVersion(derivedVersion, cachedVaultList.version) &&
        getSecondsSinceEpoch() - SECONDS_PER_HOUR > getVaultListTimestamp(cachedVaultList)
      ) {
        const vaultList = await getVaultList(walletAddress)

        const isUpdated = isDifferentList(vaultList, cachedVaultList)
        if (isUpdated) {
          await cacheVaultList(event, vaultList, walletAddress)

          return vaultList
        } else {
          const updatedCachedVaultList: VaultList = {
            ...cachedVaultList,
            timestamp: new Date().toISOString()
          }

          await cacheVaultList(event, updatedCachedVaultList, walletAddress)

          return updatedCachedVaultList
        }
      } else {
        return cachedVaultList
      }
    } else {
      const vaultList = await getVaultList(walletAddress)

      await cacheVaultList(event, vaultList, walletAddress)

      return vaultList
    }
  } catch (e) {
    return null
  }
}
