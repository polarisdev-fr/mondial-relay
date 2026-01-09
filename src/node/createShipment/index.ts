import { CreateShipmentResponse, ShipContext, Shipment, ShipOutputOptions } from '../../types/ship'
import { generateXML } from '../lib'
import { ShipContextSchema, ShipmentSchema, ShipOutputOptionsSchema } from './schemas'

import axios from 'axios'

interface ShipParams {
  shipment: Shipment
  context: ShipContext
  outputOptions?: ShipOutputOptions
  // optional API version selector (V1 or V2). If not provided, defaults to V2.
  apiVersion?: 'V1' | 'V2'
  // optional custom API URL. When provided this takes precedence over apiVersion.
  apiUrl?: string
}

/**
 * Creates a Mondial Relay shipment. The parameters are validated before sending the request.
 * You can specify `apiVersion` ('V1' | 'V2') to use a known endpoint, or pass a custom
 * `apiUrl` which takes precedence over `apiVersion`.
 * @param {ShipParams} params - The shipment parameters, context and output options (see the {@link [types](../../../types/ship.d.ts)}).
 * @returns The raw response from the Mondial Relay API along with parsed data, such as the etiquette PDF link.
 * @example
 * ```ts
 * const data: CreateShipmentResponse = await createShipment({
 *     // check out the library's example for the full list of parameters
 *     apiVersion: 'V2' // or 'V1', or apiUrl: 'https://custom.endpoint/api/shipment'
 * })
 * ```
 *
 * Notes / assumptions:
 * - By default this uses the V2 endpoint used previously in this file.
 * - When selecting V1, a reasonable default URL is used, but you should prefer passing `apiUrl`
 *   if you need an exact known V1 endpoint (the older SOAP endpoints vary by integration).
 */
export default async function createShipment({
  context,
  shipment,
  outputOptions,
  apiVersion = 'V2',
  apiUrl,
}: ShipParams): Promise<CreateShipmentResponse> {
  // validation des données au préalable
  ShipContextSchema.parse(context)
  ShipmentSchema.parse(shipment)
  ShipOutputOptionsSchema.parse(outputOptions)

  // vérification Login et Password
  if (context.Login === 'fill in your login here' || context.Password === 'fill in your password here') {
    throw new Error('Login or Password is missing, please fill them in.')
  }

  const data = {
    ShipmentCreationRequest: {
      $: {
        xmlns: 'http://www.example.org/Request',
        'xmlns:xsd': 'http://www.w3.org/2001/XMLSchema',
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      },

      Context: {
        Login: context.Login,
        Password: context.Password,
        CustomerId: context.CustomerId,
        Culture: context.Culture || 'fr-FR',
        VersionAPI: context.VersionAPI || '1.0',
      },

      OutputOptions: {
        OutputFormat: outputOptions?.OutputFormat || 'A4',
        OutputType: outputOptions?.OutputType || 'PdfUrl',
      },

      ShipmentsList: {
        Shipment: {
          ...shipment,

          DeliveryMode: {
            $: {
              ...shipment.DeliveryMode,
            },
          },
          CollectionMode: {
            $: {
              ...shipment.CollectionMode,
            },
          },

          Parcels: {
            Parcel: {
              ...shipment.Parcels.Parcel,

              Weight: {
                $: {
                  ...shipment.Parcels.Parcel.Weight,
                },
              },

              ...(shipment.Parcels.Parcel.Depth && {
                Depth: {
                  $: {
                    ...shipment.Parcels.Parcel.Depth,
                  },
                },
              }),

              ...(shipment.Parcels.Parcel.Length && {
                Length: {
                  $: {
                    ...shipment.Parcels.Parcel.Length,
                  },
                },
              }),
            },
          },

          Sender: {
            Address: {
              ...shipment.Sender,
            },
          },

          Recipient: {
            Address: {
              ...shipment.Recipient,
            },
          },
        },
      },
    },
  }

  const xml = generateXML(data)

  // Determine endpoint: custom apiUrl takes precedence; otherwise pick based on apiVersion.
  // Defaults:
  // - V2 (default): official connect API used previously in this file.
  // - V1: older (assumed) endpoint. If you need a different V1 URL, pass `apiUrl` explicitly.
  const API_URL =
    apiUrl ||
    (apiVersion === 'V1'
      ? 'https://api.mondialrelay.com/WebService'
      : 'https://connect-api.mondialrelay.com/api/shipment')

  const response = await axios.post(API_URL, xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })

  const eventualError = response.data.statusListField?.find(e => e.levelField?.toLowerCase().includes('error'))
  if (eventualError) {
    throw new Error(`An error happened: "${eventualError.messageField}".`)
  }

  const sendingNumber = response.data.shipmentsListField[0].shipmentNumberField
  const etiquetteLink = response.data.shipmentsListField[0].labelListField.labelField.outputField

  return {
    sendingNumber,
    etiquetteLink,
    rawResponse: response.data,
  }
}
