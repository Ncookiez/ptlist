import { DEFAULT_HEADERS } from './constants'
import { fetchVaultList } from './fetchVaultList'
import { Address, isAddress } from 'viem'

export const handleRequest = async (event: FetchEvent): Promise<Response> => {
  try {
    const url = new URL(event.request.url)

    // Route: "/{walletAddress}"
    const walletAddress = url.pathname.split('/')[1]
    if (!!walletAddress && isAddress(walletAddress)) {
      const vaultList = await fetchVaultList(event, walletAddress.toLowerCase() as Address)

      if (!!vaultList) {
        return new Response(JSON.stringify(vaultList), {
          ...DEFAULT_HEADERS,
          status: 200
        })
      } else {
        return new Response(null, {
          ...DEFAULT_HEADERS,
          status: 500
        })
      }
    }

    return new Response(JSON.stringify({ message: `Invalid request.` }), {
      ...DEFAULT_HEADERS,
      status: 400
    })
  } catch (e) {
    console.error(e)

    const errorResponse = new Response('Error', {
      ...DEFAULT_HEADERS,
      status: 500
    })
    errorResponse.headers.set('Content-Type', 'text/plain')

    return errorResponse
  }
}
