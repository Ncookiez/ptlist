import { START_BLOCKS, START_TIME, SUPPORTED_NETWORKS, VIEM_CLIENTS } from './constants'
import { SUPPORTED_NETWORK } from './types'
import {
  getSecondsSinceEpoch,
  getVaultId,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  TokenWithSupply,
  TWAB_CONTROLLER_ADDRESSES,
  VaultInfo,
  VaultList,
  Vaults,
  Version
} from '@generationsoftware/hyperstructure-client-js'
import { Address, PublicClient } from 'viem'

export const getVaultList = async (walletAddress: Address) => {
  const vaultInfo: VaultInfo[] = []

  await Promise.allSettled(
    SUPPORTED_NETWORKS.map((network) =>
      (async () => {
        const networkVaults = await getVaultsFromTwab(network, walletAddress, VIEM_CLIENTS[network])
        vaultInfo.push(...networkVaults)
      })()
    )
  )

  const vaults = new Vaults(vaultInfo, VIEM_CLIENTS)

  const shareData = await vaults.getShareData()
  const tokenData = await vaults.getTokenData()

  const vaultList = formatVaultList(vaultInfo, walletAddress, shareData, tokenData)

  return vaultList
}

export const getVaultsFromTwab = async (
  chainId: SUPPORTED_NETWORK,
  walletAddress: Address,
  publicClient: PublicClient
): Promise<VaultInfo[]> => {
  const vaultAddresses = new Set<Address>()
  const ignoreList = new Set<Address>()

  const recordedObservations = await publicClient.getLogs({
    address: TWAB_CONTROLLER_ADDRESSES[chainId],
    event: {
      inputs: [
        { indexed: true, internalType: 'address', name: 'vault', type: 'address' },
        { indexed: true, internalType: 'address', name: 'user', type: 'address' },
        { indexed: false, internalType: 'uint96', name: 'balance', type: 'uint96' },
        { indexed: false, internalType: 'uint96', name: 'delegateBalance', type: 'uint96' },
        { indexed: false, internalType: 'bool', name: 'isNew', type: 'bool' },
        {
          components: [
            { internalType: 'uint128', name: 'cumulativeBalance', type: 'uint128' },
            { internalType: 'uint96', name: 'balance', type: 'uint96' },
            { internalType: 'uint32', name: 'timestamp', type: 'uint32' }
          ],
          indexed: false,
          internalType: 'struct ObservationLib.Observation',
          name: 'observation',
          type: 'tuple'
        }
      ],
      name: 'ObservationRecorded',
      type: 'event'
    },
    args: { user: walletAddress },
    fromBlock: START_BLOCKS[chainId],
    toBlock: 'latest',
    strict: true
  })

  const observations = [...recordedObservations].reverse()
  observations.forEach((obs) => {
    const vaultAddress = obs.args.vault.toLowerCase() as Address

    if (!ignoreList.has(vaultAddress)) {
      ignoreList.add(vaultAddress)

      if (obs.args.balance > 0n) {
        vaultAddresses.add(vaultAddress)
      }
    }
  })

  return [...vaultAddresses].map((vaultAddress) => ({ chainId, address: vaultAddress }))
}

export const formatVaultList = (
  allVaultInfo: VaultInfo[],
  walletAddress: Address,
  allShareData?: { [vaultId: string]: TokenWithSupply },
  allTokenData?: { [vaultId: string]: TokenWithSupply }
): VaultList => {
  const name = `${walletAddress}'s Vault List`
  const version = getDerivedVersionFromTime()
  const timestamp = new Date().toISOString()
  const keywords = ['pooltogether', 'v5', 'erc4626', 'ptlist']

  const tokens: VaultInfo[] = []

  allVaultInfo.forEach((vault) => {
    const vaultInfo = { ...vault }

    const vaultId = getVaultId(vault)
    const shareData = allShareData?.[vaultId]
    const tokenData = allTokenData?.[vaultId]

    if (!!shareData) {
      vaultInfo.name = shareData.name
      vaultInfo.symbol = shareData.symbol
      vaultInfo.decimals = shareData.decimals
    }

    if (!!tokenData) {
      vaultInfo.extensions = {
        underlyingAsset: {
          address: tokenData.address,
          name: tokenData.name,
          symbol: tokenData.symbol
        }
      }
    }

    tokens.push(vaultInfo)
  })

  const vaultList: VaultList = { name, version, timestamp, keywords, tokens }

  return vaultList
}

export const getDerivedVersionFromTime = (): Version => {
  const secondsNow = getSecondsSinceEpoch()
  const daysSinceStart = Math.floor((secondsNow - START_TIME) / SECONDS_PER_DAY)
  const hourOfDay = Math.floor(secondsNow / SECONDS_PER_HOUR) % 24
  return { major: 1, minor: daysSinceStart, patch: hourOfDay }
}

export const getVaultListTimestamp = (vaultList: VaultList): number => {
  return new Date(vaultList.timestamp).getTime() / 1_000
}

export const isDifferentList = (a: VaultList, b: VaultList) => {
  return getVaultListId(a) === getVaultListId(b)
}

export const getVaultListId = (vaultList: VaultList) => {
  const vaultIds = vaultList.tokens.map((vault) => getVaultId(vault))
  return vaultIds.join('')
}
