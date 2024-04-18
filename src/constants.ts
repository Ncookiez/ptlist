import { SUPPORTED_NETWORK } from './types'
import { NETWORK } from '@generationsoftware/hyperstructure-client-js'
import { createPublicClient, http, PublicClient } from 'viem'
import { mainnet, optimism } from 'viem/chains'

export const DEFAULT_HEADERS = {
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Request-Method': '*',
    'Vary': 'Accept-Encoding, Origin',
    'Access-Control-Allow-Headers': '*',
    'Content-Type': 'application/json;charset=UTF-8'
  }
}

export const SUPPORTED_NETWORKS = [NETWORK.optimism] as const

export const START_TIME = 1_697_500_800

export const START_BLOCKS: Record<SUPPORTED_NETWORK, bigint> = {
  [NETWORK.optimism]: 118_900_000n
}

export const VIEM_CLIENTS: Record<NETWORK.mainnet | SUPPORTED_NETWORK, PublicClient> = {
  [NETWORK.mainnet]: createPublicClient({
    chain: mainnet,
    transport: http(MAINNET_RPC_URL)
  }) as PublicClient,
  [NETWORK.optimism]: createPublicClient({
    chain: optimism,
    transport: http(OPTIMISM_RPC_URL)
  }) as PublicClient
}
